"use client"

import type { Analysis, Clause } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, AlertCircle, LightbulbIcon, FileWarning, BookOpen } from "lucide-react"

interface AnalysisViewerProps {
  analysis: Analysis
  clause: Clause
  language: "en" | "es"
}

const translations = {
  en: {
    clauseAnalysis: "Clause Analysis",
    ambiguities: "Ambiguities",
    risks: "Risks & Liabilities",
    recommendations: "Recommendations",
    missingElements: "Missing Elements",
    references: "Legal References",
    noAmbiguities: "No ambiguities identified",
    noRisks: "No risks identified",
    noRecommendations: "No recommendations",
    noMissingElements: "No missing elements",
    noReferences: "No references cited"
  },
  es: {
    clauseAnalysis: "Análisis de Cláusula",
    ambiguities: "Ambigüedades",
    risks: "Riesgos y Responsabilidades",
    recommendations: "Recomendaciones",
    missingElements: "Elementos Faltantes",
    references: "Referencias Legales",
    noAmbiguities: "No se identificaron ambigüedades",
    noRisks: "No se identificaron riesgos",
    noRecommendations: "Sin recomendaciones",
    noMissingElements: "No hay elementos faltantes",
    noReferences: "No se citaron referencias"
  }
}

export default function AnalysisViewer({ analysis, clause, language }: AnalysisViewerProps) {
  const t = translations[language] || translations.en;
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">{t.clauseAnalysis}: {clause.title || `Clause ${clause.id}`}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <Tabs defaultValue="ambiguities" className="w-full">
          <TabsList className="flex flex-wrap gap-1 mb-6 pb-2">
            <TabsTrigger value="ambiguities" className="flex-1 h-auto py-2 px-3">
              <div className="flex items-center justify-center">
                <AlertCircle className="w-4 h-4 mr-1.5" />
                <span>{t.ambiguities}</span>
              </div>
            </TabsTrigger>
            
            <TabsTrigger value="risks" className="flex-1 h-auto py-2 px-3">
              <div className="flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 mr-1.5" />
                <span>{t.risks}</span>
              </div>
            </TabsTrigger>
            
            <TabsTrigger value="recommendations" className="flex-1 h-auto py-2 px-3">
              <div className="flex items-center justify-center">
                <LightbulbIcon className="w-4 h-4 mr-1.5" />
                <span>{t.recommendations}</span>
              </div>
            </TabsTrigger>
            
            <TabsTrigger value="missing" className="flex-1 h-auto py-2 px-3">
              <div className="flex items-center justify-center">
                <FileWarning className="w-4 h-4 mr-1.5" />
                <span>{t.missingElements}</span>
              </div>
            </TabsTrigger>
            
            <TabsTrigger value="references" className="flex-1 h-auto py-2 px-3">
              <div className="flex items-center justify-center">
                <BookOpen className="w-4 h-4 mr-1.5" />
                <span>{t.references}</span>
              </div>
            </TabsTrigger>
            
            {(analysis.citations || analysis.problematicText) && (
              <TabsTrigger value="citations" className="flex-1 h-auto py-2 px-3">
                <div className="flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 mr-1.5" />
                  <span>{language === 'es' ? 'Citas' : 'Citations'}</span>
                </div>
              </TabsTrigger>
            )}
          </TabsList>
          
          <div className="pt-4">
            <TabsContent value="ambiguities" className="mt-0 space-y-2">
              <h3 className="font-semibold text-sm mb-2">{t.ambiguities}</h3>
              {analysis.ambiguities && analysis.ambiguities.length > 0 ? (
                <ul className="space-y-2">
                  {analysis.ambiguities.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <Badge variant="outline" className="mr-2 mt-0.5">!</Badge>
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">{t.noAmbiguities}</p>
              )}
            </TabsContent>
            
            <TabsContent value="risks" className="mt-0 space-y-2">
              <h3 className="font-semibold text-sm mb-2">{t.risks}</h3>
              {analysis.risks && analysis.risks.length > 0 ? (
                <ul className="space-y-2">
                  {analysis.risks.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <Badge variant="destructive" className="mr-2 mt-0.5">!</Badge>
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">{t.noRisks}</p>
              )}
            </TabsContent>
            
            <TabsContent value="recommendations" className="mt-0 space-y-2">
              <h3 className="font-semibold text-sm mb-2">{t.recommendations}</h3>
              {analysis.recommendations && analysis.recommendations.length > 0 ? (
                <ul className="space-y-2">
                  {analysis.recommendations.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <Badge variant="secondary" className="mr-2 mt-0.5">✓</Badge>
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">{t.noRecommendations}</p>
              )}
            </TabsContent>
            
            <TabsContent value="missing" className="mt-0 space-y-2">
              <h3 className="font-semibold text-sm mb-2">{t.missingElements}</h3>
              {analysis.missingElements && analysis.missingElements.length > 0 ? (
                <ul className="space-y-2">
                  {analysis.missingElements.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <Badge variant="outline" className="mr-2 mt-0.5">?</Badge>
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">{t.noMissingElements}</p>
              )}
            </TabsContent>
            
            <TabsContent value="references" className="mt-0 space-y-2">
              <h3 className="font-semibold text-sm mb-2">{t.references}</h3>
              {analysis.references && analysis.references.length > 0 ? (
                <ul className="space-y-2">
                  {analysis.references.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <Badge variant="secondary" className="mr-2 mt-0.5">§</Badge>
                      <span className="text-sm italic">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">{t.noReferences}</p>
              )}
            </TabsContent>
            
            {(analysis.citations || analysis.problematicText) && (
              <TabsContent value="citations" className="mt-0 space-y-2">
                <h3 className="font-semibold text-sm mb-2">
                  {language === 'es' ? 'Texto Problemático Citado' : 'Problematic Text Citations'}
                </h3>
                
                {analysis.citations && analysis.citations.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase">
                      {language === 'es' ? 'Fragmentos Problemáticos:' : 'Problematic Snippets:'}
                    </h4>
                    <ul className="space-y-2">
                      {analysis.citations.map((citation, index) => (
                        <li key={index} className="p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                          <Badge variant="outline" className="mr-2 text-yellow-700">📝</Badge>
                          <span className="text-sm italic text-yellow-800">"{citation}"</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {analysis.problematicText && analysis.problematicText.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase">
                      {language === 'es' ? 'Frases Problemáticas:' : 'Problematic Phrases:'}
                    </h4>
                    <ul className="space-y-2">
                      {analysis.problematicText.map((text, index) => (
                        <li key={index} className="flex items-start">
                          <Badge variant="destructive" className="mr-2 mt-0.5">⚠</Badge>
                          <span className="text-sm">{text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {(!analysis.citations || analysis.citations.length === 0) && 
                 (!analysis.problematicText || analysis.problematicText.length === 0) && (
                  <p className="text-sm text-muted-foreground">
                    {language === 'es' ? 'No se encontraron citas problemáticas.' : 'No problematic citations found.'}
                  </p>
                )}
              </TabsContent>
            )}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
