from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for managing connections and data
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.config: Optional[Config] = None
        self.data_loader: Optional[DataLoader] = None
        self.agent: Optional[InsightsAgent] = None
        self.initialized = False

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

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

manager = ConnectionManager()

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
        "brands": manager.data_loader.df['Brand'].unique().tolist()[:10],  # First 10 brands
        "time_periods": manager.data_loader.df['Time_Period'].unique().tolist()
    }

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket)
    try:
        while True:
            # Wait for messages from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data.get("type") == "query":
                await handle_analysis_query(websocket, message_data.get("query", ""))
            elif message_data.get("type") == "ping":
                await manager.send_personal_message(json.dumps({"type": "pong"}), websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)

async def handle_analysis_query(websocket: WebSocket, query: str):
    """Handle analysis query from client"""
    if not manager.initialized:
        await manager.send_personal_message(
            json.dumps({
                "type": "error",
                "message": "ExcelGPT not initialized. Please try again."
            }), 
            websocket
        )
        return

    try:
        # Send initial response
        await manager.send_personal_message(
            json.dumps({
                "type": "status",
                "message": "🤖 Generating analysis code...",
                "timestamp": datetime.now().isoformat()
            }), 
            websocket
        )

        # Prepare context strings
        db_summary_str = json.dumps(manager.data_loader.db_summary, indent=2)
        kpi_mapping_str = json.dumps(manager.data_loader.kpi_mapping, indent=2)

        # Generate code
        generated_code = manager.agent.generate_analysis_code(query, db_summary_str, kpi_mapping_str)
        
        await manager.send_personal_message(
            json.dumps({
                "type": "status",
                "message": "⚡ Executing analysis...",
                "timestamp": datetime.now().isoformat()
            }), 
            websocket
        )

        # Execute the code
        result = await execute_analysis_code(generated_code, websocket)
        
        if result["success"]:
            # Generate insights
            await manager.send_personal_message(
                json.dumps({
                    "type": "status",
                    "message": "📊 Generating insights...",
                    "timestamp": datetime.now().isoformat()
                }), 
                websocket
            )
            
            insights = manager.agent.generate_insight_summary(result["output"], query)
            
            # Send final result
            await manager.send_personal_message(
                json.dumps({
                    "type": "result",
                    "query": query,
                    "data_output": result["output"],
                    "insights": insights,
                    "generated_code": generated_code,
                    "timestamp": datetime.now().isoformat()
                }), 
                websocket
            )
        else:
            # Send error result
            await manager.send_personal_message(
                json.dumps({
                    "type": "error",
                    "message": result["error"],
                    "generated_code": generated_code,
                    "timestamp": datetime.now().isoformat()
                }), 
                websocket
            )

    except Exception as e:
        await manager.send_personal_message(
            json.dumps({
                "type": "error",
                "message": f"Analysis failed: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }), 
            websocket
        )

async def execute_analysis_code(code: str, websocket: WebSocket):
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
