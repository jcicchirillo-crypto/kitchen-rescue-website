# Kitchen Rescue Website Deployment Guide

## Quick Deploy Options

### Option 1: Netlify (Easiest - Static Site)
1. Go to https://netlify.com
2. Sign up/login
3. Drag and drop your project folder
4. Your site will be live in minutes!

**Note:** This works for the frontend only. For full functionality (booking system, admin panel), you'll need Option 2.

### Option 2: Vercel (Full Stack - Recommended)
1. Go to https://vercel.com
2. Sign up/login with GitHub
3. Connect your GitHub repository
4. Deploy with one click

### Option 3: Railway (Full Stack Alternative)
1. Go to https://railway.app
2. Sign up/login
3. Connect GitHub repository
4. Deploy Node.js app

## Pre-Deployment Checklist

### ✅ Required Environment Variables
Create a `.env` file with:
```
PORT=3000
STRIPE_SECRET_KEY=sk_live_your_live_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_stripe_key
EMAIL_USER=your_email@domain.com
EMAIL_PASS=your_email_password
NODE_ENV=production
```

### ✅ Domain Setup
1. Buy domain (e.g., thekitchenrescue.co.uk)
2. Point DNS to your hosting provider
3. Set up SSL certificate (automatic with most hosts)

### ✅ Production Optimizations
- [ ] Update Stripe keys to live mode
- [ ] Set up real email service
- [ ] Configure QuickBooks (optional)
- [ ] Set up monitoring/analytics

## Files Ready for Deployment
- ✅ All HTML pages
- ✅ CSS and JavaScript
- ✅ Images and assets
- ✅ Admin panel (React build)
- ✅ Server.js (Node.js backend)
- ✅ Package.json with dependencies

## Next Steps
1. Choose your hosting provider
2. Set up environment variables
3. Deploy!
4. Test all functionality
5. Go live! 🚀
