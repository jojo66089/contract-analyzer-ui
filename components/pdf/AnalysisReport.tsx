import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import type { Analysis, Clause, SummaryInsights } from '@/lib/types';

// Enhanced styles for better readability and spacing
const styles = StyleSheet.create({
  page: { 
    padding: 40, 
    fontSize: 12, 
    fontFamily: 'Helvetica',
    lineHeight: 1.4
  },
  section: { 
    marginBottom: 24
  },
  heading: { 
    fontSize: 22, 
    marginBottom: 12, 
    fontWeight: 'bold', 
    color: '#1a202c',
    textDecoration: 'underline' 
  },
  subheading: { 
    fontSize: 16, 
    marginBottom: 8, 
    fontWeight: 'bold', 
    color: '#2d3748',
    paddingTop: 8,
    borderBottom: '1pt solid #e2e8f0',
    paddingBottom: 4
  },
  text: { 
    marginBottom: 4, 
    color: '#2d3748' 
  },
  clause: { 
    marginBottom: 16, 
    padding: 12, 
    border: '1pt solid #e2e8f0', 
    borderRadius: 4, 
    backgroundColor: '#f7fafc',
    marginTop: 8
  },
  clauseTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 8,
    color: '#2d3748'
  },
  clauseText: {
    marginBottom: 8,
    fontStyle: 'italic',
    paddingLeft: 8,
    borderLeft: '2pt solid #e2e8f0'
  },
  label: { 
    fontWeight: 'bold', 
    color: '#4a5568' 
  },
  analysisItem: {
    marginTop: 4,
    marginBottom: 4,
    paddingLeft: 16
  },
  summaryItem: {
    marginBottom: 12
  }
});

interface AnalysisReportProps {
  contractName: string;
  clauses: Clause[];
  analysis: Analysis[];
  summary: SummaryInsights;
  language?: 'en' | 'es' | 'pt' | 'zh';
}

const translations = {
  en: {
    title: 'Contract Analysis Report',
    contract: 'Contract',
    summaryInsights: 'Summary Insights',
    overallRisk: 'Overall Risk',
    score: 'Score',
    ambiguousTerms: 'Ambiguous Terms',
    unfairClauses: 'Unfair Clauses',
    missingClauses: 'Missing Clauses',
    keyFindings: 'Key Findings',
    suggestions: 'Suggestions',
    clauseAnalyses: 'Clause Analyses',
    clause: 'Clause',
    untitled: 'Untitled',
    risks: 'Risks',
    ambiguities: 'Ambiguities',
    recommendations: 'Recommendations',
    missingElements: 'Missing Elements',
    references: 'References',
    none: 'None'
  },
  es: {
    title: 'Informe de Análisis de Contrato',
    contract: 'Contrato',
    summaryInsights: 'Resumen de Información',
    overallRisk: 'Riesgo General',
    score: 'Puntuación',
    ambiguousTerms: 'Términos Ambiguos',
    unfairClauses: 'Cláusulas Injustas',
    missingClauses: 'Cláusulas Faltantes',
    keyFindings: 'Hallazgos Clave',
    suggestions: 'Sugerencias',
    clauseAnalyses: 'Análisis de Cláusulas',
    clause: 'Cláusula',
    untitled: 'Sin título',
    risks: 'Riesgos',
    ambiguities: 'Ambigüedades',
    recommendations: 'Recomendaciones',
    missingElements: 'Elementos Faltantes',
    references: 'Referencias',
    none: 'Ninguno'
  },
  pt: {
    title: 'Relatório de Análise de Contrato',
    contract: 'Contrato',
    summaryInsights: 'Resumo de Insights',
    overallRisk: 'Risco Geral',
    score: 'Pontuação',
    ambiguousTerms: 'Termos Ambíguos',
    unfairClauses: 'Cláusulas Injustas',
    missingClauses: 'Cláusulas Ausentes',
    keyFindings: 'Principais Descobertas',
    suggestions: 'Sugestões',
    clauseAnalyses: 'Análises de Cláusulas',
    clause: 'Cláusula',
    untitled: 'Sem título',
    risks: 'Riscos',
    ambiguities: 'Ambiguidades',
    recommendations: 'Recomendações',
    missingElements: 'Elementos Ausentes',
    references: 'Referências',
    none: 'Nenhum'
  },
  zh: {
    title: '合同分析报告',
    contract: '合同',
    summaryInsights: '摘要见解',
    overallRisk: '总体风险',
    score: '评分',
    ambiguousTerms: '模糊条款',
    unfairClauses: '不公平条款',
    missingClauses: '缺失条款',
    keyFindings: '主要发现',
    suggestions: '建议',
    clauseAnalyses: '条款分析',
    clause: '条款',
    untitled: '无标题',
    risks: '风险',
    ambiguities: '模糊性',
    recommendations: '建议',
    missingElements: '缺失要素',
    references: '参考',
    none: '无'
  }
};

