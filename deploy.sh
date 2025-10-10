#!/bin/bash

# ExcelGPT Deployment Script
echo "🚀 Starting ExcelGPT deployment..."

# Check if required files exist
echo "📋 Checking required files..."
required_files=(
    "CONSOLIDATED_OUTPUT_DATA.csv"
    "db_summary.json"
    "context_kpi_mapping.json"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Error: $file not found!"
        echo "Please run Data_Setup.ipynb first to generate the required files."
        exit 1
    fi
done

echo "✅ All required files found!"

# Copy data files to backend
echo "📁 Copying data files to backend..."
cp CONSOLIDATED_OUTPUT_DATA.csv backend/
cp db_summary.json backend/
cp context_kpi_mapping.json backend/

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
pip install -r requirements.txt
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "✅ Local setup complete!"
echo ""
echo "🔧 To run locally:"
echo "1. Backend: cd backend && python main.py"
echo "2. Frontend: cd frontend && npm start"
echo ""
echo "🌐 To deploy to Vercel:"
echo "1. Install Vercel CLI: npm i -g vercel"
echo "2. Run: vercel --prod"
echo ""
echo "📝 Don't forget to set your environment variables:"
echo "- GOOGLE_API_KEY in Vercel dashboard"
echo "- REACT_APP_API_URL for frontend"
