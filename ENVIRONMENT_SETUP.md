# 🔑 Environment Variables Setup Guide

## 📋 Overview

This guide shows you exactly how to set up environment variables in Vercel for your ExcelGPT platform.

## 🚨 Important: No Secret References

The `vercel.json` files now have empty environment variable placeholders. You need to set the **actual values** in the Vercel dashboard, not secret references.

## 🔧 Step-by-Step Setup

### 1. Backend Environment Variables

**Project**: Your backend project (e.g., `excelgpt-backend`)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click on your **backend project**
3. Click the **"Settings"** tab
4. Click **"Environment Variables"** in the left sidebar
5. Click **"Add New"**
6. Fill in the details:
   - **Name**: `GOOGLE_API_KEY`
   - **Value**: `your_actual_gemini_api_key_here`
   - **Environment**: Check all boxes (Production, Preview, Development)
7. Click **"Save"**

### 2. Frontend Environment Variables

**Project**: Your frontend project (e.g., `excelgpt-frontend`)

1. Go to your **frontend project** in Vercel
2. Click the **"Settings"** tab
3. Click **"Environment Variables"** in the left sidebar
4. Click **"Add New"**
5. Fill in the details:
   - **Name**: `REACT_APP_API_URL`
   - **Value**: `https://your-backend-project-name.vercel.app`
   - **Environment**: Check all boxes (Production, Preview, Development)
6. Click **"Save"**

## 📝 Example Values

### Backend Environment Variable
```
Name: GOOGLE_API_KEY
Value: AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Frontend Environment Variable
```
Name: REACT_APP_API_URL
Value: https://excelgpt-backend-abc123.vercel.app
```

## 🔄 After Setting Environment Variables

1. **Redeploy your projects**:
   - Go to the "Deployments" tab
   - Click the three dots on the latest deployment
   - Click "Redeploy"

2. **Or trigger a new deployment**:
   - Make a small change to your code
   - Push to GitHub
   - Vercel will automatically redeploy

## ✅ Verification

### Check Backend
Visit: `https://your-backend.vercel.app/health`
Should return:
```json
{
  "status": "healthy",
  "excelgpt_initialized": true,
  "timestamp": "2024-01-15T10:30:00"
}
```

### Check Frontend
Visit: `https://your-frontend.vercel.app`
- Should load the ExcelGPT interface
- Connection status should show "Connected to ExcelGPT"

## 🚨 Common Issues

### Issue: "Environment Variable references Secret which does not exist"
**Solution**: Make sure you're setting the actual value in Vercel dashboard, not using `@secret_name` format.

### Issue: Frontend can't connect to backend
**Solution**: 
1. Check that `REACT_APP_API_URL` points to your correct backend URL
2. Make sure backend CORS settings include your frontend URL
3. Redeploy both projects after making changes

### Issue: Backend shows "ExcelGPT not initialized"
**Solution**:
1. Verify `GOOGLE_API_KEY` is set correctly
2. Check that your data files are in the repository
3. Check Vercel function logs for detailed error messages

## 🔒 Security Notes

- ✅ Environment variables in Vercel are encrypted and secure
- ✅ Never commit API keys to your GitHub repository
- ✅ Use different API keys for development and production if needed
- ✅ You can update environment variables anytime without redeploying

## 📞 Need Help?

If you're still having issues:
1. Check the Vercel deployment logs
2. Verify your API key is valid
3. Make sure all data files are in your repository
4. Test locally first before deploying

---

**Your ExcelGPT platform should now deploy successfully! 🚀**
