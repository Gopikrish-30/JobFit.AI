"use client"

import type React from "react"
import { useState } from "react"
import { Upload, FileText, CheckCircle, Users, Zap, Shield, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface StepOneProps {
  files: File[]
  setFiles: (files: File[]) => void
  onNext: () => void
}

export function StepOne({ files, setFiles, onNext }: StepOneProps) {
  const [dragActive, setDragActive] = useState(false)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File upload triggered")
    const selectedFiles = Array.from(event.target.files || [])
    console.log("Selected files:", selectedFiles.map(f => ({ name: f.name, type: f.type, size: f.size })))

    const validFiles = selectedFiles.filter(
      (file) =>
        file.type === "application/pdf" ||
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )
    console.log("Valid files after filtering:", validFiles.map(f => ({ name: f.name, type: f.type })))

    setFiles([...files, ...validFiles])
    console.log("Total files after upload:", [...files, ...validFiles].length)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    console.log("Files dropped")
    const droppedFiles = Array.from(e.dataTransfer.files)
    console.log("Dropped files:", droppedFiles.map(f => ({ name: f.name, type: f.type, size: f.size })))

    const validFiles = droppedFiles.filter(
      (file) =>
        file.type === "application/pdf" ||
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )
    console.log("Valid dropped files:", validFiles.map(f => ({ name: f.name, type: f.type })))

    setFiles([...files, ...validFiles])
    console.log("Total files after drop:", [...files, ...validFiles].length)
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-8">
      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="text-center border-2 border-blue-100 bg-blue-50/50 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <Users className="h-10 w-10 mx-auto mb-4 text-blue-600" />
            <h3 className="font-semibold text-lg mb-2 text-slate-900">Multi-Resume Analysis</h3>
            <p className="text-sm text-slate-600">Upload multiple resumes for comprehensive comparison and ranking</p>
          </CardContent>
        </Card>
        <Card className="text-center border-2 border-green-100 bg-green-50/50 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <Zap className="h-10 w-10 mx-auto mb-4 text-green-600" />
            <h3 className="font-semibold text-lg mb-2 text-slate-900">AI-Powered Matching</h3>
            <p className="text-sm text-slate-600">Advanced algorithms match candidates to job requirements</p>
          </CardContent>
        </Card>
        <Card className="text-center border-2 border-purple-100 bg-purple-50/50 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <Shield className="h-10 w-10 mx-auto mb-4 text-purple-600" />
            <h3 className="font-semibold text-lg mb-2 text-slate-900">Secure & Private</h3>
            <p className="text-sm text-slate-600">Enterprise-grade security with data privacy protection</p>
          </CardContent>
        </Card>
        <Card className="text-center border-2 border-orange-100 bg-orange-50/50 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <TrendingUp className="h-10 w-10 mx-auto mb-4 text-orange-600" />
            <h3 className="font-semibold text-lg mb-2 text-slate-900">Intelligent Rankings</h3>
            <p className="text-sm text-slate-600">Get detailed insights and explanations for each candidate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Upload className="h-6 w-6 text-blue-600" />
              Upload Resume Files
            </CardTitle>
            <CardDescription className="text-base">
              Drag and drop files or click to browse. Supports PDF and DOCX formats up to 10MB each.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                dragActive
                  ? "border-blue-500 bg-blue-50 scale-105"
                  : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                accept=".pdf,.docx"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-4">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                  <FileText className="h-10 w-10 text-blue-600" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-slate-700">Drop files here or click to browse</p>
                  <p className="text-slate-500 mt-2">Supports PDF and DOCX formats</p>
                </div>
                <div className="flex justify-center gap-3">
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    PDF
                  </Badge>
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    DOCX
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Uploaded Files */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Uploaded Files ({files.length})
            </CardTitle>
            <CardDescription className="text-base">
              {files.length === 0 ? "No files uploaded yet" : "Review and manage your uploaded files"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {files.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">Upload resumes to get started</p>
                <p className="text-sm mt-2">Minimum 3 resumes recommended for best results</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg border border-slate-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">{file.name}</p>
                        <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Next Button */}
      <div className="flex justify-center pt-8">
        <Button
          onClick={onNext}
          disabled={files.length === 0}
          size="lg"
          className="px-12 py-4 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Continue to Job Requirements →
        </Button>
      </div>
    </div>
  )
}
