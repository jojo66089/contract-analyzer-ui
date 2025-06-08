import { useState, useCallback, useEffect } from 'react';

interface UseLegalLlmParams {
  instruction: string;
  input?: string;
  enabled?: boolean;
}

interface UseLegalLlmReturn {
  data: string;
  isLoading: boolean;
  error: Error | null;
  execute: () => Promise<void>;
  reset: () => void;
}

export function useLegalLlm({ 
  instruction, 
  input = '', 
  enabled = false 
}: UseLegalLlmParams): UseLegalLlmReturn {
  const [data, setData] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const reset = useCallback(() => {
    setData('');
    setError(null);
  }, []);

  const execute = useCallback(async () => {
    if (!instruction) {
      setError(new Error('Instruction is required'));
      return;
    }

    reset();
    setIsLoading(true);

    try {
      const response = await fetch('/api/llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ instruction, input }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      // Read the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        // Decode and process the chunk
        const chunk = decoder.decode(value, { stream: true });
        
        // Parse SSE format (data: content\n\n)
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const content = line.slice(6); // Remove 'data: ' prefix
            setData(prev => prev + content);
          }
        }
      }
    } catch (e) {
      console.error('Error in useLegalLlm:', e);
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  }, [instruction, input, reset]);

  // Auto-execute if enabled
  useEffect(() => {
    if (enabled) {
      execute();
    }
  }, [enabled, execute]);

  return { data, isLoading, error, execute, reset };
} 