import os
import json
import pandas as pd
import google.generativeai as genai
from dotenv import load_dotenv
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any
import subprocess
import sys

# --- 1. Centralized Configuration ---
class Config:
    """Holds all configuration settings for the co-pilot."""

    def __init__(self):
        load_dotenv()
        self.api_key: Optional[str] = os.getenv("GOOGLE_API_KEY")
        self.model_name: str = "gemini-2.5-flash"
        self.data_file_path: Path = Path("CONSOLIDATED_OUTPUT_DATA.csv")
        self.db_summary_path: Path = Path("db_summary.json")
        self.kpi_mapping_path: Path = Path("context_kpi_mapping.json")
        self.queries_file_path: Path = Path("User Queries.xlsx")
        self.output_dir: Path = Path("copilot_runs")
        self.output_dir.mkdir(exist_ok=True)
        self.max_retries: int = 2

    def validate(self):
        """Validates the configuration, especially the API key."""
        if not self.api_key:
            raise ValueError(
                '❌ API Key not found! Please create a .env file with GOOGLE_API_KEY="your_key".'
            )
        genai.configure(api_key=self.api_key)
        print("✅ API Key configured successfully!")


# --- 2. Data Handling Class ---
class DataLoader:
    """Handles loading all necessary data and context files."""

    def __init__(self, config: Config):
        self.config = config
        self.df: Optional[pd.DataFrame] = None
        self.db_summary: Optional[Dict] = None
        self.kpi_mapping: Optional[Dict] = None

    def load_all(self) -> bool:
        """Loads all data sources and returns True if successful."""
        try:
            print(f"⏳ Loading main data from '{self.config.data_file_path}'...")
            self.df = pd.read_csv(self.config.data_file_path)
            print(
                f"✅ Successfully loaded main data ({self.df.shape[0]} rows, {self.df.shape[1]} columns)."
            )

            print(f"⏳ Loading DB summary from '{self.config.db_summary_path}'...")
            with open(self.config.db_summary_path, "r") as f:
                self.db_summary = json.load(f)
            print("✅ Successfully loaded DB summary.")

            print(f"⏳ Loading KPI mapping from '{self.config.kpi_mapping_path}'...")
            with open(self.config.kpi_mapping_path, "r") as f:
                self.kpi_mapping = json.load(f)
            print("✅ Successfully loaded KPI mapping.")
            return True

        except FileNotFoundError as e:
            print(f"❌ ERROR: A required file was not found: {e.filename}")
            return False
        except Exception as e:
            print(f"❌ An error occurred during data loading: {e}")
            return False


