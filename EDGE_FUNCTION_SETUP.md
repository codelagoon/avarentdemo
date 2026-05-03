# Edge Function Setup for AI Credit Analysis

The AI credit analysis feature uses a Supabase Edge Function to proxy requests to OpenRouter and NVIDIA NIM, avoiding CORS issues in the browser.

## Architecture

```
Browser → Supabase Edge Function → OpenRouter (Free Models) → NVIDIA NIM (Fallback) → Local Rules (Final)
```

## Setup Instructions

### 1. Edge Function Already Deployed ✅

The Edge Function is deployed at:
```
https://kkjrnlsmunacdcjleqjv.supabase.co/functions/v1/analyze-credit
```

### 2. Set Environment Variables (REQUIRED)

You need to set the API keys in the Supabase Dashboard:

1. Go to [Supabase Dashboard](https://app.supabase.com/project/kkjrnlsmunacdcjleqjv/functions)
2. Click on the **"analyze-credit"** function
3. Go to **"Secrets"** tab
4. Add these secrets:

| Secret Name | Value |
|------------|-------|
| `OPENROUTER_API_KEY` | `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` |
| `NVIDIA_API_KEY` | `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` |

### 3. Test the Function

Once secrets are set, run a scenario in the AVARENT Sentinel dashboard. You should see:
- Toast notification showing which AI model was used
- Decision confidence score
- Model provider (openrouter/nvidia/local)

## Free Models Available (No Cost!)

The Edge Function tries these OpenRouter free models in order:

1. **Google Gemma 2 9B** - `google/gemma-2-9b-it:free`
2. **Microsoft Phi-3 Mini** - `microsoft/phi-3-mini-4k-instruct:free`
3. **Meta Llama 3.1 8B** - `meta-llama/llama-3.1-8b-instruct:free`
4. **Hermes 3 405B** - `nousresearch/hermes-3-llama-3.1-405b:free`
5. **MythoMist 7B** - `gryphe/mythomist-7b:free`

If all OpenRouter models fail, it falls back to **NVIDIA NIM Llama 3.1 8B**.

If NVIDIA also fails, it uses the **local rule-based model** (no external API call).

## Features

- ✅ Real AI-powered credit decisions
- ✅ Fairness score calculation
- ✅ Risk factor identification
- ✅ Full reasoning explanation
- ✅ Latency tracking
- ✅ Automatic fallback chain
- ✅ CORS-free browser integration
- ✅ **Zero cost** using free tier models

## Security

- API keys are stored securely in Supabase Edge Function secrets
- Keys are never exposed to the browser
- Edge Function acts as a secure proxy
