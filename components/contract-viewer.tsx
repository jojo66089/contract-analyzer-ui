import type { Clause } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ContractViewerProps {
  contractText: string
  selectedClause: Clause | null
}

export default function ContractViewer({ contractText, selectedClause }: ContractViewerProps) {
  // Basic highlighting - in a real app, this would be more sophisticated
  const highlightText = (text: string, highlight?: string) => {
    if (!highlight) return text
    const parts = text.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"))
    return parts.map((part, i) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <mark key={i} className="bg-yellow-300 dark:bg-yellow-700 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      ),
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">Full Contract Text</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-auto">
        <pre className="whitespace-pre-wrap text-sm font-mono bg-muted p-4 rounded-md h-full min-h-0 max-h-full overflow-y-scroll scrollbar-thin scrollbar-thumb-border scrollbar-track-muted">
          {highlightText(contractText, selectedClause?.text)}
        </pre>
      </CardContent>
    </Card>
  )
}
