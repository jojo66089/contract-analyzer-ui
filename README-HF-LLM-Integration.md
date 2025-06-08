# Hugging Face LLM Integration

This project integrates the LegalQwen14B model from Hugging Face for contract analysis.

## Setup

1. Create a `.env.local` file in the root directory with the following content:
   ```
   # Hugging Face settings
   HF_TOKEN=your_huggingface_token_here
   HF_MODEL_ID=jojo6608/LegalQwen14B
   ```

2. Install the required dependencies:
   ```bash
   npm install
   # If you need additional type definitions
   npm install -D @types/node
   ```

## Usage

The integration provides several components:

1. **API Endpoint**: `/api/llm` - Accepts POST requests with instruction and input text
2. **React Hook**: `useLegalLlm` - For consuming the API in React components
3. **UI Component**: `ContractQueryPanel` - A ready-to-use component for analyzing contract clauses

### Example Usage

```jsx
import ContractQueryPanel from '@/components/ContractQueryPanel';

export default function MyPage() {
  return (
    <div className="container mx-auto p-4">
      <ContractQueryPanel />
    </div>
  );
}
```

### Using the Hook Directly

```jsx
import { useLegalLlm } from '@/lib/hooks/useLegalLlm';

function MyComponent() {
  const { data, isLoading, error, execute } = useLegalLlm({
    instruction: "Analyze this contract clause",
    input: "The party shall deliver all goods within 30 days...",
  });
  
  return (
    <div>
      <button onClick={execute} disabled={isLoading}>
        Analyze
      </button>
      {data && <div>{data}</div>}
    </div>
  );
}
```

## Features

- **Streaming Responses**: Results are streamed back to the UI as they're generated
- **Error Handling**: Includes retry with exponential backoff for 503 errors
- **Typed API**: Full TypeScript support
- **Self-hosted Option**: Comments included for future self-hosted deployment 