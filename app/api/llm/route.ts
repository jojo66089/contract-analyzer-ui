import { NextRequest, NextResponse } from "next/server";

const DEFAULT_MODEL_ID = "jojo6608/LegalQwen14B";

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const { instruction, input } = await req.json();
    
    if (!instruction) {
      return NextResponse.json(
        { error: "Instruction is required" },
        { status: 400 }
      );
    }

    const modelId = process.env.HF_MODEL_ID || DEFAULT_MODEL_ID;
    const token = process.env.HF_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: "HF_TOKEN environment variable is not set" },
        { status: 500 }
      );
    }

    // Prepare prompt with instruction and optional input
    const prompt = input 
      ? `${instruction}\n\n${input}` 
      : instruction;

    return streamFromHuggingFace(modelId, token, prompt);
  } catch (error) {
    console.error("Error in LLM API route:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

async function streamFromHuggingFace(
  modelId: string,
  token: string,
  prompt: string,
  retryCount = 0
): Promise<Response> {
  const maxRetries = 3;
  const backoffFactor = 2;
  const initialBackoff = 1000; // 1 second

  try {
    // Prepare the request to Hugging Face Inference API
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${modelId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 1024,
            temperature: 0.7,
            top_p: 0.95,
            top_k: 50,
            return_full_text: false,
            stream: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const status = response.status;
      
      // Implement retry with exponential backoff for 503 errors (cold start)
      if (status === 503 && retryCount < maxRetries) {
        const backoffTime = initialBackoff * Math.pow(backoffFactor, retryCount);
        console.log(`HF API returned 503, retrying in ${backoffTime}ms (retry ${retryCount + 1}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        return streamFromHuggingFace(modelId, token, prompt, retryCount + 1);
      }
      
      const errorText = await response.text();
      throw new Error(`Hugging Face API error (${status}): ${errorText}`);
    }

    // Get the response body as a ReadableStream
    const body = response.body;
    if (!body) {
      throw new Error("Response body is null");
    }

    // Create a TransformStream to convert the HF response format to our desired NDJSON format
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    
    // Process the incoming stream
    const reader = body.getReader();
    
    // Start reading the stream in the background
    processStream(reader, writer).catch(error => {
      console.error("Error processing stream:", error);
      writer.abort(error);
    });

    // Return our transformed stream to the client
    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error streaming from Hugging Face:", error);
    return NextResponse.json(
      { error: "Failed to stream from Hugging Face" },
      { status: 500 }
    );
  }
}

async function processStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  writer: WritableStreamDefaultWriter<Uint8Array>
): Promise<void> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        await writer.close();
        break;
      }

      // Decode the chunk
      const chunk = decoder.decode(value, { stream: true });
      
      try {
        // HF may return a JSON array with multiple items or a single JSON object
        // We need to handle both cases
        const parsedData = JSON.parse(chunk);
        
        let text = "";
        if (Array.isArray(parsedData)) {
          // If it's an array, get the generated text from each item
          for (const item of parsedData) {
            if (item.generated_text) {
              text += item.generated_text;
            }
          }
        } else if (parsedData.generated_text) {
          // If it's a single object with generated_text
          text = parsedData.generated_text;
        }

        if (text) {
          // Send the text in our event stream format
          await writer.write(encoder.encode(`data: ${text}\n\n`));
        }
      } catch (parseError) {
        // If it's not valid JSON, log and continue
        console.warn("Couldn't parse chunk as JSON:", chunk);
        
        // Just in case it's partial text, try to send it anyway
        if (chunk.trim()) {
          await writer.write(encoder.encode(`data: ${chunk}\n\n`));
        }
      }
    }
  } catch (error) {
    console.error("Stream processing error:", error);
    writer.abort(error);
  }
}

// TODO: For future self-hosted deployment:
// - Add a configuration option to switch between HF Inference API and self-hosted endpoint
// - Update the fetch URL to point to your self-hosted TGI/vLLM endpoint
// - Consider adding authentication/API key for the self-hosted endpoint
// - May need to adjust streaming response format based on your self-hosted setup 