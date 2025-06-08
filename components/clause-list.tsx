"use client"

import type { Clause } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ClauseListProps {
  clauses: Clause[]
  selectedClauseId?: string | null
  onClauseSelect: (clause: Clause) => void
  language?: "en" | "es" | "pt" | "zh"
}

const RiskIcon = ({ riskLevel }: { riskLevel?: "high" | "medium" | "low" }) => {
  if (!riskLevel) return null
  if (riskLevel === "high") return <AlertTriangle className="w-4 h-4 text-red-500" />
  if (riskLevel === "medium") return <AlertCircle className="w-4 h-4 text-yellow-500" />
  return <CheckCircle className="w-4 h-4 text-green-500" />
}

const translations = {
  en: {
    noClauses: "No clauses found in this document.",
    clause: "Clause"
  },
  es: {
    noClauses: "No se encontraron cláusulas en este documento.",
    clause: "Cláusula"
  },
  pt: {
    noClauses: "Nenhuma cláusula encontrada neste documento.",
    clause: "Cláusula"
  },
  zh: {
    noClauses: "本文档中未找到条款。",
    clause: "条款"
  }
}

export default function ClauseList({ clauses, selectedClauseId, onClauseSelect, language = "en" }: ClauseListProps) {
  const t = translations[language] || translations.en;
  
  if (!clauses || clauses.length === 0) {
    return <p className="p-4 text-muted-foreground">{t.noClauses}</p>
  }

  return (
    <div className="space-y-1">
      {clauses.map((clause, index) => (
        <Button
          key={clause.id}
          variant="ghost"
          className={cn(
            "w-full justify-start text-left h-auto py-2 px-3 whitespace-normal",
            selectedClauseId === clause.id && "bg-accent text-accent-foreground",
          )}
          onClick={() => onClauseSelect(clause)}
        >
          <div className="flex items-center w-full">
            <div className="flex-grow">
              <p className="font-semibold text-sm">{clause.title || `${t.clause} ${index + 1}`}</p>
              <p className="text-xs text-muted-foreground truncate">{clause.text.substring(0, 80)}...</p>
            </div>
            <RiskIcon riskLevel={clause.riskLevel} />
          </div>
        </Button>
      ))}
    </div>
  )
}
