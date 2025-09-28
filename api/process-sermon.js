const OpenAI = require('openai');

// Simple in-memory rate limiting
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = parseInt(process.env.MAX_REQUESTS_PER_MINUTE || '10');

function checkRateLimit(clientId) {
  const now = Date.now();
  const clientData = requestCounts.get(clientId) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };

  // Reset if window has passed
  if (now > clientData.resetTime) {
    clientData.count = 0;
    clientData.resetTime = now + RATE_LIMIT_WINDOW;
  }

  // Check if limit exceeded
  if (clientData.count >= MAX_REQUESTS) {
    return false;
  }

  // Increment count
  clientData.count++;
  requestCounts.set(clientId, clientData);

  // Clean up old entries (prevent memory leak)
  if (requestCounts.size > 1000) {
    const oldestKey = requestCounts.keys().next().value;
    requestCounts.delete(oldestKey);
  }

  return true;
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get client IP for rate limiting
    const clientId = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';

    // Check rate limit
    if (!checkRateLimit(clientId)) {
      return res.status(429).json({
        error: 'Too many requests. Please wait a minute before trying again.',
        retryAfter: 60
      });
    }

    // Validate API key exists
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Parse request body
    const { transcription, bibleVersion = 'NKJV' } = req.body;

    if (!transcription) {
      return res.status(400).json({ error: 'Transcription is required' });
    }

    // Limit transcription length to prevent abuse
    const MAX_TRANSCRIPTION_LENGTH = 10000;
    if (transcription.length > MAX_TRANSCRIPTION_LENGTH) {
      return res.status(400).json({
        error: `Transcription too long. Maximum ${MAX_TRANSCRIPTION_LENGTH} characters allowed.`
      });
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Create the prompt for sermon analysis
    const prompt = `Please analyze this church sermon transcription and provide:
      1. A comprehensive summary (2-3 paragraphs)
      2. 5 key takeaways (as an array of strings)
      3. 5 small group discussion questions (as an array of strings)
      4. Detailed sermon notes with scripture references (use ${bibleVersion} translation when referencing)
      5. Detected scripture references (as an array of objects with {reference, text} format)
      6. 3 action steps for the week (as an array of strings)
      7. A prayer based on the sermon message

      Transcription: ${transcription}

      Return as JSON with keys: summary, keyTakeaways, discussionQuestions, sermonNotes, scriptureReferences, actionSteps, prayer`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarizes church sermons and creates study materials. Always format responses as valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    // Parse the response
    let parsedContent;
    try {
      parsedContent = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      // Fallback response
      parsedContent = {
        summary: completion.choices[0].message.content.substring(0, 500),
        keyTakeaways: [
          'Key point from the sermon',
          'Another important insight',
          'Spiritual application',
          'Biblical truth discussed',
          'Call to action'
        ],
        discussionQuestions: [
          'How does this message apply to your life?',
          'What challenged you the most?',
          'How can we support each other in this?',
          'What scripture stood out to you?',
          'What will you do differently this week?'
        ],
        sermonNotes: 'Sermon notes will appear here',
        scriptureReferences: [],
        actionSteps: [
          'Pray about the message daily',
          'Read the referenced scriptures',
          'Apply one principle this week'
        ],
        prayer: 'Lord, help us apply the truths from this message to our lives. Amen.'
      };
    }

    // Add metadata
    const response = {
      ...parsedContent,
      processedAt: new Date().toISOString(),
      bibleVersion: bibleVersion,
      wordCount: transcription.split(/\s+/).length
    };

    // Send successful response
    res.status(200).json(response);

  } catch (error) {
    console.error('Error processing sermon:', error);

    // Handle specific OpenAI errors
    if (error.response?.status === 429) {
      return res.status(429).json({
        error: 'AI service is currently busy. Please try again in a few moments.'
      });
    }

    if (error.response?.status === 401) {
      return res.status(500).json({
        error: 'Server authentication error. Please contact support.'
      });
    }

    // Generic error response
    res.status(500).json({
      error: 'Failed to process sermon. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};