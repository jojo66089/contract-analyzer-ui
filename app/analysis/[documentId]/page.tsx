"use client"

import { useEffect, useState, useRef, useMemo, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import axios from "axios"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import type { Analysis, Clause, SummaryInsights, DocumentDetails } from "@/lib/types"
import AnalysisViewer from "@/components/analysis-viewer"
import ClauseList from "@/components/clause-list"
import SummaryInsightsPanel from "@/components/summary-insights-panel"
import TranslationSwitcher from "@/components/translation-switcher"
import ContractViewer from "@/components/contract-viewer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  BarChart3, 
  FileText, 
  Download, 
  MessageSquare,
  TrendingUp,
  Target,
  Shield,
  AlertTriangle,
  CheckCircle
} from "lucide-react"

// Performance optimization: Memoized summary sanitizer
const sanitizeSummary = (summary: any): SummaryInsights => {
  if (!summary) return {
    overallRisk: "",
    riskScore: 0,
    ambiguousTerms: [],
    unfairClauses: [],
    missingClauses: [],
    keyFindings: [],
    actionableSuggestions: []
  };

  return {
    overallRisk: String(summary.overallRisk || ""),
    riskScore: typeof summary.riskScore === 'number' ? summary.riskScore : 0,
    ambiguousTerms: Array.isArray(summary.ambiguousTerms) 
      ? summary.ambiguousTerms.map((term: any) => String(term)) 
      : [],
    missingClauses: Array.isArray(summary.missingClauses) 
      ? summary.missingClauses.map((clause: any) => String(clause)) 
      : [],
    keyFindings: Array.isArray(summary.keyFindings) 
      ? summary.keyFindings.map((finding: any) => String(finding)) 
      : [],
    actionableSuggestions: Array.isArray(summary.actionableSuggestions) 
      ? summary.actionableSuggestions.map((suggestion: any) => String(suggestion)) 
      : [],
    unfairClauses: Array.isArray(summary.unfairClauses) 
      ? summary.unfairClauses.map((clause: any) => {
          if (typeof clause === 'object' && clause !== null && !Array.isArray(clause)) {
            return {
              clauseId: String(clause.clauseId || 'unknown'),
              description: String(clause.description || 'No description')
            };
          }
          return { 
            clauseId: 'unknown', 
            description: typeof clause === 'string' ? clause : String(clause)
          };
        })
      : []
  };
};

