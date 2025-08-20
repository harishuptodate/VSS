# 🔒 Security Guide

## Overview

This project has been secured to prevent credential exposure and API key leaks.

## 🚨 Critical Security Changes Made

### 1. **Environment Variable Validation**

- All environment variables are now validated at startup
- Missing variables throw clear error messages
- No more silent failures with undefined values

### 2. **Client vs Server Separation**

- **Client-side**: Only uses `NEXT_PUBLIC_*` variables (safe for browser)
- **Server-side**: Uses private environment variables (never exposed to browser)

### 3. **API Key Protection**

- Service role keys are server-side only
- Anon keys are properly scoped for client use
- No more hardcoded secrets in client code

## 🔐 Environment Variables Setup

### **Required Environment Variables**

Create a `.env.local` file in your project root:

```bash
# ========================================
# PUBLIC VARIABLES (Safe for browser)
# ========================================
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# ========================================
# PRIVATE VARIABLES (Server-side only)
# ========================================
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/database"

# Supabase (Server-side)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# Storage
BUCKET_VIDEOS="videos"
BUCKET_THUMBS="thumbnails"

# Email (Resend)
RESEND_API_KEY="your-resend-api-key"
RESEND_FROM="noreply@yourdomain.com"

# Redis
REDIS_URL="redis://localhost:6379"

# Upload Limits
UPLOAD_MAX_BYTES=52428800

# TUS Upload
TUS_ENDPOINT="https://your-tus-endpoint.com"

# Health Check
ENABLE_HEALTH_CHECK=false
HEALTH_CHECK_PORT=3001

# Email Confirmation
REQUIRE_CONFIRMED_EMAIL=false
```

## 🛡️ Security Features

### **1. Supabase Security**

- **Anon Key**: Used for client-side operations (safe)
- **Service Role Key**: Used for server-side operations (secure)
- **Row Level Security**: Enforced on all database operations

### **2. API Route Security**

- All routes validate environment variables
- No hardcoded secrets in API responses
- Proper error handling without information leakage

### **3. Storage Security**

- Signed URLs with expiration times
- Bucket names validated from environment
- No direct bucket access from client

## 🚫 What NOT to Do

1. **Never commit `.env.local` to version control**
2. **Never expose service role keys to the browser**
3. **Never use `NEXT_PUBLIC_` prefix for sensitive data**
4. **Never log API keys or secrets**

## ✅ Security Checklist

- [ ] Environment variables are properly set
- [ ] `.env.local` is in `.gitignore`
- [ ] No hardcoded secrets in code
- [ ] Service role keys are server-side only
- [ ] Client-side code only uses public keys
- [ ] All API routes validate environment variables

## 🔍 Security Testing

To test your security setup:

1. **Check browser console**: No sensitive data should appear
2. **Check network tab**: No API keys in URLs or headers
3. **Check source code**: No hardcoded secrets
4. **Check environment**: All required variables are set

## 🆘 Troubleshooting

### **"Missing environment variable" errors**

- Check your `.env.local` file exists
- Verify all required variables are set
- Restart your development server

### **Supabase connection errors**

- Verify `SUPABASE_URL` is correct
- Check `SUPABASE_SERVICE_ROLE_KEY` is valid
- Ensure `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set

### **Storage errors**

- Verify bucket names in environment
- Check Supabase storage permissions
- Ensure service role key has storage access
