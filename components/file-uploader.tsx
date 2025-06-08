"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { UploadCloud, Loader2, FileText, Brain, CheckCircle2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ProcessingStep {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  status: "pending" | "processing" | "completed" | "error"
}

export default function FileUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([])
  const router = useRouter()
  const { toast } = useToast()

  const initializeProcessingSteps = (): ProcessingStep[] => [
    {
      id: "upload",
      label: "Uploading File",
      description: "Securely uploading your document to our servers",
      icon: <UploadCloud className="h-4 w-4" />,
      status: "pending",
    },
    {
      id: "parse",
      label: "Parsing Document",
      description: "Extracting text and identifying document structure",
      icon: <FileText className="h-4 w-4" />,
      status: "pending",
    },
    {
      id: "segment",
      label: "Segmenting Clauses",
      description: "Breaking down contract into individual clauses",
      icon: <FileText className="h-4 w-4" />,
      status: "pending",
    },
    {
      id: "analyze",
      label: "AI Analysis",
      description: "Analyzing each clause for risks and ambiguities",
      icon: <Brain className="h-4 w-4" />,
      status: "pending",
    },
    {
      id: "complete",
      label: "Finalizing Results",
      description: "Preparing your comprehensive analysis report",
      icon: <CheckCircle2 className="h-4 w-4" />,
      status: "pending",
    },
  ]

  const updateStepStatus = (stepId: string, status: ProcessingStep["status"]) => {
    setProcessingSteps((prev) => prev.map((step) => (step.id === stepId ? { ...step, status } : step)))
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0]

      // Validate file type
      if (!selectedFile.type.includes("pdf") && !selectedFile.name.endsWith(".docx")) {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF or DOCX file.",
          variant: "destructive",
        })
        return
      }

      // Validate file size (50MB limit)
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 50MB.",
          variant: "destructive",
        })
        return
      }

      setFile(selectedFile)
    }
  }

  const simulateProcessingStep = async (stepId: string, duration: number) => {
    updateStepStatus(stepId, "processing")
    await new Promise((resolve) => setTimeout(resolve, duration))
    updateStepStatus(stepId, "completed")
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a PDF or DOCX file to upload.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setProcessingSteps(initializeProcessingSteps())

    try {
      // Step 1: Upload file
      updateStepStatus("upload", "processing")
      
      const formData = new FormData()
      formData.append('file', file)
      
      // Simulate upload progress
      const uploadPromise = fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include', // Important for cookies
      })
      
      // Progress simulation
      for (let i = 0; i <= 90; i += 10) {
        setUploadProgress(i)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
      
      const response = await uploadPromise
      setUploadProgress(100)
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }
      
      const { id: documentId } = await response.json()
      updateStepStatus("upload", "completed")

      // Step 2: Parse document (simulated - actually happens server-side)
      await simulateProcessingStep("parse", 1500)

      // Step 3: Segment clauses (simulated)
      await simulateProcessingStep("segment", 1000)

      // Step 4: AI Analysis (simulated - will stream on next page)
      await simulateProcessingStep("analyze", 2000)

      // Step 5: Finalize
      await simulateProcessingStep("complete", 500)

      // Success
      toast({
        title: "Upload Complete!",
        description: `${file.name} has been successfully uploaded and is ready for analysis.`,
      })

      // Small delay before redirect to show completion
      await new Promise((resolve) => setTimeout(resolve, 500))
      router.push(`/analysis/${documentId}`)
    } catch (error) {
      console.error('Upload error:', error)
      // Handle error
      setProcessingSteps((prev) =>
        prev.map((step) => (step.status === "processing" ? { ...step, status: "error" } : step)),
      )
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "There was an error uploading your document. Please try again.",
        variant: "destructive",
      })
      setIsUploading(false)
    }
  }

  const getStepIcon = (step: ProcessingStep) => {
    switch (step.status) {
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
    }
  }

  const getStepTextColor = (step: ProcessingStep) => {
    switch (step.status) {
      case "processing":
        return "text-blue-600 font-medium"
      case "completed":
        return "text-green-600"
      case "error":
        return "text-red-600"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col items-center justify-center w-full">
        <label
          htmlFor="dropzone-file"
          className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80 transition-colors"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
            <p className="mb-2 text-sm text-muted-foreground">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">PDF or DOCX (MAX. 50MB)</p>
            {file && (
              <div className="mt-3 text-center">
                <p className="text-sm text-primary font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            )}
          </div>
          <Input
            id="dropzone-file"
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.docx"
            disabled={isUploading}
          />
        </label>
      </div>

      {/* Processing Progress */}
      {isUploading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-semibold text-lg">Processing Your Contract</h3>
                <p className="text-sm text-muted-foreground">Please wait while we analyze your document...</p>
              </div>

              {/* Upload Progress Bar */}
              {processingSteps.find((s) => s.id === "upload")?.status === "processing" && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {/* Processing Steps */}
              <div className="space-y-3">
                {processingSteps.map((step, index) => (
                  <div key={step.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">{getStepIcon(step)}</div>
                    <div className="flex-grow min-w-0">
                      <p className={`text-sm font-medium ${getStepTextColor(step)}`}>{step.label}</p>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                    {step.status === "processing" && (
                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Button type="submit" className="w-full" disabled={isUploading || !file}>
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Contract...
          </>
        ) : (
          "Analyze Contract"
        )}
      </Button>
    </form>
  )
}
