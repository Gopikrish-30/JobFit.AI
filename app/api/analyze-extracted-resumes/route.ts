import type { NextRequest } from "next/server"
import { geminiClient, type ResumeAnalysis } from "@/lib/gemini-client"
import type { ExtractedResumeData } from "@/app/page"

export async function POST(request: NextRequest) {
  console.log("=== AI Analysis API Started ===")

  try {
    const formData = await request.formData()
    const extractedDataStr = formData.get("extractedData") as string
    const jobDetailsStr = formData.get("jobDetails") as string

    console.log("Extracted data received:", !!extractedDataStr)
    console.log("Job details received:", !!jobDetailsStr)

    if (!extractedDataStr) {
      console.error("No extracted data provided")
      return new Response(JSON.stringify({ error: "No extracted data provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    let extractedData: ExtractedResumeData[] = []
    let jobDetails = {}
    
    try {
      extractedData = JSON.parse(extractedDataStr)
      jobDetails = JSON.parse(jobDetailsStr)
    } catch (error) {
      console.error("Error parsing data:", error)
      return new Response(JSON.stringify({ error: "Invalid data format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Create streaming response
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        const sendProgress = (progress: number, step: string) => {
          try {
            const data = JSON.stringify({ progress, step })
            const message = `data: ${data}\n\n`
            controller.enqueue(encoder.encode(message))
            console.log(`Progress: ${progress}% - ${step}`)
          } catch (error) {
            console.error("Error sending progress:", error)
          }
        }

        const sendError = (error: string) => {
          try {
            const data = JSON.stringify({ error })
            const message = `data: ${data}\n\n`
            controller.enqueue(encoder.encode(message))
            console.error("Sending error:", error)
          } catch (err) {
            console.error("Error sending error:", err)
          }
        }

        const sendResults = (results: ResumeAnalysis[]) => {
          try {
            const data = JSON.stringify({ results })
            const message = `data: ${data}\n\n`
            controller.enqueue(encoder.encode(message))
            console.log("Results sent successfully")
          } catch (error) {
            console.error("Error sending results:", error)
          }
        }

        try {
          // Send initial heartbeat
          controller.enqueue(encoder.encode(`: heartbeat\n\n`))
          sendProgress(5, "Starting AI analysis of extracted data...")

          console.log(`🤖 Analyzing ${extractedData.length} extracted resumes`)
          console.log(`📋 Extracted data preview:`, extractedData.map(d => ({
            fileName: d.fileName,
            textLength: d.extractedText?.length || 0,
            skillsCount: d.structuredData?.skills?.length || 0,
            hasEmail: !!d.structuredData?.email,
            confidence: d.extractionQuality?.confidence || 0
          })))

          // Set up heartbeat interval to keep connection alive
          const heartbeatInterval = setInterval(() => {
            try {
              controller.enqueue(encoder.encode(`: heartbeat\n\n`))
            } catch (error) {
              clearInterval(heartbeatInterval)
            }
          }, 10000) // Send heartbeat every 10 seconds

          // Analyze each extracted resume
          const analyses: ResumeAnalysis[] = []
          for (let i = 0; i < extractedData.length; i++) {
            const resumeData = extractedData[i]
            const progressPercent = 5 + (i * 70) / extractedData.length
            sendProgress(progressPercent, `AI analyzing ${resumeData.fileName}...`)

            try {
              console.log(`🧠 Analyzing extracted data for: ${resumeData.fileName}`)
              console.log(`📊 Structured data available:`, {
                name: resumeData.structuredData?.name || 'No name',
                email: resumeData.structuredData?.email || 'No email',
                skills: resumeData.structuredData?.skills?.length || 0,
                textLength: resumeData.extractedText?.length || 0,
                confidence: resumeData.extractionQuality?.confidence || 0
              })

              // Validate required data
              if (!resumeData.extractedText || resumeData.extractedText.length < 50) {
                throw new Error(`Insufficient text data for ${resumeData.fileName}`)
              }

              // Add timeout for individual resume analysis
              console.log(`🔄 Starting Gemini analysis for ${resumeData.fileName}...`)
              const analysisPromise = geminiClient.analyzeResume(
                resumeData.extractedText,
                jobDetails,
                {
                  ...resumeData.structuredData,
                  fileName: resumeData.fileName,
                  skills: resumeData.structuredData?.skills || [],
                  experienceYears: extractExperienceYears(resumeData.structuredData?.experience || ''),
                  workHistory: [],
                  keyAchievements: [],
                  certifications: []
                }
              )

              const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Analysis timeout')), 60000) // 60 second timeout
              })

              console.log(`⏱️ Waiting for analysis of ${resumeData.fileName}...`)
              const analysis = await Promise.race([analysisPromise, timeoutPromise])
              console.log(`✅ Analysis completed for ${resumeData.fileName}`)
              
              analysis.file_name = resumeData.fileName

              // Validate the analysis contains real data
              const hasRealAnalysis = analysis.skills.length > 0 ||
                                   analysis.experience_years > 0 ||
                                   analysis.email ||
                                   analysis.education

              if (hasRealAnalysis) {
                analyses.push(analysis)
                console.log(`✅ Successfully analyzed: ${resumeData.fileName}`)
                console.log(`📈 Analysis summary:`, {
                  fitScore: analysis.fit_score || analysis.recommendation_score,
                  skillsFound: analysis.skills.length,
                  experience: analysis.experience_years,
                  hasContact: !!(analysis.email || analysis.phone)
                })
              } else {
                console.warn(`⚠️ Analysis for ${resumeData.fileName} appears to contain insufficient real data`)
                console.warn(`Creating enhanced fallback analysis...`)
                const fallbackAnalysis = geminiClient.createEnhancedFallbackAnalysis(
                  resumeData.extractedText, 
                  resumeData.structuredData, 
                  jobDetails
                )
                fallbackAnalysis.file_name = resumeData.fileName
                analyses.push(fallbackAnalysis)
              }
            } catch (error) {
              console.error(`❌ Error analyzing ${resumeData.fileName}:`, error)
              
              // Create a fallback analysis using the extracted structured data
              try {
                console.log(`🔄 Creating fallback analysis for ${resumeData.fileName}`)
                const fallbackAnalysis = geminiClient.createEnhancedFallbackAnalysis(
                  resumeData.extractedText, 
                  resumeData.structuredData, 
                  jobDetails
                )
                fallbackAnalysis.file_name = resumeData.fileName
                analyses.push(fallbackAnalysis)
                console.log(`✅ Fallback analysis created for ${resumeData.fileName}`)
              } catch (fallbackError) {
                console.error(`❌ Even fallback analysis failed for ${resumeData.fileName}:`, fallbackError)
              }
            }
          }

          if (analyses.length === 0) {
            sendError("Failed to analyze any resume")
            controller.close()
            return
          }

          sendProgress(85, "Analysis complete. Ranking candidates...")

          // Rank candidates using enhanced ranking system
          const rankedResults = await geminiClient.rankCandidates(analyses, jobDetails)

          sendProgress(100, "AI analysis complete!")

          // Send final results
          sendResults(rankedResults)
          clearInterval(heartbeatInterval)
          controller.close()
        } catch (error) {
          console.error("Stream processing error:", error)
          clearInterval(heartbeatInterval)
          sendError("AI analysis failed: " + (error instanceof Error ? error.message : "Unknown error"))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "X-Accel-Buffering": "no", // Disable nginx buffering
      },
    })
  } catch (error) {
    console.error("=== AI Analysis API Error ===", error)
    return new Response(
      JSON.stringify({
        error: "Failed to process request: " + (error instanceof Error ? error.message : "Unknown error"),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

// Helper function to extract experience years from text
function extractExperienceYears(experienceText: string): number {
  if (!experienceText) return 0
  
  const match = experienceText.match(/(\d+)\s*years?/i)
  return match ? parseInt(match[1]) : 0
}
