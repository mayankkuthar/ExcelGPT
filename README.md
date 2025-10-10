# ExcelGPT - AI-Powered Market Research Data Analysis

## 📋 Project Overview

ExcelGPT is an intelligent data analysis system that leverages Google's Gemini AI to automatically generate Python code for analyzing market research data. The system processes user queries about market research data and produces comprehensive insights through automated code generation and execution.

## 🎯 What This Project Does

This project transforms natural language questions about market research data into executable Python analysis code, then generates human-readable insights. It's specifically designed for market research professionals who need to quickly analyze brand performance, consumer behavior, and market trends.

### Key Features:
- **Natural Language Processing**: Converts user questions into Python analysis code
- **Automated Code Generation**: Uses Google Gemini AI to create pandas-based analysis scripts
- **Error Recovery**: Automatically retries and fixes code when execution fails
- **Batch Processing**: Handles multiple queries simultaneously
- **Comprehensive Reporting**: Generates detailed insights with supporting data evidence

## 📁 Project Structure

```
ExcelGPT/
├── Data_Setup.ipynb              # Data preprocessing and setup notebook
├── Insights_CoPilot.ipynb        # Main AI analysis notebook
├── CONSOLIDATED_OUTPUT_DATA.csv  # Main market research dataset
├── context_kpi_mapping.json      # Context-KPI relationship mapping
├── db_summary.json              # Database schema and metadata
├── User Queries.xlsx            # Excel file containing user questions
└── README.md                    # This documentation file
```

## 🗃️ Data Structure

### Main Dataset (`CONSOLIDATED_OUTPUT_DATA.csv`)
The core dataset contains market research data with the following structure:

| Column | Description | Example Values |
|--------|-------------|----------------|
| `Brand` | Brand names | Albany, Sasko, Blue Ribbon, Sunbake |
| `Context` | Analysis context/category | Brand Equity, Familiarity, Gender, Age Bands |
| `KPI` | Key Performance Indicator | Power, Meaningful, Different, Salient |
| `value` | Numeric values (percentages/scores) | 21.96, 20.84, 17.74 |
| `Time_Period` | Time periods | H2 F25, H1 F25, H2 F24 |
| `Datacut` | Demographic segments | Total, Male, Female, 18-24 Years |

### Context Categories
The system supports 25+ analysis contexts including:
- **Brand Equity**: Power, Meaningful, Different, Salient
- **Demographics**: Gender, Age Bands, Province, Income
- **Consumer Behavior**: Familiarity, Consumer Typology, Affinity
- **Market Factors**: Share flow, Pricing, Worth, Imagery
- **Communication**: Media awareness, Unaided awareness

## 🚀 How It Works

### 1. Data Setup (`Data_Setup.ipynb`)
- Loads the main CSV dataset using pandas
- Generates database summary (`db_summary.json`) with column metadata
- Creates context-KPI mapping (`context_kpi_mapping.json`) for analysis guidance
- Provides data validation and preprocessing

### 2. AI Analysis Engine (`Insights_CoPilot.ipynb`)

#### Core Components:

**Configuration Class (`Config`)**
- Manages API keys and file paths
- Sets up output directories
- Configures retry logic and model parameters

**Data Loader (`DataLoader`)**
- Loads CSV data, database summary, and KPI mappings
- Validates file existence and data integrity
- Provides centralized data access

**AI Agent (`InsightsAgent`)**
- Interfaces with Google Gemini AI
- Generates Python analysis code from natural language queries
- Handles code regeneration on execution errors
- Creates human-readable insight summaries

#### Analysis Process:

1. **Query Processing**: User questions are loaded from Excel file
2. **Code Generation**: Gemini AI creates pandas-based analysis scripts
3. **Code Execution**: Generated scripts run with error handling
4. **Error Recovery**: Failed code is automatically regenerated (up to 2 retries)
5. **Insight Generation**: AI creates summary reports with data evidence
6. **Output Management**: Results saved to organized folder structure

### 3. Analytical Rules & Logic

The system follows strict analytical guidelines:

- **Time Handling**: Chronological sorting of time periods (H1'25, H2'25, etc.)
- **Demographics**: Defaults to "Total" when not specified
- **Brand/KPI Filtering**: Includes all brands/KPIs when not specified
- **Metric Exclusion**: Automatically excludes "Base" metrics from calculations
- **Change Calculations**: Proper time-series analysis with pivot tables
- **Ranking Logic**: Top/Bottom N analysis with proper sorting
- **Output Format**: Single pandas DataFrame with explanatory breakdowns

