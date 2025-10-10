from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import json
import asyncio
import os
from pathlib import Path
from typing import List, Optional
import pandas as pd
import google.generativeai as genai
from dotenv import load_dotenv
from datetime import datetime
import subprocess
import sys
import uuid

# Import our existing ExcelGPT classes
from excelgpt_classes import Config, DataLoader, InsightsAgent

# Load environment variables
load_dotenv()

app = FastAPI(title="ExcelGPT API", version="1.0.0")

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=False,  # Must be False when using allow_origins=["*"]
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Global variables for managing data
class AnalysisManager:
    def __init__(self):
        self.config: Optional[Config] = None
        self.data_loader: Optional[DataLoader] = None
        self.agent: Optional[InsightsAgent] = None
        self.initialized = False
        self.analysis_results = {}  # Store results by request_id

    async def initialize_excelgpt(self):
        """Initialize ExcelGPT components"""
        if self.initialized:
            return True
            
        try:
            self.config = Config()
            self.config.validate()
            
            self.data_loader = DataLoader(self.config)
            success = self.data_loader.load_all()
            
            if success:
                self.agent = InsightsAgent(self.config)
                self.initialized = True
                return True
            else:
                return False
        except Exception as e:
            print(f"Initialization error: {e}")
            return False

    async def process_query(self, query: str, request_id: str):
        """Process a query and store results"""
        if not self.initialized:
            self.analysis_results[request_id] = {
                "status": "error",
                "message": "ExcelGPT not initialized"
            }
            return

        try:
            # Store initial status
            self.analysis_results[request_id] = {
                "status": "processing",
                "message": "🤖 Generating analysis code...",
                "query": query
            }

            # Prepare context strings
            db_summary_str = json.dumps(self.data_loader.db_summary, indent=2)
            kpi_mapping_str = json.dumps(self.data_loader.kpi_mapping, indent=2)

            # Generate code
            generated_code = self.agent.generate_analysis_code(query, db_summary_str, kpi_mapping_str)
            
            # Update status
            self.analysis_results[request_id]["message"] = "⚡ Executing analysis..."

            # Execute the code
            result = await execute_analysis_code(generated_code)
            
            if result["success"]:
                # Generate insights
                self.analysis_results[request_id]["message"] = "📊 Generating insights..."
                insights = self.agent.generate_insight_summary(result["output"], query)
                
                # Store final result
                self.analysis_results[request_id] = {
                    "status": "completed",
                    "query": query,
                    "data_output": result["output"],
                    "insights": insights,
                    "generated_code": generated_code,
                    "timestamp": datetime.now().isoformat()
                }
            else:
                # Store error result
                self.analysis_results[request_id] = {
                    "status": "error",
                    "message": result["error"],
                    "generated_code": generated_code,
                    "timestamp": datetime.now().isoformat()
                }

        except Exception as e:
            self.analysis_results[request_id] = {
                "status": "error",
                "message": f"Analysis failed: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }

manager = AnalysisManager()

@app.on_event("startup")
async def startup_event():
    """Initialize ExcelGPT on startup"""
    print("🚀 Starting ExcelGPT API...")
    success = await manager.initialize_excelgpt()
    if success:
        print("✅ ExcelGPT initialized successfully!")
    else:
        print("❌ ExcelGPT initialization failed!")

@app.get("/")
async def root():
    return {"message": "ExcelGPT API is running!", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "excelgpt_initialized": manager.initialized,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/data/info")
async def get_data_info():
    """Get information about the loaded dataset"""
    if not manager.initialized:
        raise HTTPException(status_code=503, detail="ExcelGPT not initialized")
    
    return {
        "dataset_shape": manager.data_loader.df.shape,
        "columns": list(manager.data_loader.df.columns),
        "contexts": list(manager.data_loader.kpi_mapping.keys()),
        "brands": manager.data_loader.df['Brand'].unique().tolist()[:10],
        "time_periods": manager.data_loader.df['Time_Period'].unique().tolist()
    }

@app.post("/api/query")
async def submit_query(request: dict):
    """Submit a query for analysis"""
    query = request.get("query", "")
    request_id = str(uuid.uuid4())
    
    if not query:
        raise HTTPException(status_code=400, detail="Query is required")
    
    # Start processing in background
    asyncio.create_task(manager.process_query(query, request_id))
    
    return {"request_id": request_id, "status": "submitted"}

@app.get("/api/result/{request_id}")
async def get_result(request_id: str):
    """Get the result of a query"""
    if request_id not in manager.analysis_results:
        raise HTTPException(status_code=404, detail="Request not found")
    
    return manager.analysis_results[request_id]

async def execute_analysis_code(code: str):
    """Execute the generated analysis code"""
    try:
        # Create a temporary file for the code
        temp_file = f"temp_analysis_{uuid.uuid4().hex}.py"
        
        # Write code to file
        with open(temp_file, 'w') as f:
            f.write(code)
        
        # Execute the code
        result = subprocess.run(
            [sys.executable, temp_file], 
            capture_output=True, 
            text=True, 
            timeout=60
        )
        
        # Clean up temp file
        os.remove(temp_file)
        
        if result.returncode == 0:
            return {"success": True, "output": result.stdout}
        else:
            return {"success": False, "error": result.stderr}
            
    except subprocess.TimeoutExpired:
        return {"success": False, "error": "Analysis timed out after 60 seconds"}
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
