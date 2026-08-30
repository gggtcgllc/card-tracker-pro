#!/bin/bash
# Quick Vercel Deployment Setup Script
# Run this to configure env vars and redeploy

echo "🚀 Card Tracker Pro - Vercel Deployment Setup"
echo "=============================================="
echo ""
echo "Step 1: Generate CRON_SECRET"
CRON_SECRET=$(openssl rand -hex 32)
echo "✅ CRON_SECRET generated: $CRON_SECRET"
echo ""

echo "Step 2: Get PRICECHARTING_API_KEY"
echo "📍 Visit: https://pricecharting.com/api"
echo "Copy your free API key and paste it when prompted:"
read -p "Enter PRICECHARTING_API_KEY: " PRICECHARTING_API_KEY

echo ""
echo "Step 3: Installing Vercel CLI..."
npm install -g vercel

echo ""
echo "Step 4: Linking to Vercel project..."
vercel link --yes

echo ""
echo "Step 5: Setting environment variables..."
vercel env add CRON_SECRET "$CRON_SECRET"
vercel env add PRICECHARTING_API_KEY "$PRICECHARTING_API_KEY"

echo ""
echo "Step 6: Triggering redeployment..."
vercel deploy --prod

echo ""
echo "✅ Deployment complete!"
echo "🌐 Visit your app at: https://card-tracker-pro-sandy.vercel.app"