# --- 3. Gemini Agent Class ---
class InsightsAgent:
    """Encapsulates all interactions with the Gemini API."""

    def __init__(self, config: Config):
        self.model = genai.GenerativeModel(config.model_name)
        self.config = config

    def generate_analysis_code(
        self, user_query: str, db_summary: str, kpi_mapping: str
    ) -> str:
        """Generates Python code using a refined, detailed prompt."""
        prompt = f"""
            You are a **world-class market research data analyst and Python developer**.  
            Your task is to generate a **fully self-contained Python script** that answers the user's analytical question with **high accuracy** using **pandas** and **numpy**.  

            You must strictly follow the **provided data context** and the **analytical playbook**.

            ---

            ### 1. User Question
            {user_query}

            ---

            ### 2. Data Source
            - The data is in a CSV file located at: {self.config.data_file_path.resolve()}
            - You must load the data **directly from this absolute path** (do not modify it).

            ---

            ### 3. Database Summary (`db_summary.json`)
            This JSON describes the table columns. Use it to understand dimensions and measures.  
            - Demographics are in the `"Datacut"` column.  
            - Time periods are in the `"Time_Period"` column.  
            - Numeric values are in the `"value"` column.  

            ```json
            {db_summary}
            ```
            ---

            ### 4. Context–KPI Mapping
            This JSON defines how to map Context and KPI/Brand correctly.  
            - First, filter by the relevant "Context" based on the user's question.  
            - Then, filter by "KPI" or "Brand".  
            
            ```json
            {kpi_mapping}
            ```

            ---

            ### 5. Analytical Playbook (STRICT RULES)

            **Time Handling** - `Time_Period` is formatted as `"H1'25"` (first half 2025).  
            - Always sort chronologically (not alphabetically).  

            **Demographics Logic** - If the user does not specify a demographic, default to `"Total"`.  

            **All Brands/KPIs**
            - If the user does not specify a brand or KPI, then instead of not applying any filter on brands/kpis, you must pass a filter to include **all** brands/KPIs present in the (`db_summary.json`).

            **Exclude Non-Analytical Metrics** - ALWAYS EXCLUDE "Unweighted Base", "Sample Size", and "Base" from calculations, averages, rankings, and outputs, unless explicitly requested by the user to include it.

            **Change Over Time** To calculate change:  
            a. Filter data.  
            b. Create a pivot with `Time_Period` as columns.  
            c. Subtract the older period's value from the newer period's value.  

            **Ranking Logic** For "Top/Bottom N" requests, use:  
            ```python
            df.sort_values(by="value", ascending=False).head(N)
            ```
            
            **Detail of Final Dataframe**
            - The final dataframe must explanatory. So instead of just the final number, include relevant summarized breakdowns used to arrive at the final answer.
            - For example:
                - If you are asked to find the top 5 brands, include the brand names and their values in the final output.
                - If you are asked for change over time, include both time periods and the calculated change.

            **Output Column** - Always use `"value"` column for calculations (these are given as absolute numbers, but represent percentage share except Base and Index Metrics).  

            ---

            ### 6. Final Script Requirements
            - Must be a complete, runnable Python script.  
            - Must use **pandas** and **numpy** only (no external libraries).  
            - Must produce a single pandas DataFrame named `result_df`.  
            - The final output must be a SINGLE pandas DataFrame printed to the console print(result_df.to_string())
            - Ensure no truncation, partial tables, or additional debug printouts.  

            ---

            ### OUTPUT FORMAT
            Your response should contain **only the Python script**.  
            Do not include explanations or extra commentary.
            """
        response = self.model.generate_content(prompt)
        code = response.text.strip()
        if "python" in code:
            code = code.split("python")[1].split("```")[0]
        return code.strip()

    def regenerate_code_on_error(self, failed_code: str, error_message: str, user_query: str) -> str:
        """Takes failed code and an error message, then asks the model to fix it."""
        prompt = f"""
            You are an expert Python debugging assistant.
            The following Python script, which was written to answer the question '{user_query}', failed during execution.

            ### FAILED SCRIPT
            ```python
            {failed_code}
            ```

            ### ERROR MESSAGE
            ```
            {error_message}
            ```

            ### INSTRUCTIONS
            1.  **Analyze** the error message and the original code.
            2.  **Correct the script** to resolve the error while still fulfilling the original user query.
            3.  **Adhere strictly** to all the original script requirements (use pandas/numpy, produce `result_df`, print with `to_string()`).
            4.  Your output must be **only the complete, corrected, runnable Python script**. Do not provide explanations, apologies, or any text other than the code itself.
            """
        print("🤖 Asking the agent to fix the code based on the error...")
        response = self.model.generate_content(prompt)
        code = response.text.strip()
        if "python" in code:
            code = code.split("python")[1].split("```")[0]
        return code.strip()

    def generate_insight_summary(self, data_table_string: str, user_query: str) -> str:
        """Generates a direct answer to the user's question with supporting data evidence."""
        prompt = f"""
        You are a senior market research analyst. Your task is to provide a clear, fact-based answer to the user's question.

        ### Original User Question:
        "{user_query}"

        ### Data Analysis Results:
        {data_table_string}

        ### Instructions:
        - **Values from Analysis:** Use only the data provided in the analysis results above. Do not assume or invent any data.
        - **Type of Values:** The values represent percentage shares or Index scores and not aboslute counts or numbers, except for Bases. So if a number is 25, it means 25% share or an Index of 25 not 25 counts.
        - **Direct Answer:** Start with a precise response to the user's question, framed as a clear statement.  
        - **Supporting Evidence (1-2 bullets):** Use the most relevant numbers, comparisons, or trends from the data to prove the answer.  
        - **Clarity:** Be concise, avoid fluff, and focus only on insights supported by the data provided.  
        - **Format:** Use Markdown for readability (headings, bold, bullet points where relevant).  
        """
        response = self.model.generate_content(prompt)
        return response.text.strip()
