import { Buffer } from 'buffer';
import * as Tesseract from 'tesseract.js';
import { createCanvas } from 'canvas';
// Use require for mammoth due to export style
import * as mammoth from 'mammoth';
const {
  ServicePrincipalCredentials,
  PDFServices,
  ExtractPDFJob,
  ExtractPDFParams,
  ExtractElementType,
  MimeType,
  ExtractPDFResult
} = require('@adobe/pdfservices-node-sdk');
import * as fs from 'fs';
import * as path from 'path';
const AdmZip = require('adm-zip');

// Adobe PDF Services credentials
const PDF_SERVICES_CLIENT_ID = 'REMOVED_CLIENT_ID';
const PDF_SERVICES_CLIENT_SECRET = 'REMOVED_SECRET';

async function extractPdfWithAdobe(file: Buffer | Uint8Array): Promise<string> {
  // Write the buffer to a temp file
  const tempInput = path.join('/tmp', `input_${Date.now()}.pdf`);
  const tempOutput = path.join('/tmp', `output_${Date.now()}.zip`);
  fs.writeFileSync(tempInput, file);

  // Set up credentials
  const credentials = new ServicePrincipalCredentials({
    clientId: PDF_SERVICES_CLIENT_ID,
    clientSecret: PDF_SERVICES_CLIENT_SECRET
  });

  // Create PDFServices instance
  const pdfServices = new PDFServices({ credentials });

  // Upload the file as an asset
  const readStream = fs.createReadStream(tempInput);
  const inputAsset = await pdfServices.upload({ readStream, mimeType: MimeType.PDF });

  // Set up extract params
  const params = new ExtractPDFParams({
    elementsToExtract: [ExtractElementType.TEXT, ExtractElementType.TABLES],
    getStylingInfo: true
  });

  // Create and submit the extract job
  const job = new ExtractPDFJob({ inputAsset, params });
  const pollingURL = await pdfServices.submit({ job });
  const pdfServicesResponse = await pdfServices.getJobResult({ pollingURL, resultType: ExtractPDFResult });

  // Get the result asset and download the zip
  const resultAsset = pdfServicesResponse.result.resource;
  const streamAsset = await pdfServices.getContent({ asset: resultAsset });
  const writeStream = fs.createWriteStream(tempOutput);
  await new Promise<void>((resolve, reject) => {
    streamAsset.readStream.pipe(writeStream);
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
    streamAsset.readStream.on('error', reject);
  });

  // Unzip and read structuredData.json
  const zip = new AdmZip(tempOutput);
  const jsonEntry = zip.getEntry('structuredData.json');
  if (!jsonEntry) throw new Error('structuredData.json not found in Adobe Extract output');
  const jsonStr = zip.readAsText(jsonEntry);
  const data = JSON.parse(jsonStr);

  // Concatenate all text elements
  let fullText = '';
  if (data.elements && Array.isArray(data.elements)) {
    for (const el of data.elements) {
      if (el.Text) fullText += el.Text + '\n';
    }
  }

  // Clean up temp files
  fs.unlinkSync(tempInput);
  fs.unlinkSync(tempOutput);

  return fullText.trim();
}

export async function parseFile(file: Buffer | Uint8Array, mimetype: string): Promise<string> {
  try {
    if (mimetype === 'application/pdf') {
      // Use Adobe PDF Extract API for PDFs
      return await extractPdfWithAdobe(file);
    }

    if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimetype === 'application/msword'
    ) {
      // Use mammoth for robust DOCX extraction
      const { value } = await mammoth.extractRawText({ buffer: Buffer.from(file) });
      return value.trim();
    }

    throw new Error(`Unsupported file type: ${mimetype}`);
  } catch (error: any) {
    console.error('Error parsing file:', error);
    throw new Error(`Failed to parse file: ${error.message}`);
  }
}

// CLI test harness for local dev
if (require.main === module) {
  (async () => {
    const [,, filePath, mimetype] = process.argv;
    if (!filePath || !mimetype) {
      console.error('Usage: node lib/utils/parseFile.js <file> <mimetype>');
      process.exit(1);
    }
    const fs = require('fs');
    // Read as a true Uint8Array
    const fileBuffer = new Uint8Array(fs.readFileSync(filePath, null));
    try {
      const text = await parseFile(fileBuffer, mimetype);
      console.log('--- Extracted Text Start ---');
      console.log(text);
      console.log('--- Extracted Text End ---');
    } catch (err) {
      console.error('Extraction failed:', err);
      process.exit(2);
    }
  })();
} 