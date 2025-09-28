#!/bin/bash

echo "🚀 Deploying Preach Point Backend to Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Deploy to production
echo "📤 Deploying to production..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Go to https://vercel.com/dashboard"
echo "2. Find your project and go to Settings → Environment Variables"
echo "3. Add OPENAI_API_KEY with your OpenAI API key"
echo "4. Update the BACKEND_API_URL in your React Native app"
echo ""
echo "🔗 Your backend will be available at: https://[your-project-name].vercel.app"