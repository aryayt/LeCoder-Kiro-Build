# EmbeddingGemma Models Integration

LeCodeR MVP now uses Google's EmbeddingGemma models via Hugging Face for vector embeddings.

## Available Models

### google/embeddinggemma-300m
- **Size**: 0.3B parameters
- **Use Case**: Sentence similarity, semantic search
- **Status**: Primary model for embeddings
- **Updated**: 4 days ago
- **Downloads**: 153k

### google/embeddinggemma-300m-qat-q4_0-unquantized  
- **Size**: 0.3B parameters (quantized)
- **Use Case**: Optimized for edge deployment
- **Updated**: 10 days ago
- **Downloads**: 3.89k

### google/embeddinggemma-300m-qat-q8_0-unquantized
- **Size**: 0.3B parameters (8-bit quantized)
- **Use Case**: Memory-efficient deployment
- **Updated**: 10 days ago  
- **Downloads**: 278

## Configuration

The application is configured to use `google/embeddinggemma-300m` by default. You can modify the model in:

```typescript
// src/lib/vector/embeddings.ts
async function generateHuggingFaceEmbeddings(
	texts: string[],
	apiKey: string,
	model = 'google/embeddinggemma-300m' // Change model here
): Promise<number[][]>
```

## API Usage

### Environment Setup
```bash
HUGGINGFACE_API_KEY="hf_your-token-here"
```

### Direct API Call Example
```javascript
const response = await fetch('https://api-inference.huggingface.co/models/google/embeddinggemma-300m', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer hf_your-token-here',
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        inputs: "Your text to embed",
        options: { wait_for_model: true }
    }),
});

const embedding = await response.json(); // Returns number[]
```

## Features

✅ **Latest Technology**: Uses Google's newest embedding models
✅ **Serverless Ready**: Works with Vercel Functions
✅ **Rate Limiting**: Built-in delays to respect API limits  
✅ **Error Handling**: Comprehensive error management
✅ **Fallback Support**: Multiple model options available
✅ **Free Tier**: Hugging Face provides generous free usage

## Integration Points

1. **PDF Processing**: Converts documents to embeddings for semantic search
2. **Vector Storage**: In-memory vector store with cosine similarity
3. **Real-time Search**: Find similar content chunks in uploaded papers
4. **User API Keys**: Users can provide their own HF tokens

## Performance

- **Embedding Dimension**: 768 (EmbeddingGemma)
- **Max Input Length**: ~512 tokens per request
- **Rate Limit**: 100ms delay between requests (configurable)
- **Cold Start**: ~2-3 seconds for model loading

## Migration from OpenAI/Google

The system now defaults to Hugging Face EmbeddingGemma but still supports:
- OpenAI text-embedding-3-small
- Google text-embedding-004

Users can choose their preferred provider in the application settings.

## Costs

- **Free Tier**: 30,000 characters/month
- **Pro**: $9/month for 10M characters
- **Enterprise**: Custom pricing

Much more cost-effective than OpenAI/Google for embeddings at scale.

## Vercel Deployment Notes

Per the [Vercel ML guide](https://vercel.com/guides/ml-models-hugging-face):

1. Add `HUGGINGFACE_API_KEY` to Vercel environment variables
2. Models auto-load on first request (may have cold start)
3. Edge runtime compatible for global performance
4. Automatic scaling based on usage

## Monitoring

Track usage at:
- [Hugging Face Usage Dashboard](https://huggingface.co/settings/billing)
- Model performance metrics in application logs
- Vector storage statistics via admin panel