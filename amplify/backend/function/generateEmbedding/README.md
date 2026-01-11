# Generate Embedding Lambda Function

This function generates text embeddings using the OpenAI API. It is designed to be used within an AWS Amplify project.

## Testing Locally

Create a `.env` file in this directory (`amplify/backend/function/generateEmbedding/.env`):

```env
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=test   
```

Then run the following command to mock the function locally:

```bash
amplify mock function generateEmbedding
```