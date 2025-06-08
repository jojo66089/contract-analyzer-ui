import FileUploader from "@/components/file-uploader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">AI Contract Analyzer</CardTitle>
          <CardDescription>
            Upload your legal contract (PDF/DOCX) for a detailed clause-by-clause analysis. Supports large and complex
            documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUploader />
          <p className="mt-4 text-xs text-muted-foreground text-center">
            Your document will be processed securely. We prioritize your privacy.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
