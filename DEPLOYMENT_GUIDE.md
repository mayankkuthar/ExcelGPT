# 🚀 ExcelGPT Platform - Vercel Deployment Guide

## 📋 Prerequisites

Before deploying, make sure you have:
- ✅ GitHub account
- ✅ Vercel account (free tier available)
- ✅ Google Gemini API key
- ✅ Your ExcelGPT data files ready

## 🌐 Method 1: Deploy via Vercel Dashboard (Recommended)

### Step 1: Prepare Your Repository

1. **Create a new GitHub repository**:
   - Go to [GitHub.com](https://github.com)
   - Click "New repository"
   - Name it `excelgpt-platform`
   - Make it public (required for free Vercel deployment)
   - Initialize with README

2. **Upload your files**:
   ```bash
   # Clone your repository
   git clone https://github.com/YOUR_USERNAME/excelgpt-platform.git
   cd excelgpt-platform
   
   # Copy all the platform files here
   # (backend/, frontend/, vercel.json, etc.)
   
   # Commit and push
   git add .
   git commit -m "Initial ExcelGPT platform setup"
   git push origin main
   ```

### Step 2: Deploy Backend to Vercel

1. **Go to Vercel Dashboard**:
   - Visit [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"

2. **Import Backend**:
   - Select your GitHub repository
   - Choose "Import" for the backend
   - **Root Directory**: Set to `backend`
   - **Framework Preset**: Python
   - **Build Command**: Leave empty
   - **Output Directory**: Leave empty

3. **Configure Environment Variables**:
   - In project settings, go to "Environment Variables"
   - Click "Add New"
   - **Name**: `GOOGLE_API_KEY`
   - **Value**: `your_actual_gemini_api_key_here`
   - **Environment**: Production, Preview, Development (select all)
   - Click "Save"

4. **Deploy**:
   - Click "Deploy"
   - Wait for deployment to complete
   - Note the backend URL (e.g., `https://excelgpt-backend.vercel.app`)

### Step 3: Deploy Frontend to Vercel

1. **Create New Project for Frontend**:
   - In Vercel dashboard, click "New Project"
   - Select the same GitHub repository
   - **Root Directory**: Set to `frontend`
   - **Framework Preset**: Create React App
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

2. **Configure Environment Variables**:
   - Click "Add New"
   - **Name**: `REACT_APP_API_URL`
   - **Value**: `https://your-backend-project-name.vercel.app`
   - **Environment**: Production, Preview, Development (select all)
   - Click "Save"

3. **Deploy**:
   - Click "Deploy"
   - Wait for deployment to complete
   - Note the frontend URL (e.g., `https://excelgpt-frontend.vercel.app`)

### Step 4: Update Backend CORS Settings

1. **Update backend CORS**:
   - Go to your backend project in Vercel
   - Edit `backend/main.py`
   - Update the CORS origins:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=[
           "http://localhost:3000", 
           "https://your-frontend-url.vercel.app"  # Add your frontend URL
       ],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

2. **Redeploy backend**:
   - Commit and push changes
   - Vercel will auto-deploy

## 🔧 Method 2: Deploy with Vercel CLI

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Deploy Backend
```bash
cd backend
vercel --prod
# Follow the prompts to link to your GitHub repo
```

### Step 3: Deploy Frontend
```bash
cd frontend
vercel --prod
# Follow the prompts to link to your GitHub repo
```

## 📁 Required Files Structure

Make sure your GitHub repository has this structure:
```
excelgpt-platform/
├── backend/
│   ├── main.py
│   ├── excelgpt_classes.py
│   ├── requirements.txt
│   └── vercel.json
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vercel.json
├── CONSOLIDATED_OUTPUT_DATA.csv
├── db_summary.json
├── context_kpi_mapping.json
├── vercel.json
├── .gitignore
└── README.md
```

## 🔑 Environment Variables Setup

### Backend Environment Variables (in Vercel)
- `GOOGLE_API_KEY`: Your Google Gemini API key
- `PYTHON_VERSION`: `3.9` (optional)

### Frontend Environment Variables (in Vercel)
- `REACT_APP_API_URL`: Your backend Vercel URL

## 🚨 Important Notes

### Data Files
- Make sure `CONSOLIDATED_OUTPUT_DATA.csv`, `db_summary.json`, and `context_kpi_mapping.json` are in your repository root
- These files will be copied to the backend during deployment

### File Size Limits
- Vercel has file size limits (100MB for free tier)
- If your CSV is too large, consider:
  - Compressing the file
  - Using a database instead
  - Upgrading to Vercel Pro

### CORS Configuration
- Update CORS settings to include your frontend URL
- Test the connection between frontend and backend

## 🧪 Testing Your Deployment

1. **Test Backend**:
   - Visit: `https://your-backend.vercel.app/health`
   - Should return: `{"status": "healthy", "excelgpt_initialized": true}`

2. **Test Frontend**:
   - Visit: `https://your-frontend.vercel.app`
   - Should show the ExcelGPT chat interface
   - Connection status should show "Connected"

3. **Test Full Flow**:
   - Ask a question in the chat
   - Should see real-time updates and results

## 🔄 Auto-Deployment

Once set up, Vercel will automatically deploy when you push to your main branch:
```bash
git add .
git commit -m "Update ExcelGPT platform"
git push origin main
```

## 🆘 Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check Vercel build logs
   - Ensure all dependencies are in requirements.txt/package.json
   - Verify file paths are correct

2. **CORS Errors**:
   - Update CORS origins in backend
   - Check frontend API URL configuration

3. **Data Loading Issues**:
   - Verify data files are in repository
   - Check file paths in excelgpt_classes.py

4. **WebSocket Connection Failed**:
   - Ensure backend URL is correct
   - Check Vercel function timeout settings

### Getting Help
- Check Vercel deployment logs
- Review GitHub Actions logs (if using CI/CD)
- Test locally first before deploying

## 🎉 Success!

Once deployed, you'll have:
- ✅ A live ExcelGPT platform accessible via web browser
- ✅ Real-time chat interface for market research analysis
- ✅ Automatic deployments on code changes
- ✅ Professional, scalable hosting

Your ExcelGPT platform is now live and ready to analyze market research data! 🚀
