import { NextRequest, NextResponse } from 'next/server';
import { getSessionId } from '@/lib/utils/session';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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

    console.log('Generating PDF with jsPDF');
    
    // Create a new PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Add title
    doc.setFontSize(18);
    doc.setTextColor(44, 62, 80); // #2c3e50
    const title = contract.name || 'Contract Analysis';
    doc.text(title, 20, 20);
    
    // Add subtitle
    doc.setFontSize(14);
    doc.setTextColor(41, 128, 185); // #2980b9
    doc.text('Analysis Report', 20, 30);
    
    // Add horizontal line
    doc.setDrawColor(52, 152, 219); // #3498db
    doc.setLineWidth(0.5);
    doc.line(20, 32, 190, 32);
    
    // Summary Insights Header
    doc.setFontSize(16);
    doc.setTextColor(44, 62, 80); // #2c3e50
    doc.text('Summary Insights', 20, 42);
    
    let yPosition = 50;
    
    // Overall Risk Summary
    doc.setFontSize(14);
    doc.setTextColor(231, 76, 60); // Red color for risk
    doc.text('Overall Risk Summary', 20, yPosition);
    yPosition += 8;
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const riskSummaryText = summary.overallRisk || 'This contract contains moderate legal risks requiring careful attention.';
    const splitRiskSummary = doc.splitTextToSize(riskSummaryText, 170);
    doc.text(splitRiskSummary, 20, yPosition);
    yPosition += splitRiskSummary.length * 5 + 5;
    
    // Risk Score
    if (summary.riskScore !== undefined) {
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Risk Score: ${summary.riskScore}/10`, 20, yPosition);
      yPosition += 10;
    }
    
    // Key Ambiguous Terms
    if (summary.ambiguousTerms && summary.ambiguousTerms.length > 0) {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(243, 156, 18); // Yellow color for ambiguous
      doc.text('Key Ambiguous Terms', 20, yPosition);
      yPosition += 8;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      summary.ambiguousTerms.forEach((term: string) => {
        const bulletPoint = `• ${term}`;
        const splitTerm = doc.splitTextToSize(bulletPoint, 170);
        doc.text(splitTerm, 20, yPosition);
        yPosition += splitTerm.length * 5;
      });
      
      yPosition += 5;
    }
    
    // Unfair/Problematic Clauses
    if (summary.unfairClauses && summary.unfairClauses.length > 0) {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(231, 76, 60); // Red color for problematic
      doc.text('Unfair/Problematic Clauses', 20, yPosition);
      yPosition += 8;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      summary.unfairClauses.forEach((clause: any) => {
        const clauseId = clause.clauseId || 'unknown';
        const description = clause.description || 'No description';
        
        doc.setFillColor(253, 237, 237); // Light red background
        doc.rect(20, yPosition - 4, 170, 20, 'F');
        
        doc.setFontSize(10);
        doc.setTextColor(231, 76, 60); // Red text
        doc.text(`Clause ID: ${clauseId}`, 25, yPosition);
        yPosition += 5;
        
        doc.setTextColor(0, 0, 0);
        const splitDesc = doc.splitTextToSize(description, 160);
        doc.text(splitDesc, 25, yPosition);
        yPosition += splitDesc.length * 5 + 5;
      });
      
      yPosition += 5;
    }
    
    // Problematic Clauses with Citations
    if (summary.problematicClauses && summary.problematicClauses.length > 0) {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(243, 156, 18); // Orange color for citations
      doc.text('Problematic Clauses with Citations', 20, yPosition);
      yPosition += 8;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      summary.problematicClauses.forEach((clause: any) => {
        const clauseId = clause.clauseId || 'unknown';
        const title = clause.title || 'Untitled Clause';
        const issues = clause.issues || [];
        
        doc.setFillColor(255, 243, 224); // Light orange background
        doc.rect(20, yPosition - 4, 170, 8, 'F');
        
        doc.setFontSize(10);
        doc.setTextColor(230, 126, 34); // Orange text
        doc.text(`ID: ${clauseId}`, 25, yPosition);
        yPosition += 6;
        
        doc.setFontSize(11);
        doc.setTextColor(230, 126, 34); // Orange text
        doc.text(title, 25, yPosition);
        yPosition += 6;
        
        if (issues.length > 0) {
          doc.setFontSize(9);
          doc.setTextColor(0, 0, 0);
          doc.text('Issues identified:', 25, yPosition);
          yPosition += 4;
          
          issues.forEach((issue: string) => {
            const bulletPoint = `• ${issue}`;
            const splitIssue = doc.splitTextToSize(bulletPoint, 160);
            doc.text(splitIssue, 30, yPosition);
            yPosition += splitIssue.length * 4;
          });
        }
        
        yPosition += 8;
      });
      
      yPosition += 5;
    }
    
    // Missing Recommended Clauses
    if (summary.missingClauses && summary.missingClauses.length > 0) {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(41, 128, 185); // Blue color for missing clauses
      doc.text('Missing Recommended Clauses', 20, yPosition);
      yPosition += 8;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      summary.missingClauses.forEach((clause: string) => {
        const bulletPoint = `+ ${clause}`;
        const splitClause = doc.splitTextToSize(bulletPoint, 170);
        doc.text(splitClause, 20, yPosition);
        yPosition += splitClause.length * 5;
      });
      
      yPosition += 5;
    }
    
    // Actionable Suggestions
    if (summary.actionableSuggestions && summary.actionableSuggestions.length > 0) {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(142, 68, 173); // Purple color for suggestions
      doc.text('Actionable Suggestions', 20, yPosition);
      yPosition += 8;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      summary.actionableSuggestions.forEach((suggestion: string) => {
        const bulletPoint = `→ ${suggestion}`;
        const splitSuggestion = doc.splitTextToSize(bulletPoint, 170);
        doc.text(splitSuggestion, 20, yPosition);
        yPosition += splitSuggestion.length * 5;
      });
      
      yPosition += 5;
    }
    
    // Key Findings
    if (summary.keyFindings && summary.keyFindings.length > 0) {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(39, 174, 96); // Green color for key findings
      doc.text('Additional Key Findings', 20, yPosition);
      yPosition += 8;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      summary.keyFindings.forEach((finding: string) => {
        const bulletPoint = `i ${finding}`;
        const splitFinding = doc.splitTextToSize(bulletPoint, 170);
        doc.text(splitFinding, 20, yPosition);
        yPosition += splitFinding.length * 5;
      });
      
      yPosition += 5;
    }
    
    // Clause Analysis
    doc.setFontSize(16);
    doc.setTextColor(44, 62, 80); // #2c3e50
    doc.text('Clause Analysis', 20, yPosition);
    yPosition += 10;
    
    // Process each clause
    for (const clause of clauses) {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Clause title
      doc.setFontSize(14);
      doc.setTextColor(41, 128, 185); // #2980b9
      doc.text(clause.title || `Clause ${clauses.indexOf(clause) + 1}`, 20, yPosition);
      yPosition += 8;
      
      // Clause text (truncated if too long)
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const clauseText = clause.text.length > 300 ? clause.text.substring(0, 300) + '...' : clause.text;
      const splitClauseText = doc.splitTextToSize(clauseText, 170);
      doc.text(splitClauseText, 20, yPosition);
      yPosition += splitClauseText.length * 5 + 5;
      
      // Analysis for this clause
      const analysis = analyses[clause.id];
      if (analysis) {
        // Risks
        if (analysis.risks && analysis.risks.length > 0) {
          // Check if we need a new page
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
          
          doc.setFontSize(12);
          doc.setTextColor(231, 76, 60); // #e74c3c
          doc.text('Risks', 25, yPosition);
          yPosition += 6;
          
          doc.setFontSize(9);
          doc.setTextColor(0, 0, 0);
          
          analysis.risks.forEach((risk: string) => {
            const bulletPoint = `• ${risk}`;
            const splitRisk = doc.splitTextToSize(bulletPoint, 165);
            doc.text(splitRisk, 25, yPosition);
            yPosition += splitRisk.length * 5;
          });
          
          yPosition += 3;
        }
        
        // Ambiguities
        if (analysis.ambiguities && analysis.ambiguities.length > 0) {
          // Check if we need a new page
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
          
          doc.setFontSize(12);
          doc.setTextColor(243, 156, 18); // #f39c12
          doc.text('Ambiguities', 25, yPosition);
          yPosition += 6;
          
          doc.setFontSize(9);
          doc.setTextColor(0, 0, 0);
          
          analysis.ambiguities.forEach((ambiguity: string) => {
            const bulletPoint = `• ${ambiguity}`;
            const splitAmbiguity = doc.splitTextToSize(bulletPoint, 165);
            doc.text(splitAmbiguity, 25, yPosition);
            yPosition += splitAmbiguity.length * 5;
          });
          
          yPosition += 3;
        }
        
        // Recommendations
        if (analysis.recommendations && analysis.recommendations.length > 0) {
          // Check if we need a new page
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
          
          doc.setFontSize(12);
          doc.setTextColor(39, 174, 96); // #27ae60
          doc.text('Recommendations', 25, yPosition);
          yPosition += 6;
          
          doc.setFontSize(9);
          doc.setTextColor(0, 0, 0);
          
          analysis.recommendations.forEach((recommendation: string) => {
            const bulletPoint = `• ${recommendation}`;
            const splitRecommendation = doc.splitTextToSize(bulletPoint, 165);
            doc.text(splitRecommendation, 25, yPosition);
            yPosition += splitRecommendation.length * 5;
          });
          
          yPosition += 3;
        }
        
        // Missing Elements
        if (analysis.missingElements && analysis.missingElements.length > 0) {
          // Check if we need a new page
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
          
          doc.setFontSize(12);
          doc.setTextColor(52, 152, 219); // #3498db
          doc.text('Missing Elements', 25, yPosition);
          yPosition += 6;
          
          doc.setFontSize(9);
          doc.setTextColor(0, 0, 0);
          
          analysis.missingElements.forEach((missing: string) => {
            const bulletPoint = `• ${missing}`;
            const splitMissing = doc.splitTextToSize(bulletPoint, 165);
            doc.text(splitMissing, 25, yPosition);
            yPosition += splitMissing.length * 5;
          });
          
          yPosition += 3;
        }
      } else {
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text('No analysis available for this clause.', 25, yPosition);
        yPosition += 5;
      }
      
      yPosition += 10;
    }
    
    // Add footer to all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(127, 140, 141); // #7f8c8d
      doc.text(`Generated on ${new Date().toLocaleDateString()} | Contract Analyzer | Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
    }
    
    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer');
    
    console.log('PDF generated successfully with jsPDF');
    
    // Return the PDF as a binary response
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${(contract.name || 'contract').replace(/\.[^/.]+$/, "")}_analysis_report.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF with jsPDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `PDF generation failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}