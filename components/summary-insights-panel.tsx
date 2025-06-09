import type { SummaryInsights } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, AlertTriangle, ListChecks, ShieldAlert } from "lucide-react"

interface SummaryInsightsPanelProps {
  insights: SummaryInsights
  language: "en" | "es"
}

export default function SummaryInsightsPanel({ insights, language }: SummaryInsightsPanelProps) {
  // Use translated fields if language is not 'en'
  const isSpanish = language === 'es';
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <BarChart3 className="mr-2 h-5 w-5 text-primary" />
            {isSpanish ? "Resumen General y Perspectivas" : "Overall Summary & Insights"}
          </CardTitle>
          <CardDescription>
            {isSpanish
              ? "Hallazgos clave y evaluación de riesgos para todo el documento."
              : "Key findings and risk assessment for the entire document."}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <ShieldAlert className="mr-2 h-5 w-5 text-red-500" />
            {isSpanish ? "Resumen General de Riesgos" : "Overall Risk Summary"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{insights.overallRisk}</p>
          <Badge
            variant={insights.riskScore > 7 ? "destructive" : insights.riskScore > 4 ? "secondary" : "default"}
            className="mt-2"
          >
            {isSpanish
              ? `Puntuación de Riesgo: ${insights.riskScore}/10`
              : `Risk Score: ${insights.riskScore}/10`}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-yellow-500" />
            {isSpanish ? "Términos Ambiguos Clave" : "Key Ambiguous Terms"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {insights.ambiguousTerms && insights.ambiguousTerms.length > 0 ? (
            <ul className="space-y-1">
              {insights.ambiguousTerms.map((term, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  <Badge variant="outline" className="mr-1">
                    ?
                  </Badge>{' '}
                  {term}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {isSpanish
                ? "No se encontraron términos ambiguos significativos."
                : "No significant ambiguous terms found."}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
            {isSpanish ? "Cláusulas Injustas/Problemáticas" : "Unfair/Problematic Clauses"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {insights.unfairClauses && insights.unfairClauses.length > 0 ? (
            <ul className="space-y-2">
              {insights.unfairClauses.map((unfairClause, index) => {
                // Make sure we're dealing with the correct object structure
                // This handles both proper objects and potentially serialized/deserialized objects
                const clauseId = typeof unfairClause === 'object' && unfairClause !== null 
                  ? unfairClause.clauseId || 'Unknown'
                  : 'Unknown';
                  
                const description = typeof unfairClause === 'object' && unfairClause !== null 
                  ? unfairClause.description || String(unfairClause)
                  : String(unfairClause);
                  
                return (
                  <li key={index} className="p-2 bg-red-50 border-l-4 border-red-500 rounded">
                    <Badge variant="destructive" className="mb-1">
                      ⚠
                    </Badge>
                    <p className="text-sm font-medium text-red-800">
                      {isSpanish ? "Cláusula ID:" : "Clause ID:"} {clauseId}
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      {description}
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {isSpanish
                ? "No se identificaron cláusulas significativamente injustas."
                : "No significantly unfair clauses identified."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* New Problematic Clauses Section with Citations */}
      {insights.problematicClauses && insights.problematicClauses.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
              {isSpanish ? "Cláusulas Problemáticas con Citas" : "Problematic Clauses with Citations"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {insights.problematicClauses.map((problematicClause, index) => (
                <li key={index} className="p-3 bg-orange-50 border-l-4 border-orange-500 rounded">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary" className="mb-1">
                      📝
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {isSpanish ? "ID:" : "ID:"} {problematicClause.clauseId}
                    </span>
                  </div>
                  
                  <h4 className="text-sm font-semibold text-orange-800 mb-2">
                    {problematicClause.title}
                  </h4>
                  
                  {/* Issues */}
                  <div className="mb-2">
                    <p className="text-xs font-medium text-orange-700 mb-1">
                      {isSpanish ? "Problemas identificados:" : "Issues identified:"}
                    </p>
                    <ul className="space-y-1">
                      {problematicClause.issues.map((issue, issueIndex) => (
                        <li key={issueIndex} className="text-xs text-orange-700 ml-2">
                          • {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Citations */}
                  {problematicClause.citations && problematicClause.citations.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-orange-700 mb-1">
                        {isSpanish ? "Texto problemático citado:" : "Problematic text cited:"}
                      </p>
                      <ul className="space-y-1">
                        {problematicClause.citations.map((citation, citationIndex) => (
                          <li key={citationIndex} className="text-xs text-orange-600 ml-2 italic bg-orange-100 p-1 rounded">
                            "{citation}"
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <ListChecks className="mr-2 h-5 w-5 text-blue-500" />
            {isSpanish ? "Cláusulas Faltantes Recomendadas" : "Missing Recommended Clauses"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {insights.missingClauses && insights.missingClauses.length > 0 ? (
            <ul className="space-y-1">
              {insights.missingClauses.map((clause, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  <Badge variant="default" className="mr-1">
                    +
                  </Badge>{' '}
                  {clause}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {isSpanish
                ? "No se identificaron cláusulas estándar faltantes importantes."
                : "No major standard missing clauses identified."}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <ListChecks className="mr-2 h-5 w-5 text-green-500" />
            {isSpanish ? "Hallazgos Clave Adicionales" : "Additional Key Findings"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {insights.keyFindings && insights.keyFindings.length > 0 ? (
            <ul className="space-y-1">
              {insights.keyFindings.map((finding, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  <Badge variant="secondary" className="mr-1">
                    i
                  </Badge>{' '}
                  {finding}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {isSpanish ? "No hay otros hallazgos clave." : "No other key findings."}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <ListChecks className="mr-2 h-5 w-5 text-purple-500" />
            {isSpanish ? "Sugerencias Accionables" : "Actionable Suggestions"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {insights.actionableSuggestions && insights.actionableSuggestions.length > 0 ? (
            <ul className="space-y-1">
              {insights.actionableSuggestions.map((suggestion, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  <Badge variant="outline" className="mr-1">
                    →
                  </Badge>{' '}
                  {suggestion}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {isSpanish ? "No hay sugerencias accionables disponibles." : "No actionable suggestions available."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