export default function AnalysisPage() {
  const params = useParams()
  const router = useRouter()
  const documentId = params.documentId as string
  const eventSourceRef = useRef<EventSource | null>(null)

  // State management
  const [contract, setContract] = useState<any>(null)
  const [clauses, setClauses] = useState<Clause[]>([])
  const [selectedClause, setSelectedClause] = useState<Clause | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [analyses, setAnalyses] = useState<Record<string, Analysis>>({})
  const [summaryInsights, setSummaryInsights] = useState<SummaryInsights | null>(null)
  const [summaryTranslations, setSummaryTranslations] = useState<Record<string, SummaryInsights>>({})
  const [translations, setTranslations] = useState<Record<string, Record<string, Analysis>>>({})
  const [currentLanguage, setCurrentLanguage] = useState<"en" | "es" | "pt" | "zh">("en")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [documentDetails, setDocumentDetails] = useState<DocumentDetails>({
    id: '',
    name: '',
    uploadDate: '',
    fullText: ''
  });

  // Memoized computations for performance
  const analysisProgress = useMemo(() => {
    return clauses.length > 0 ? (Object.keys(analyses).length / clauses.length) * 100 : 0;
  }, [clauses.length, analyses]);

  const allAnalysesReady = useMemo(() => {
    return clauses.length > 0 && Object.keys(analyses).length === clauses.length;
  }, [clauses.length, analyses]);

  // Optimized helper functions using useCallback
  const getCurrentAnalysis = useCallback((clauseId: string): Analysis | null => {
    if (currentLanguage === "en") return analyses[clauseId] || null;
    return translations[currentLanguage]?.[clauseId] || null;
  }, [currentLanguage, analyses, translations]);

  const getCurrentSummary = useCallback((): SummaryInsights | null => {
    const summary = currentLanguage === "en" 
      ? summaryInsights 
      : summaryTranslations[currentLanguage] || summaryInsights;
    
    return summary ? sanitizeSummary(summary) : null;
  }, [currentLanguage, summaryInsights, summaryTranslations]);

  // Optimized contract fetching
  useEffect(() => {
    const fetchContract = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await axios.get(`/api/contract/${documentId}`, {
          withCredentials: true,
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        const contractData = response.data;
        setContract(contractData);
        
        if (contractData) {
          setDocumentDetails({
            id: contractData.id,
            name: contractData.originalFilename,
            fullText: contractData.text,
            uploadDate: contractData.uploadedAt || new Date().toISOString()
          });
          setClauses(contractData.clauses);
        }
      } catch (err: any) {
        console.error('Error fetching contract:', err);
        if (err.response?.status === 401) {
          router.push('/');
        } else {
          setError(err.response?.data?.error || err.message || 'Failed to load document');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchContract();
  }, [documentId, router]);

  // Optimized summary fetching with dependency array
  useEffect(() => {
    if (!allAnalysesReady) return;
    
    axios.get(`/api/contract/${documentId}/summary`)
      .then(res => {
        if (res.data.summary) {
          setSummaryInsights(res.data.summary);
        }
      })
      .catch(err => console.error('Error fetching summary:', err));
  }, [allAnalysesReady, documentId]);

  // Optimized streaming analysis
  useEffect(() => {
    if (!clauses.length || !documentId) return;
    
    setIsStreaming(true);
    const es = new EventSource(`/api/contract/${documentId}/analyze`);
    eventSourceRef.current = es;
    
    es.onmessage = (event) => {
      try {
        const { clauseId, analysis: clauseAnalysis, error } = JSON.parse(event.data);
        
        if (clauseId && clauseAnalysis) {
          setAnalyses((prev) => ({ ...prev, [clauseId]: clauseAnalysis }));
          
          // Auto-select first clause if none selected
          if (!selectedClause) {
            const clause = clauses.find((c) => c.id === clauseId);
            if (clause) {
              setSelectedClause(clause);
              setAnalysis(clauseAnalysis);
            }
          } else if (selectedClause.id === clauseId) {
            // If this is the analysis for the currently selected clause, update it
            setAnalysis(clauseAnalysis);
          }
        }
        
        if (clauseId && error) {
          setAnalyses((prev) => ({ ...prev, [clauseId]: { error } }));
        }
      } catch (err) {
        console.error('Error parsing analysis event:', err);
      }
    };
    
    es.addEventListener('end', () => {
      setIsStreaming(false);
      es.close();
    });
    
    es.onerror = (err) => {
      console.error('EventSource error:', err);
      setIsStreaming(false);
      es.close();
    };
    
    return () => es.close();
  }, [clauses, documentId, selectedClause]);

  // Update analysis when selection or language changes
  useEffect(() => {
    if (selectedClause) {
      setAnalysis(getCurrentAnalysis(selectedClause.id));
    }
  }, [selectedClause, getCurrentAnalysis]);

  // Optimized translation caching
  useEffect(() => {
    if (currentLanguage === "en" || !summaryInsights) return;
    if (summaryTranslations[currentLanguage]) return;
    
    axios.post(`/api/contract/${documentId}/translate`, { targetLang: currentLanguage })
      .then(res => {
        if (res.data.translated) {
          setSummaryTranslations(prev => ({ 
            ...prev, 
            [currentLanguage]: res.data.translated 
          }));
        }
      })
      .catch(err => console.error('Error translating summary:', err));
  }, [currentLanguage, summaryInsights, documentId, summaryTranslations]);

  // Optimized language change handler
  const handleLanguageChange = useCallback(async (lang: "en" | "es" | "pt" | "zh") => {
    if (lang === currentLanguage) return;
    
    setCurrentLanguage(lang);
    
    if (lang === 'en') {
      if (selectedClause && analyses[selectedClause.id]) {
        setAnalysis(analyses[selectedClause.id] as Analysis);
      }
      return;
    }
    
    if (translations[lang]) {
      if (selectedClause && translations[lang][selectedClause.id]) {
        setAnalysis(translations[lang][selectedClause.id] as Analysis);
      }
      return;
    }
    
    setIsLoading(true);
    
    try {
      const res = await axios.post(`/api/contract/${documentId}/translate`, { targetLang: lang });
      const translatedAnalyses = res.data.translated;
      
      const clauseMap: Record<string, Analysis> = {};
      clauses.forEach((clause, i) => {
        clauseMap[clause.id] = translatedAnalyses[i];
      });
      
      setTranslations(prev => ({ ...prev, [lang]: clauseMap }));
      
      if (selectedClause && clauseMap[selectedClause.id]) {
        setAnalysis(clauseMap[selectedClause.id] as Analysis);
      }
    } catch (err: any) {
      console.error('Error translating analyses:', err);
      
      if (err.response?.status === 429) {
        setError('Translation service is temporarily overloaded. Please try again in a few minutes.');
      } else {
        setError('Translation failed. Please try again or use English for now.');
      }
      
      setCurrentLanguage('en');
      if (selectedClause && analyses[selectedClause.id]) {
        setAnalysis(analyses[selectedClause.id] as Analysis);
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentLanguage, selectedClause, analyses, translations, clauses, documentId]);

  // Memoized download handler
  const handleDownloadPDF = useCallback(async () => {
    try {
      const currentSummary = getCurrentSummary();
      if (!currentSummary) {
        setError('Summary not available for download');
        return;
      }

      const response = await axios.post('/api/contract/download-pdf', {
        contract: documentDetails,
        summary: currentSummary,
        analyses: Object.values(analyses),
        clauses: clauses,
        language: currentLanguage
      }, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${documentDetails.name.replace(/\.[^/.]+$/, "")}_analysis_report.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError('Failed to download PDF report');
    }
  }, [getCurrentSummary, documentDetails, analyses, clauses, currentLanguage]);

  const handleClauseSelect = useCallback((clause: Clause) => {
    setSelectedClause(clause);
    const currentAnalysis = getCurrentAnalysis(clause.id);
    setAnalysis(currentAnalysis);
  }, [getCurrentAnalysis]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading contract...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => router.push('/')} className="w-full">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading progress if analysis is still in progress
  if (!allAnalysesReady || isStreaming) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-2xl font-bold mb-6">Analyzing Contract: {documentDetails.name}</h1>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Analysis Progress</span>
                  <span className="text-sm text-gray-500">{Math.round(analysisProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${analysisProgress}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-gray-600">
                Analyzing {Object.keys(analyses).length} of {clauses.length} clauses...
              </p>
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Clauses found:</h3>
                <ul className="space-y-1 max-h-40 overflow-y-auto">
                  {clauses.map((clause, idx) => (
                    <li key={clause.id} className="text-sm text-gray-600 flex items-center">
                      {analyses[clause.id] ? (
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      ) : (
                        <LoadingSpinner size="sm" className="mr-2" />
                      )}
                      Clause {idx + 1}: {clause.title || `Untitled Clause ${idx + 1}`}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/')}
              className="flex items-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>Back to Home</span>
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{documentDetails.name}</h1>
              <p className="text-sm text-muted-foreground">
                {clauses.length} clauses • {analysisProgress.toFixed(0)}% analyzed
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <TranslationSwitcher 
              currentLanguage={currentLanguage} 
              onLanguageChange={handleLanguageChange}
              disabled={isLoading}
            />
            
            {/* Analysis Progress */}
            <div className="flex items-center space-x-2">
              {isStreaming && (
                <div className="flex items-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span className="text-sm text-muted-foreground">
                    Analyzing... {Math.round(analysisProgress)}%
                  </span>
                </div>
              )}
              {allAnalysesReady && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Shield className="h-3 w-3 mr-1" />
                  Analysis Complete
                </Badge>
              )}
            </div>
            
            <Button 
              onClick={handleDownloadPDF}
              disabled={!allAnalysesReady}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Download Report</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-[calc(100vh-80px)]">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Clauses Panel */}
          <ResizablePanel defaultSize={30} minSize={25}>
            <div className="h-full border-r bg-white">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-lg mb-2">Contract Clauses</h2>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span>{clauses.length} total clauses</span>
                </div>
              </div>
              <div className="h-[calc(100%-80px)] overflow-y-auto">
                <ClauseList 
                  clauses={clauses}
                  selectedClauseId={selectedClause?.id}
                  onClauseSelect={handleClauseSelect}
                  language={currentLanguage as "en" | "es" | "pt" | "zh"}
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Analysis Panel */}
          <ResizablePanel defaultSize={45} minSize={40}>
            <div className="h-full bg-white">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-lg">
                      {selectedClause ? `Clause ${selectedClause.id}` : 'Select a clause'}
                    </h2>
                    {selectedClause && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Detailed legal analysis and recommendations
                      </p>
                    )}
                  </div>
                  {selectedClause && analysis && (
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>Analysis Ready</span>
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="h-[calc(100%-80px)] overflow-y-auto p-4">
                <Tabs defaultValue="analysis" className="h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="analysis">Clause Analysis</TabsTrigger>
                    <TabsTrigger value="contract">Full Contract</TabsTrigger>
                  </TabsList>
                  <TabsContent value="analysis" className="flex-1 min-h-0">
                    <ScrollArea className="h-full">
                      {selectedClause && analysis ? (
                        <AnalysisViewer 
                          analysis={analysis} 
                          clause={selectedClause}
                          language={currentLanguage === "en" || currentLanguage === "es" ? currentLanguage : "en"}
                        />
                      ) : selectedClause ? (
                        <div className="flex h-full items-center justify-center">
                          <div className="text-center">
                            <LoadingSpinner size="lg" />
                            <p className="mt-4 text-muted-foreground">
                              Analyzing clause...
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          <div className="text-center">
                            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Select a clause from the left panel to view its analysis</p>
                          </div>
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="contract" className="flex-1 min-h-0">
                    <ContractViewer 
                      contractText={documentDetails.fullText} 
                      selectedClause={selectedClause} 
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Summary Panel */}
          <ResizablePanel defaultSize={25} minSize={20}>
            <div className="h-full p-4 overflow-y-auto bg-white">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Summary Insights
              </h2>
              {getCurrentSummary() ? (
                <SummaryInsightsPanel
                  insights={getCurrentSummary()!}
                  language={currentLanguage === "en" || currentLanguage === "es" ? currentLanguage : "en"}
                />
              ) : isStreaming ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Analysis in progress...</p>
                  </div>
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
