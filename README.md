# Contract Analyzer UI

A sophisticated legal-tech application built with Next.js that leverages AI to provide comprehensive contract analysis. The application enables users to upload legal documents (PDF/DOCX), automatically segment them into clauses, and receive detailed AI-powered analysis including risk assessment, ambiguity detection, and actionable recommendations.

## Features

- **Document Analysis**: Upload and analyze legal contracts (PDF/DOCX)
- **Clause Segmentation**: Automatic segmentation of contracts into clauses
- **Risk Assessment**: Identify high-risk clauses and overall contract risk
- **Ambiguity Detection**: Highlight ambiguous terms and clauses
- **Actionable Recommendations**: Receive suggestions for improving contract terms
- **Multi-language Support**: Translate analysis into multiple languages (EN/ES/PT/ZH)
- **Real-time Processing**: Stream analysis results as they're generated
- **PDF Export**: Generate comprehensive analysis reports

## Tech Stack

- **Frontend**: Next.js 14+ with App Router, React, TypeScript, Tailwind CSS
- **UI Components**: Shadcn/ui
- **Backend**: Next.js API Routes, Server-sent Events (SSE)
- **Data Storage**: Redis (Upstash)
- **AI/ML**: OpenAI API, Hugging Face Integration
- **Translation**: DeepL + OpenAI fallback
- **Vector Database**: Pinecone for RAG implementation

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- PNPM package manager

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/joshuaguillen/contract-analyzer-ui.git
   cd contract-analyzer-ui
   ```

2. Install dependencies
   ```bash
   pnpm install
   ```

3. Set up environment variables
   ```
   # Create a .env.local file with the following variables
   OPENAI_API_KEY=your_openai_api_key
   UPSTASH_REDIS_REST_URL=your_redis_url
   UPSTASH_REDIS_REST_TOKEN=your_redis_token
   HUGGINGFACE_API_KEY=your_hf_api_key
   DEEPL_API_KEY=your_deepl_api_key
   ```

4. Run the development server
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

This project can be easily deployed on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Configure the environment variables
4. Deploy

## License

[MIT](LICENSE) 