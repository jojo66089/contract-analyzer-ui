import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { getSessionId } from '@/lib/utils/session';
import React from 'react';
import { AnalysisReport } from '@/components/pdf/AnalysisReport';

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
    const AnalysisReportElement = React.createElement(AnalysisReport, {
      contractName: contract.name,
      clauses: clauses,
      analysis: analyses,
      summary: summary,
      language: language
    });

    // Generate PDF using the AnalysisReport component
    const pdfBuffer = await renderToBuffer(AnalysisReportElement);

    // Return the PDF as a binary response
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${contract.name.replace(/\.[^/.]+$/, "")}_analysis_report.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF report' },
      { status: 500 }
    );
  }
} 