# Preach Point Backend

Secure serverless backend for the Preach Point mobile app. Protects OpenAI API keys and provides sermon processing capabilities.

## Features

- 🔒 **Secure OpenAI Integration** - API key hidden from client
- ⚡ **Serverless Architecture** - Deploys to Vercel for free
- 🚦 **Rate Limiting** - Prevents API abuse (10 requests/minute per IP)
- 📖 **Multi-Bible Support** - Supports 11 Bible translations
- 🔄 **Error Handling** - Graceful fallbacks and proper error responses
- 🌐 **CORS Enabled** - Works with mobile apps

## API Endpoints

### `POST /api/process-sermon`
Processes sermon transcriptions and generates study materials.

**Request Body:**
```json
{
  "transcription": "sermon text here...",
  "bibleVersion": "NKJV"
}
```

**Response:**
```json
{
  "summary": "2-3 paragraph summary",
  "keyTakeaways": ["point 1", "point 2", ...],
  "discussionQuestions": ["question 1", "question 2", ...],
  "sermonNotes": "formatted notes with scripture references",
  "scriptureReferences": [{"reference": "John 3:16", "text": "..."}],
  "actionSteps": ["step 1", "step 2", "step 3"],
  "prayer": "generated prayer based on sermon",
  "processedAt": "2024-01-01T00:00:00.000Z",
  "bibleVersion": "NKJV",
  "wordCount": 450
}
```

### `GET /api/health`
Health check endpoint.

## Deployment Instructions

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Deploy to Vercel
```bash
# From the preach-point-backend directory
vercel --prod
```

### 3. Set Environment Variables
In the Vercel dashboard:
- Go to Project Settings → Environment Variables
- Add: `OPENAI_API_KEY` = your OpenAI API key
- Optional: `MAX_REQUESTS_PER_MINUTE` = 10 (default)

### 4. Update Mobile App
In your React Native app, update the `BACKEND_API_URL`:
```javascript
const BACKEND_API_URL = 'https://your-project-name.vercel.app/api';
```

## Security Features

### Rate Limiting
- 10 requests per minute per IP address
- Automatic cleanup of rate limit data
- Returns 429 status when limit exceeded

### Input Validation
- Transcription length limited to 10,000 characters
- Required fields validation
- Error handling for malformed requests

### API Key Protection
- OpenAI API key stored as environment variable
- Never exposed to client applications
- Secure server-to-server communication only

## Supported Bible Versions

- KJV (King James Version)
- NKJV (New King James Version)
- NIV (New International Version)
- ESV (English Standard Version)
- NLT (New Living Translation)
- MSG (The Message)
- AMP (Amplified Bible)
- TPT (The Passion Translation)
- FNV (First Nations Version)
- CSB (Christian Standard Bible)
- NASB (New American Standard Bible)

## OpenAI API Usage

The backend uses OpenAI's GPT-4 Turbo model with:
- Temperature: 0.7 (balanced creativity/consistency)
- Max tokens: 2000
- JSON response format for structured output
- Optimized prompts for sermon analysis

## Error Handling

- 400: Bad request (missing/invalid data)
- 429: Too many requests (rate limit exceeded)
- 500: Server error (OpenAI API issues, etc.)
- Graceful fallbacks when AI processing fails

## Local Development

1. Copy environment variables:
```bash
cp .env.example .env
# Edit .env with your OpenAI API key
```

2. Install dependencies:
```bash
npm install
```

3. Run locally:
```bash
vercel dev
```

4. Test endpoints:
```bash
curl http://localhost:3000/api/health
```

## Cost Considerations

- Vercel: Free tier includes 100GB bandwidth/month
- OpenAI: ~$0.01-0.03 per sermon (depending on length)
- No database costs (stateless architecture)

Total estimated cost: $1-5/month for moderate usage

## Troubleshooting

### "Cannot connect to backend"
- Check the URL in mobile app settings
- Verify Vercel deployment was successful
- Test health endpoint in browser

### "Server authentication error"
- Verify OpenAI API key is set in Vercel environment variables
- Check API key has sufficient credits

### Rate limit errors
- Wait 1 minute between requests
- Consider increasing `MAX_REQUESTS_PER_MINUTE` for higher usage

## License

MIT License - see LICENSE file for details