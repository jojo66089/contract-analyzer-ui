import { NextRequest, NextResponse } from 'next/server';
import { getSessionId } from '@/lib/utils/session';
import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Set max duration to 60 seconds

// Path to chrome executable on different platforms
const chromeExecutables = {
  linux: '/usr/bin/chromium-browser',
  win32: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
};

const getOptions = async (isDev: boolean) => {
  // During development use local chrome executable
  if (isDev) {
    return {
      args: [],
      executablePath: chromeExecutables[process.platform as keyof typeof chromeExecutables] || chromeExecutables.linux,
      headless: true
    };
  }

  // Else, use the path of chrome-aws-lambda and its args
  return {
    args: chromium.args,
    executablePath: await chromium.executablePath,
    headless: chromium.headless
  };
};

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

    // Create HTML content for the PDF
    const htmlContent = generateHtml(contract, summary, analyses, clauses, language);

    // Start headless chrome instance
    const isDev = process.env.NODE_ENV === 'development';
    const options = await getOptions(isDev);
    
    console.log('Launching browser with options:', JSON.stringify(options));
    const browser = await puppeteer.launch(options);
    
    console.log('Browser launched, creating new page');
    const page = await browser.newPage();
    
    // Set content and wait until everything is loaded
    console.log('Setting HTML content');
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    console.log('Generating PDF');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      }
    });
    
    // Close browser
    console.log('Closing browser');
    await browser.close();
    
    console.log('PDF generated successfully');
    
    // Return the PDF as a binary response
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${(contract.name || 'contract').replace(/\.[^/.]+$/, "")}_analysis_report.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF with Puppeteer:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `PDF generation failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Function to generate HTML content for the PDF
function generateHtml(contract: any, summary: any, analyses: any, clauses: any, language: string): string {
  return `
    <!DOCTYPE html>
    <html lang="${language}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${contract.name || 'Contract Analysis'} - Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 20px;
        }
        h1 {
          color: #2c3e50;
          border-bottom: 2px solid #3498db;
          padding-bottom: 10px;
        }
        h2 {
          color: #2980b9;
          margin-top: 20px;
        }
        h3 {
          color: #3498db;
        }
        .summary {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        .risk-high {
          color: #e74c3c;
        }
        .risk-medium {
          color: #f39c12;
        }
        .risk-low {
          color: #27ae60;
        }
        .clause {
          margin-bottom: 30px;
          padding: 15px;
          background-color: #f8f9fa;
          border-left: 4px solid #3498db;
        }
        .analysis-section {
          margin-bottom: 15px;
        }
        ul {
          padding-left: 20px;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
          color: #7f8c8d;
        }
      </style>
    </head>
    <body>
      <h1>${contract.name || 'Contract Analysis'} - Analysis Report</h1>
      
      <div class="summary">
        <h2>Executive Summary</h2>
        <p>${summary.overview || 'No summary available.'}</p>
        
        ${summary.riskLevel ? `<p><strong>Overall Risk Level:</strong> <span class="risk-${summary.riskLevel.toLowerCase()}">${summary.riskLevel}</span></p>` : ''}
        
        ${summary.keyFindings ? `
        <h3>Key Findings</h3>
        <ul>
          ${summary.keyFindings.map((finding: string) => `<li>${finding}</li>`).join('')}
        </ul>
        ` : ''}
      </div>
      
      <h2>Clause Analysis</h2>
      
      ${clauses.map((clause: any, index: number) => `
        <div class="clause">
          <h3>${clause.title || `Clause ${index + 1}`}</h3>
          <p>${clause.text}</p>
          
          ${analyses[clause.id] ? `
            <div class="analysis-section">
              ${analyses[clause.id].risks && analyses[clause.id].risks.length > 0 ? `
                <h4>Risks</h4>
                <ul>
                  ${analyses[clause.id].risks.map((risk: string) => `<li>${risk}</li>`).join('')}
                </ul>
              ` : ''}
              
              ${analyses[clause.id].ambiguities && analyses[clause.id].ambiguities.length > 0 ? `
                <h4>Ambiguities</h4>
                <ul>
                  ${analyses[clause.id].ambiguities.map((ambiguity: string) => `<li>${ambiguity}</li>`).join('')}
                </ul>
              ` : ''}
              
              ${analyses[clause.id].recommendations && analyses[clause.id].recommendations.length > 0 ? `
                <h4>Recommendations</h4>
                <ul>
                  ${analyses[clause.id].recommendations.map((recommendation: string) => `<li>${recommendation}</li>`).join('')}
                </ul>
              ` : ''}
              
              ${analyses[clause.id].missingElements && analyses[clause.id].missingElements.length > 0 ? `
                <h4>Missing Elements</h4>
                <ul>
                  ${analyses[clause.id].missingElements.map((missing: string) => `<li>${missing}</li>`).join('')}
                </ul>
              ` : ''}
            </div>
          ` : '<p>No analysis available for this clause.</p>'}
        </div>
      `).join('')}
      
      <div class="footer">
        <p>Generated on ${new Date().toLocaleDateString()} | Contract Analyzer</p>
      </div>
    </body>
    </html>
  `;
}