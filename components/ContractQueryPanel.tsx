import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useLegalLlm } from '@/lib/hooks/useLegalLlm';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function ContractQueryPanel() {
  const [instruction, setInstruction] = useState<string>('Analyze this contract clause for legal risks and ambiguities.');
  const [clauseText, setClauseText] = useState<string>('');
  
  const { data, isLoading, error, execute, reset } = useLegalLlm({
    instruction,
    input: clauseText,
  });

  const handleAnalyze = () => {
    if (!clauseText.trim()) {
      alert('Please enter a contract clause to analyze');
      return;
    }
    execute();
  };

  const handleReset = () => {
    reset();
    setClauseText('');
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Legal Contract Analysis</CardTitle>
          <CardDescription>
            Enter a contract clause and get legal analysis from LegalQwen14B
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="instruction" className="text-sm font-medium">
              Instruction for AI
            </label>
            <Textarea
              id="instruction"
              placeholder="Enter your instruction for the AI..."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              className="min-h-20"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="clause" className="text-sm font-medium">
              Contract Clause
            </label>
            <Textarea
              id="clause"
              placeholder="Paste your contract clause here..."
              value={clauseText}
              onChange={(e) => setClauseText(e.target.value)}
              className="min-h-32"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleReset} disabled={isLoading}>
            Reset
          </Button>
          <Button onClick={handleAnalyze} disabled={isLoading || !clauseText.trim()}>
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Analyzing...
              </>
            ) : (
              'Analyze Clause'
            )}
          </Button>
        </CardFooter>
      </Card>

      {(data || isLoading || error) && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="p-4 bg-red-50 text-red-800 rounded-md">
                <p className="font-semibold">Error:</p>
                <p>{error.message}</p>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap p-4 bg-muted/50 rounded-md max-h-[400px] overflow-y-auto font-mono text-sm">
                {isLoading && !data ? 'Loading...' : data || 'No analysis yet. Click "Analyze Clause" to begin.'}
              </pre>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 