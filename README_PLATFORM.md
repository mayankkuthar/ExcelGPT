# ExcelGPT Platform - ChatGPT-like Interface

## 🎯 Overview

This is a complete ChatGPT-like platform for ExcelGPT, featuring a React frontend and Python FastAPI backend. The platform provides a conversational interface for analyzing market research data using AI-powered code generation.

## 🏗️ Architecture

```
ExcelGPT Platform/
├── backend/                 # Python FastAPI backend
│   ├── main.py             # Main API server with WebSocket support
│   ├── excelgpt_classes.py # ExcelGPT core classes
│   ├── requirements.txt    # Python dependencies
│   └── vercel.json        # Vercel deployment config
├── frontend/               # React frontend
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   ├── index.js       # React entry point
│   │   └── index.css      # Tailwind CSS styles
│   ├── package.json       # Node.js dependencies
│   └── vercel.json       # Vercel deployment config
├── vercel.json            # Root Vercel configuration
├── deploy.sh              # Deployment script
└── README_PLATFORM.md     # This file
```

## 🚀 Features

### Frontend (React)
- **ChatGPT-like Interface**: Clean, modern chat UI with message bubbles
- **Real-time Communication**: WebSocket connection for live updates
- **Code Display**: Syntax-highlighted Python code with collapsible sections
- **Data Visualization**: Formatted data tables and analysis results
- **Responsive Design**: Works on desktop and mobile devices
- **Status Indicators**: Connection status and loading states

### Backend (FastAPI)
- **WebSocket Support**: Real-time bidirectional communication
- **ExcelGPT Integration**: Full integration with existing analysis classes
- **Error Handling**: Robust error recovery and retry logic
- **API Endpoints**: RESTful endpoints for health checks and data info
- **CORS Support**: Configured for frontend communication

## 🛠️ Setup Instructions

### Prerequisites
- Python 3.7+
- Node.js 16+
- Google Gemini API key
- Vercel account (for deployment)

### Local Development

1. **Clone and Setup**
   ```bash
   # Run the deployment script
   chmod +x deploy.sh
   ./deploy.sh
   ```

2. **Environment Variables**
   ```bash
   # Backend
   cd backend
   cp .env.example .env
   # Edit .env with your GOOGLE_API_KEY
   
   # Frontend
   cd ../frontend
   cp .env.example .env
   # Edit .env with your API URL
   ```

3. **Start Development Servers**
   ```bash
   # Terminal 1: Backend
   cd backend
   python main.py
   
   # Terminal 2: Frontend
   cd frontend
   npm start
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy Backend**
   ```bash
   cd backend
   vercel --prod
   ```

3. **Deploy Frontend**
   ```bash
   cd frontend
   vercel --prod
   ```

4. **Set Environment Variables**
   - In Vercel dashboard, add:
     - `GOOGLE_API_KEY`: Your Gemini API key
     - `REACT_APP_API_URL`: Your backend URL

## 💬 Usage

### Chat Interface
1. **Ask Questions**: Type natural language questions about your data
2. **Real-time Updates**: See status messages as analysis progresses
3. **View Results**: Get formatted insights with supporting data
4. **Inspect Code**: View the generated Python code (collapsible)

### Example Queries
- "What are the top 5 brands by Power in Brand Equity?"
- "How does brand awareness differ between Male and Female consumers?"
- "Show me the change in brand affinity from H1'23 to H2'25"
- "Which brands perform best among 18-24 year olds?"

## 🔧 Configuration

### Backend Configuration
```python
# In backend/main.py
API_BASE_URL = "your-backend-url"
CORS_ORIGINS = ["http://localhost:3000", "https://your-frontend.vercel.app"]
```

### Frontend Configuration
```javascript
// In frontend/src/App.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
```

## 📡 API Endpoints

### WebSocket
- `ws://localhost:8000/ws/{client_id}` - Real-time chat communication

### REST API
- `GET /` - Health check
- `GET /health` - Detailed health status
- `GET /data/info` - Dataset information

### WebSocket Message Types
```json
// Client to Server
{
  "type": "query",
  "query": "What are the top 5 brands?"
}

// Server to Client
{
  "type": "status",
  "message": "🤖 Generating analysis code..."
}

{
  "type": "result",
  "query": "What are the top 5 brands?",
  "data_output": "...",
  "insights": "...",
  "generated_code": "..."
}

{
  "type": "error",
  "message": "Analysis failed: ..."
}
```

## 🎨 UI Components

### Message Types
- **User Messages**: Right-aligned blue bubbles
- **Assistant Messages**: Left-aligned gray bubbles
- **Status Messages**: Loading indicators with spinner
- **Error Messages**: Red-themed error display
- **Code Blocks**: Syntax-highlighted Python code
- **Data Tables**: Formatted analysis results

### Responsive Design
- Mobile-first approach
- Flexible layout for different screen sizes
- Touch-friendly interface elements

## 🔒 Security

### Environment Variables
- API keys stored securely in Vercel environment
- No sensitive data in client-side code
- CORS properly configured

### Data Handling
- Temporary files cleaned up after execution
- No persistent storage of user queries
- Secure WebSocket connections

## 🚨 Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check if backend is running
   - Verify CORS settings
   - Check network connectivity

2. **Analysis Timeout**
   - Increase timeout in backend configuration
   - Check data file size and complexity
   - Verify API key is valid

3. **Build Failures**
   - Ensure all dependencies are installed
   - Check Python/Node.js versions
   - Verify environment variables

### Debug Mode
```bash
# Backend with debug logging
cd backend
python main.py --log-level debug

# Frontend with development tools
cd frontend
npm start
# Open browser dev tools for console logs
```

## 📈 Performance

### Optimization Features
- WebSocket for real-time communication
- Efficient data loading and caching
- Optimized React rendering
- Minimal bundle size with code splitting

### Scalability
- Stateless backend design
- Horizontal scaling support
- Efficient memory usage
- Connection pooling

## 🔮 Future Enhancements

### Planned Features
- User authentication and session management
- Query history and favorites
- Export functionality (PDF, Excel)
- Advanced data visualization
- Multi-language support
- Custom analysis templates

### Technical Improvements
- Redis for session management
- Database integration for query history
- Advanced caching strategies
- Performance monitoring
- Automated testing suite

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the console logs
3. Verify environment configuration
4. Check Vercel deployment logs

## 📄 License

This platform is designed for market research and business intelligence applications. Ensure compliance with your organization's data usage policies and API terms of service.

---

*ExcelGPT Platform - Bringing AI-powered market research analysis to the web.*