export const AnalysisReport: React.FC<AnalysisReportProps> = ({ 
  contractName, 
  clauses, 
  analysis, 
  summary,
  language = 'en'
}) => {
  const t = translations[language] || translations.en;
  
  // Helper to format summary items
  const formatSummaryItem = (items: string[] | undefined, fallback: string) => {
    if (!items || items.length === 0) return fallback;
    return items.map((item, i) => `${i + 1}. ${item}`).join('\n');
  };

  // Helper to format unfair clauses
  const formatUnfairClauses = (items: { clauseId: string; description: string }[] | undefined, fallback: string) => {
    if (!items || items.length === 0) return fallback;
    return items.map((item, i) => `${i + 1}. ${item.description}`).join('\n');
  };
  
  return (
    <Document>
      <Page style={styles.page} wrap>
        <View style={styles.section}>
          <Text style={styles.heading}>{t.title}</Text>
          <Text style={styles.text}>
            <Text style={styles.label}>{t.contract}: </Text>
            <Text>{contractName}</Text>
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.subheading}>{t.summaryInsights}</Text>
          
          <View style={styles.summaryItem}>
            <Text>
              <Text style={styles.label}>{t.overallRisk}: </Text>
              <Text>{summary.overallRisk || t.none}</Text>
            </Text>
            <Text>
              <Text style={styles.label}>{t.score}: </Text>
              <Text>{summary.riskScore || 0}/10</Text>
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.label}>{t.ambiguousTerms}:</Text>
            <Text style={styles.analysisItem}>
              {formatSummaryItem(summary.ambiguousTerms, t.none)}
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.label}>{t.unfairClauses}:</Text>
            <Text style={styles.analysisItem}>
              {formatUnfairClauses(summary.unfairClauses, t.none)}
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.label}>{t.missingClauses}:</Text>
            <Text style={styles.analysisItem}>
              {formatSummaryItem(summary.missingClauses, t.none)}
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.label}>{t.keyFindings}:</Text>
            <Text style={styles.analysisItem}>
              {formatSummaryItem(summary.keyFindings, t.none)}
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.label}>{t.suggestions}:</Text>
            <Text style={styles.analysisItem}>
              {formatSummaryItem(summary.actionableSuggestions, t.none)}
            </Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.subheading}>{t.clauseAnalyses}</Text>
          
          {clauses.map((clause, idx) => {
            const clauseAnalysis = analysis.find(a => a.clauseId === clause.id);
            const clauseNum = idx + 1;
            
            return (
              <View key={clause.id} style={styles.clause} wrap={false}>
                <Text style={styles.clauseTitle}>
                  {t.clause} {clauseNum}: {clause.title || t.untitled}
                </Text>
                
                <Text style={styles.clauseText}>{clause.text}</Text>
                
                {clauseAnalysis ? (
                  <>
                    <View style={styles.summaryItem}>
                      <Text style={styles.label}>{t.risks}:</Text>
                      <Text style={styles.analysisItem}>
                        {clauseAnalysis.risks && clauseAnalysis.risks.length > 0 
                          ? clauseAnalysis.risks.map((item, i) => `${i + 1}. ${item}`).join('\n') 
                          : t.none}
                      </Text>
                    </View>
                    
                    <View style={styles.summaryItem}>
                      <Text style={styles.label}>{t.ambiguities}:</Text>
                      <Text style={styles.analysisItem}>
                        {clauseAnalysis.ambiguities && clauseAnalysis.ambiguities.length > 0 
                          ? clauseAnalysis.ambiguities.map((item, i) => `${i + 1}. ${item}`).join('\n') 
                          : t.none}
                      </Text>
                    </View>
                    
                    <View style={styles.summaryItem}>
                      <Text style={styles.label}>{t.recommendations}:</Text>
                      <Text style={styles.analysisItem}>
                        {clauseAnalysis.recommendations && clauseAnalysis.recommendations.length > 0 
                          ? clauseAnalysis.recommendations.map((item, i) => `${i + 1}. ${item}`).join('\n') 
                          : t.none}
                      </Text>
                    </View>
                    
                    {clauseAnalysis.missingElements && clauseAnalysis.missingElements.length > 0 ? (
                      <View style={styles.summaryItem}>
                        <Text style={styles.label}>{t.missingElements}:</Text>
                        <Text style={styles.analysisItem}>
                          {clauseAnalysis.missingElements.map((item, i) => `${i + 1}. ${item}`).join('\n')}
                        </Text>
                      </View>
                    ) : null}
                    
                    {clauseAnalysis.references && clauseAnalysis.references.length > 0 ? (
                      <View style={styles.summaryItem}>
                        <Text style={styles.label}>{t.references}:</Text>
                        <Text style={styles.analysisItem}>
                          {clauseAnalysis.references.map((item, i) => `${i + 1}. ${item}`).join('\n')}
                        </Text>
                      </View>
                    ) : null}
                  </>
                ) : (
                  <Text style={styles.text}>{t.none}</Text>
                )}
              </View>
            );
          })}
        </View>
      </Page>
    </Document>
  );
}; 