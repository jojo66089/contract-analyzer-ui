# Contract Analyzer UI

A sophisticated legal-tech application built with Next.js 14+ that leverages AI to provide comprehensive contract analysis. The application enables users to upload legal documents (PDF/DOCX), automatically segment them into clauses, and receive detailed AI-powered analysis including risk assessment, ambiguity detection, and actionable recommendations.

## Features

- **Contract Upload**: Support for PDF/DOCX documents
- **AI-Powered Analysis**: Detailed analysis of contract clauses with risk assessment
- **Translation Support**: Multi-language support (EN/ES/PT/ZH)
- **Real-time Streaming**: Server-sent events for live analysis updates
- **Export Functionality**: PDF generation with comprehensive reporting

## Tech Stack

- **Frontend**: Next.js 14+, React 19, TypeScript, Tailwind CSS
- **UI Components**: Shadcn/ui
- **Backend**: Next.js API Routes, Redis (Upstash)
- **AI Integration**: OpenAI API, Hugging Face LegalQwen14B model
- **Translation**: DeepL + OpenAI

## Getting Started

```bash
# Install dependencies
npm install
# or
pnpm install

# Run the development server
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## License

MIT

## Author

Joshua Guillen 