## 🛠️ Setup & Installation

### Prerequisites
- Python 3.7+
- Google Gemini API key
- Required Python packages (automatically installed)

### Installation Steps

1. **Clone/Download the project**
2. **Install dependencies** (handled automatically by the notebooks):
   ```bash
   pip install google-generativeai pandas python-dotenv openpyxl
   ```

3. **Set up API key**:
   - Create a `.env` file in the project root
   - Add your Google Gemini API key:
     ```
     GOOGLE_API_KEY=your_api_key_here
     ```

4. **Prepare your data**:
   - Ensure `CONSOLIDATED_OUTPUT_DATA.csv` is in the project root
   - Run `Data_Setup.ipynb` to generate metadata files
   - Prepare your questions in `User Queries.xlsx`

## 📊 Usage Instructions

### 1. Data Preparation
```python
# Run Data_Setup.ipynb first
# This generates db_summary.json and context_kpi_mapping.json
```

### 2. Configure Analysis
```python
# In Insights_CoPilot.ipynb, set your query range:
START_ID = 1
END_ID = 16  # Process queries 1-16
```

### 3. Run Analysis
```python
# Execute the batch processing function
run_batch_processing(START_ID, END_ID)
```

### 4. Review Results
- Individual results saved in `copilot_runs/run_ID_X_timestamp/`
- Consolidated report: `Batch_Run_Summary_timestamp.xlsx`

## 📈 Example Queries

The system can handle various types of market research questions:

- **Brand Performance**: "What are the top 5 brands by Power in Brand Equity?"
- **Demographic Analysis**: "How does brand awareness differ between Male and Female consumers?"
- **Time Trends**: "Show me the change in brand affinity from H1'23 to H2'25"
- **Market Segmentation**: "Which brands perform best among 18-24 year olds?"
- **Geographic Analysis**: "Compare brand performance across different provinces"

## 🔧 Configuration Options

### Model Settings
- **Model**: `gemini-2.5-flash` (configurable)
- **Max Retries**: 2 attempts for failed code
- **Timeout**: 60 seconds per script execution

### Output Settings
- **Output Directory**: `copilot_runs/`
- **File Formats**: Python scripts, text outputs, Markdown summaries
- **Batch Reports**: Excel format with consolidated results

## 🚨 Error Handling

The system includes robust error handling:

- **File Validation**: Checks for required files before processing
- **API Key Validation**: Ensures Google API key is configured
- **Code Execution Errors**: Automatic retry with error-based regeneration
- **Timeout Protection**: Prevents infinite execution loops
- **Data Validation**: Ensures data integrity throughout the process

## 📋 Output Structure

Each analysis run creates:

```
copilot_runs/
└── run_ID_1_2024-01-15_14-30-25/
    ├── generated_script_attempt_1.py    # Generated analysis code
    ├── data_output.txt                  # Raw analysis results
    └── final_summary.md                 # Human-readable insights
```

## 🔍 Key Features Explained

### Intelligent Code Generation
- Uses detailed prompts with data context and analytical rules
- Generates self-contained Python scripts
- Follows pandas best practices for data analysis

### Context-Aware Analysis
- Understands market research terminology
- Maps user questions to appropriate data contexts
- Handles complex demographic and temporal filtering

### Automated Error Recovery
- Detects execution failures
- Regenerates code based on error messages
- Maintains analysis intent while fixing technical issues

### Comprehensive Reporting
- Provides both raw data and interpreted insights
- Includes supporting evidence for conclusions
- Formats results for easy consumption

## 🎯 Use Cases

This system is ideal for:

- **Market Research Analysts**: Quick analysis of brand performance data
- **Business Intelligence Teams**: Automated insight generation
- **Data Scientists**: Rapid prototyping of analysis workflows
- **Consultants**: Client-ready analysis and reporting
- **Academic Researchers**: Systematic analysis of market data

## 🔮 Future Enhancements

Potential improvements could include:

- Support for additional data formats (JSON, Parquet)
- Integration with more AI models
- Real-time data streaming capabilities
- Advanced visualization generation
- Custom analytical rule configuration
- Multi-language support

## 📞 Support

For questions or issues:
1. Check the error messages in the notebook outputs
2. Verify your API key configuration
3. Ensure all required files are present
4. Review the data format requirements

## 📄 License

This project is designed for market research and business intelligence applications. Please ensure compliance with your organization's data usage policies and API terms of service.

---

*ExcelGPT - Transforming market research data into actionable insights through AI-powered analysis.*
