"use client"

import { useState, useEffect } from "react"
import { CheckCircle, Loader2, FileText, Brain, Database, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import type { JobDetails, ExtractedResumeData } from "@/app/page"

interface StepThreeExtractionProps {
  files: File[]
  jobDetails: JobDetails
  onComplete: (extractedData: ExtractedResumeData[]) => void
  onBack: () => void
}

export function StepThreeExtraction({ files, jobDetails, onComplete, onBack }: StepThreeExtractionProps) {
  const [currentFile, setCurrentFile] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState("")
  const [currentStep, setCurrentStep] = useState("Initializing...")
  const [extractedData, setExtractedData] = useState<ExtractedResumeData[]>([])

  const extractionSteps = [
    {
      name: "PDF Text Extraction",
      icon: FileText,
      description: "Extracting raw text content from PDF files using pdf-parse",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      name: "LangChain Processing",
      icon: Brain,
      description: "Using LangChain to split text into semantic chunks",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      name: "RAG Vector Storage",
      icon: Database,
      description: "Creating vector embeddings and storing in memory",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    },
    {
      name: "Structured Extraction",
      icon: Zap,
      description: "Extracting structured data using AI and pattern matching",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    },
  ]

  const startExtraction = async () => {
    setIsProcessing(true)
    setError("")
    setProgress(0)
    setCurrentStep("Starting comprehensive information extraction...")

    try {
      console.log("🚀 Starting LangChain + RAG extraction for", files.length, "files")
      
      const allExtractedData: ExtractedResumeData[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setCurrentFile(i)
        const baseProgress = (i / files.length) * 100

        console.log(`📄 Processing file ${i + 1}/${files.length}: ${file.name}`)
        setCurrentStep(`Processing ${file.name} with LangChain + RAG...`)

        try {
          // Step 1: PDF Text Extraction using our enhanced API
          setProgress(baseProgress + 5)
          setCurrentStep(`Step 1: Extracting text from ${file.name}...`)
          
          const formData = new FormData()
          formData.append('file', file)
          
          const extractResponse = await fetch('/api/extract-pdf', {
            method: 'POST',
            body: formData
          })
          
          if (!extractResponse.ok) {
            throw new Error(`PDF extraction failed: ${extractResponse.status}`)
          }
          
          const extractResult = await extractResponse.json()
          
          if (!extractResult.success) {
            throw new Error(`PDF extraction failed: ${extractResult.error}`)
          }

          console.log(`✅ Text extracted from ${file.name}: ${extractResult.length} characters`)
          console.log(`📝 Preview: ${extractResult.text.substring(0, 200)}...`)
          console.log(`🧩 Chunks created: ${extractResult.chunks?.length || 0}`)

          // Step 2: LangChain Processing & RAG
          setProgress(baseProgress + 25)
          setCurrentStep(`Step 2: Processing ${file.name} with LangChain and RAG...`)

          const ragFormData = new FormData()
          ragFormData.append('text', extractResult.text)
          ragFormData.append('fileName', file.name)
          ragFormData.append('jobDetails', JSON.stringify(jobDetails))

          // CRITICAL: Pass the chunks from PDF extraction to RAG processing
          if (extractResult.chunks && extractResult.chunks.length > 0) {
            ragFormData.append('chunks', JSON.stringify(extractResult.chunks))
            console.log(`📦 Passing ${extractResult.chunks.length} chunks to RAG processing`)
          }
          
          const ragResponse = await fetch('/api/process-with-rag', {
            method: 'POST',
            body: ragFormData
          })
          
          if (!ragResponse.ok) {
            console.log(`⚠️ RAG API not available, using local processing...`)
            // Fallback to local processing
            const localResult = await processWithLocalRAG(extractResult.text, file.name, jobDetails)
            
            const extractedFileData: ExtractedResumeData = {
              fileName: file.name,
              extractedText: extractResult.text,
              chunks: localResult.chunks || [],
              structuredData: localResult.structuredData,
              extractionQuality: {
                textLength: extractResult.length || 0,
                hasContact: !!(localResult.structuredData?.email || localResult.structuredData?.phone),
                hasSkills: (localResult.structuredData?.skills?.length || 0) > 0,
                hasExperience: !!(localResult.structuredData?.experience),
                confidence: localResult.confidence || 0.7
              }
            }

            allExtractedData.push(extractedFileData)
            setExtractedData([...allExtractedData])
            
          } else {
            const ragResult = await ragResponse.json()
            
            console.log(`✅ RAG processing completed for ${file.name}`)
            console.log(`📊 Extracted structured data:`, ragResult.structuredData)

            // Create extracted data object
            const extractedFileData: ExtractedResumeData = {
              fileName: file.name,
              extractedText: extractResult.text,
              chunks: ragResult.chunks || [],
              structuredData: ragResult.structuredData || {
                name: file.name.replace(/\.[^/.]+$/, ""),
                email: "",
                phone: "",
                skills: [],
                experience: "",
                education: "",
                summary: ""
              },
              extractionQuality: {
                textLength: extractResult.length || 0,
                hasContact: !!(ragResult.structuredData?.email || ragResult.structuredData?.phone),
                hasSkills: (ragResult.structuredData?.skills?.length || 0) > 0,
                hasExperience: !!(ragResult.structuredData?.experience),
                confidence: ragResult.confidence || 0.8
              }
            }

            allExtractedData.push(extractedFileData)
            setExtractedData([...allExtractedData])
          }

          setProgress(baseProgress + 100/files.length)
          console.log(`✅ Completed processing ${file.name}`)

        } catch (fileError) {
          console.error(`❌ Error processing ${file.name}:`, fileError)
          
          // Create fallback extracted data with basic text extraction
          try {
            const fallbackText = await file.text()
            const fallbackData: ExtractedResumeData = {
              fileName: file.name,
              extractedText: fallbackText,
              chunks: [],
              structuredData: {
                name: file.name.replace(/\.[^/.]+$/, ""),
                email: extractEmail(fallbackText) || "",
                phone: extractPhone(fallbackText) || "",
                skills: extractBasicSkills(fallbackText),
                experience: extractBasicExperience(fallbackText),
                education: extractBasicEducation(fallbackText),
                summary: "Basic extraction - manual review recommended"
              },
              extractionQuality: {
                textLength: fallbackText.length,
                hasContact: !!(extractEmail(fallbackText) || extractPhone(fallbackText)),
                hasSkills: extractBasicSkills(fallbackText).length > 0,
                hasExperience: !!extractBasicExperience(fallbackText),
                confidence: 0.3
              }
            }
            
            allExtractedData.push(fallbackData)
            setExtractedData([...allExtractedData])
          } catch (fallbackError) {
            console.error(`❌ Even fallback extraction failed for ${file.name}:`, fallbackError)
          }
        }
      }

      setProgress(100)
      setCurrentStep("Information extraction complete!")
      setIsComplete(true)
      setIsProcessing(false)
      
      console.log(`🎉 Extraction completed for all ${files.length} files`)
      console.log(`📊 Total extracted data:`, allExtractedData)
      
      onComplete(allExtractedData)

    } catch (err) {
      console.error("❌ Extraction process error:", err)
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
      setError(errorMessage)
      setIsProcessing(false)
      setProgress(0)
    }
  }

  // Local RAG processing fallback
  const processWithLocalRAG = async (text: string, fileName: string, jobDetails: JobDetails) => {
    console.log(`🔄 Processing ${fileName} with local RAG fallback...`)
    
    // Basic text chunking
    const chunks = text.match(/.{1,1000}/g) || []
    
    // Extract structured data using basic patterns
    const structuredData = {
      name: fileName.replace(/\.[^/.]+$/, ""),
      email: extractEmail(text) || "",
      phone: extractPhone(text) || "",
      skills: extractBasicSkills(text),
      experience: extractBasicExperience(text),
      education: extractBasicEducation(text),
      summary: `Processed with local extraction from ${fileName}`
    }
    
    return {
      chunks: chunks.map((chunk, index) => ({ content: chunk, index })),
      structuredData,
      confidence: 0.6
    }
  }

  // Helper functions for basic extraction
  const extractEmail = (text: string): string | null => {
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
    return emailMatch ? emailMatch[0] : null
  }

  const extractPhone = (text: string): string | null => {
    const phoneMatch = text.match(/(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/)
    return phoneMatch ? phoneMatch[0] : null
  }

  const extractBasicSkills = (text: string): string[] => {
    const skillKeywords = [
      'Python', 'JavaScript', 'Java', 'React', 'SQL', 'Machine Learning', 'Deep Learning',
      'Power BI', 'PowerBI', 'Frontend', 'Backend', 'Data', 'LLMs', 'Data Visualization',
      'Frontend Development', 'Programming', 'Development', 'Analytics', 'AI', 'ML'
    ]
    
    return skillKeywords.filter(skill => {
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
      return regex.test(text)
    })
  }

  const extractBasicExperience = (text: string): string => {
    const expMatch = text.match(/(\d+)\+?\s*years?\s*(?:of\s*)?experience/gi)
    return expMatch ? expMatch[0] : ""
  }

  const extractBasicEducation = (text: string): string => {
    const eduMatch = text.match(/(Bachelor|Master|PhD|B\.S\.|M\.S\.|B\.A\.|M\.A\.).*?(?:in\s+)?([A-Za-z\s]+)/i)
    return eduMatch ? eduMatch[0] : ""
  }

  useEffect(() => {
    startExtraction()
  }, [])

  const currentStepIndex = Math.floor((progress / 100) * extractionSteps.length)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">🧠 Advanced Information Extraction</h2>
        <p className="text-slate-600">
          Using LangChain, RAG, and AI to extract comprehensive data from {files.length} resume(s)
        </p>
        <div className="text-sm text-slate-500">
          Step 3 of 5: Deep content analysis and structured data extraction
        </div>
      </div>

      {/* Progress Overview */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-900">Extraction Progress</span>
              <span className="text-xl font-bold text-blue-600">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="text-sm text-slate-600">
              {isComplete ? "All resumes processed with LangChain + RAG!" : currentStep}
            </div>
            {files.length > 1 && (
              <div className="text-xs text-slate-500">
                Processing file {currentFile + 1} of {files.length}: {files[currentFile]?.name}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Extraction Steps */}
      <div className="grid md:grid-cols-2 gap-4">
        {extractionSteps.map((step, index) => {
          const isActive = currentStepIndex === index && isProcessing && !isComplete
          const isCompleted = currentStepIndex > index || isComplete
          const isPending = currentStepIndex < index && !isComplete

          return (
            <Card
              key={index}
              className={`transition-all duration-500 ${
                isActive
                  ? `${step.borderColor} border-2 shadow-lg`
                  : isCompleted
                    ? "border-green-200 bg-green-50"
                    : "border-slate-200"
              }`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isActive ? step.bgColor : isCompleted ? "bg-green-100" : "bg-slate-100"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : isActive ? (
                      <Loader2 className={`h-4 w-4 ${step.color} animate-spin`} />
                    ) : (
                      <step.icon className={`h-4 w-4 ${isPending ? "text-slate-400" : step.color}`} />
                    )}
                  </div>
                  <span className={`${isActive ? step.color : isCompleted ? "text-green-700" : "text-slate-600"}`}>
                    {step.name}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p
                  className={`text-xs ${isActive ? "text-slate-700" : isCompleted ? "text-green-600" : "text-slate-500"}`}
                >
                  {step.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Extracted Data Preview */}
      {extractedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📊 Extraction Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {extractedData.map((data, index) => (
                <div key={index} className="border rounded-lg p-3 bg-slate-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-slate-900">{data.fileName}</h4>
                      <p className="text-sm text-slate-600">
                        {data.structuredData.name} • {data.extractionQuality.textLength} chars
                      </p>
                      <div className="flex gap-2 mt-1">
                        {data.extractionQuality.hasContact && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">📧 Contact Info</span>
                        )}
                        {data.extractionQuality.hasSkills && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            🛠️ {data.structuredData.skills.length} Skills
                          </span>
                        )}
                        {data.extractionQuality.hasExperience && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">💼 Experience</span>
                        )}
                      </div>
                      {data.structuredData.skills.length > 0 && (
                        <div className="text-xs text-slate-600 mt-1">
                          Skills: {data.structuredData.skills.slice(0, 5).join(', ')}
                          {data.structuredData.skills.length > 5 && '...'}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-slate-900">
                        {Math.round(data.extractionQuality.confidence * 100)}% confidence
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="text-red-700">
              <strong>Error:</strong> {error}
            </div>
            <Button onClick={startExtraction} className="mt-2" size="sm" disabled={isProcessing}>
              Retry Extraction
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} disabled={isProcessing}>
          ← Back to Job Details
        </Button>
        {isComplete && (
          <div className="text-center">
            <div className="text-green-600 font-semibold">✅ Extraction Complete!</div>
            <div className="text-sm text-slate-600">Ready for AI analysis</div>
          </div>
        )}
      </div>
    </div>
  )
}
