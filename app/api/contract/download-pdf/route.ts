import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { getSessionId } from '@/lib/utils/session';
import React from 'react';
import { AnalysisReport } from '@/components/pdf/AnalysisReport';

// Ensure PDF.js is properly configured for server-side rendering
if (typeof window === 'undefined') {
  // We're on the server
  global.XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const sessionId = getSessionId(req);
    if (!sessionId) {
      return NextResponse.json({ error: 'No session' }, { status: 401 });
    }

    const { contract, summary, analyses, clauses, language = 'en' } = await req.json();

    if (!contract || !summary || !analyses || !clauses) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }

    // Create the PDF document without using JSX
    try {
      console.log('Creating PDF document element');
      const AnalysisReportElement = React.createElement(AnalysisReport, {
        contractName: contract.name || 'Contract Analysis',
        clauses: clauses || [],
        analysis: analyses || {},
        summary: summary || {},
        language: language || 'en'
      });
      
      console.log('Rendering PDF buffer');
      // Generate PDF using the AnalysisReport component with error handling
      const pdfBuffer = await renderToBuffer(AnalysisReportElement).catch(err => {
        console.error('PDF rendering error:', err);
        throw new Error(`PDF rendering failed: ${err.message}`);
      });
      
      console.log('PDF buffer generated successfully');
      return new Response(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${(contract.name || 'contract').replace(/\.[^/.]+$/, "")}_analysis_report.pdf"`,
        },
      });
    } catch (renderError) {
      console.error('Error in PDF rendering process:', renderError);
      return NextResponse.json(
        { error: `PDF rendering failed: ${renderError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF report' },
      { status: 500 }
    );
  }
} 