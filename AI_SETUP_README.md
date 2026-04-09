# AI-Powered Semantic Analysis Setup

## Overview
The semantic analysis system now uses OpenAI's Vision API to analyze landing page screenshots and provide detailed fold-by-fold analysis.

## Setup Instructions

### 1. Get OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key

### 2. Configure Environment Variables
Create a `.env.local` file in the project root with:

```bash
# OpenAI API Configuration
OPENAI_API_KEY=your_actual_api_key_here

# Database (already configured)
DATABASE_URL="file:./dev.db"
```

### 3. Cost Information
- **Per Analysis**: ~$0.012-0.016 (based on 1.7MB average screenshot size)
- **100 analyses**: ~$1.20-1.60
- **1000 analyses**: ~$12.00-16.00

### 4. Fallback Behavior
- If no API key is configured, the system falls back to rule-based analysis
- If screenshot is missing, falls back to rule-based analysis
- If API call fails, falls back to rule-based analysis

## How It Works

1. **Screenshot Analysis**: Uses GPT-4 Vision to analyze the actual page screenshot
2. **AI-Powered Insights**: Generates detailed fold-by-fold analysis based on visual content
3. **Same Format**: Maintains the same data structure as the previous rule-based system
4. **Enhanced Accuracy**: Provides more accurate and detailed analysis than rule-based approach

## Testing

1. Start the server: `npm run dev`
2. Go to Semantic Analysis page
3. Select a landing page
4. Click "Run Semantic Analysis"
5. The system will use AI analysis if API key is configured, otherwise fallback to rule-based

## Backup

The original rule-based implementation is saved as `src/app/api/semantic-analysis/route.ts.backup` for reference.
