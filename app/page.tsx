"use client"

import { useState } from "react"
import { StepOne } from "@/components/steps/step-one"
import { StepTwo } from "@/components/steps/step-two"
import { StepThreeExtraction } from "@/components/steps/step-three-extraction"
import { StepThree } from "@/components/steps/step-three"
import { StepFour } from "@/components/steps/step-four"
import type { ResumeAnalysis } from "@/lib/gemini-client"

export interface JobDetails {
  jobTitle: string
  department: string
  experienceLevel: string
  minExperience: string
  maxExperience: string
  jobDescription: string
  requiredSkills: string[]
  preferredSkills: string[]
  keyResponsibilities: string
  educationRequirement: string
  companyInformation: string
}

export interface ProcessedResume {
  file_name: string
  candidate: string
  email: string
  phone: string
  skills: string[]
  soft_skills: string[]
  red_flags: string[]
  recruiter_score: number
  analyst_score: number
  hr_score: number
  recommendation_score: number
  feedback: string
  recruiter_feedback: string
  analyst_feedback: string
  hr_feedback: string
  positive_points: string[]
  negative_points: string[]
  overall_explanation: string
}

export interface ExtractedResumeData {
  fileName: string
  extractedText: string
  chunks: any[]
  structuredData: {
    name: string
    email: string
    phone: string
    skills: string[]
    experience: string
    education: string
    summary: string
  }
  extractionQuality: {
    textLength: number
    hasContact: boolean
    hasSkills: boolean
    hasExperience: boolean
    confidence: number
  }
}

export default function ResumeScreener() {
  const [currentStep, setCurrentStep] = useState(1)
  const [files, setFiles] = useState<File[]>([])
  const [jobDetails, setJobDetails] = useState<JobDetails>({
    jobTitle: "",
    department: "",
    experienceLevel: "",
    minExperience: "",
    maxExperience: "",
    jobDescription: "",
    requiredSkills: [],
    preferredSkills: [],
    keyResponsibilities: "",
    educationRequirement: "",
    companyInformation: "",
  })
  const [extractedData, setExtractedData] = useState<ExtractedResumeData[]>([])
  const [results, setResults] = useState<ResumeAnalysis[]>([])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Professional Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                JobFit.AI
              </h1>
              <p className="text-slate-600 mt-2 text-lg">Intelligent Resume Screening & Candidate Matching Platform</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {currentStep === 1 && <StepOne files={files} setFiles={setFiles} onNext={() => setCurrentStep(2)} />}
        {currentStep === 2 && (
          <StepTwo
            jobDetails={jobDetails}
            setJobDetails={setJobDetails}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
          />
        )}
        {currentStep === 3 && (
          <StepThreeExtraction
            files={files}
            jobDetails={jobDetails}
            onComplete={(extractedData) => {
              setExtractedData(extractedData)
              setCurrentStep(4)
            }}
            onBack={() => setCurrentStep(2)}
          />
        )}
        {currentStep === 4 && (
          <StepThree
            extractedData={extractedData}
            jobDetails={jobDetails}
            onComplete={(results) => {
              setResults(results)
              setCurrentStep(5)
            }}
            onBack={() => setCurrentStep(3)}
          />
        )}
        {currentStep === 5 && <StepFour results={results} jobDetails={jobDetails} onBack={() => setCurrentStep(1)} />}
      </div>
    </div>
  )
}
