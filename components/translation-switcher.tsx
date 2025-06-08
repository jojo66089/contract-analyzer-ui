"use client"

import { Button } from "@/components/ui/button"
import { Languages } from "lucide-react"

interface TranslationSwitcherProps {
  currentLanguage: "en" | "es" | "pt" | "zh"
  onLanguageChange: (lang: "en" | "es" | "pt" | "zh") => void
  disabled?: boolean
}

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "zh", label: "中文 (Mandarin)" },
]

export default function TranslationSwitcher({ currentLanguage, onLanguageChange, disabled = false }: TranslationSwitcherProps) {
  return (
    <div className="flex items-center gap-1">
      <Languages className="mr-2 h-4 w-4" />
      <select
        className="border rounded px-2 py-1 text-sm bg-background"
        value={currentLanguage}
        onChange={e => onLanguageChange(e.target.value as "en" | "es" | "pt" | "zh")}
        disabled={disabled}
      >
        {LANGUAGES.map(lang => (
          <option key={lang.code} value={lang.code}>{lang.label}</option>
        ))}
      </select>
    </div>
  )
}
