import type { NextRequest } from "next/server"
import { extractTextFromFile } from "@/lib/pdf-extractor"
import { geminiClient, type ResumeAnalysis } from "@/lib/gemini-client"

export async function POST(request: NextRequest) {
  console.log("=== API Route Started ===")

  try {
    const formData = await request.formData()
    const files = formData.getAll("resumes") as File[]
    const jobDetailsStr = formData.get("jobDetails") as string

    console.log("Files received:", files.length)
    console.log("Job details received:", !!jobDetailsStr)

    if (!files || files.length === 0) {
      console.error("No files provided")
      return new Response(JSON.stringify({ error: "No files provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    let jobDetails = {}
    try {
      jobDetails = JSON.parse(jobDetailsStr)
    } catch (error) {
      console.error("Error parsing job details:", error)
      jobDetails = { jobTitle: "Software Engineer", requiredSkills: [] }
    }

    // Create streaming response
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        const sendProgress = (progress: number, step: string) => {
          try {
            const data = JSON.stringify({ progress, step })
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            console.log(`Progress: ${progress}% - ${step}`)
          } catch (error) {
            console.error("Error sending progress:", error)
          }
        }

        const sendError = (error: string) => {
          try {
            const data = JSON.stringify({ error })
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            console.error("Sending error:", error)
          } catch (err) {
            console.error("Error sending error:", err)
          }
        }

        const sendResults = (results: ResumeAnalysis[]) => {
          try {
            const data = JSON.stringify({ results })
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            console.log("Results sent successfully")
          } catch (error) {
            console.error("Error sending results:", error)
          }
        }

        try {
          sendProgress(5, "Starting resume processing...")

          // Step 1: Extract text from files
          const extractedResumes = []
          for (let i = 0; i < files.length; i++) {
            const file = files[i]
            const progressPercent = 5 + (i * 20) / files.length
            sendProgress(progressPercent, `Extracting text from ${file.name}...`)

            try {
              console.log(`Extracting text from: ${file.name}`)
              const extracted = await extractTextFromFile(file)

              // Validate that we actually extracted meaningful content
              const hasRealContent = extracted.text && extracted.text.trim().length > 30
              const hasRealData = extracted.extractedData && (
                extracted.extractedData.email ||
                extracted.extractedData.skills.length > 0 ||
                extracted.extractedData.experienceYears > 0 ||
                extracted.extractedData.education
              )

              if (hasRealContent || hasRealData) {
                extractedResumes.push({
                  file,
                  text: extracted.text,
                  extractedData: extracted.extractedData,
                  metadata: extracted.metadata,
                })
                console.log(`✅ Successfully extracted meaningful content from: ${file.name}`)
                console.log(`📊 Extracted data quality:`, {
                  name: extracted.extractedData.name,
                  email: extracted.extractedData.email || 'Not found',
                  skills: `${extracted.extractedData.skills.length} skills`,
                  experience: `${extracted.extractedData.experienceYears} years`,
                  textLength: `${extracted.text.length} chars`,
                  hasRealData: hasRealData ? 'Yes' : 'No'
                })
              } else {
                console.warn(`⚠️ Extracted content from ${file.name} appears to be insufficient:`)
                console.warn(`- Text length: ${extracted.text.length} characters`)
                console.warn(`- Skills found: ${extracted.extractedData.skills.length}`)
                console.warn(`- Email found: ${!!extracted.extractedData.email}`)
                console.warn(`- Experience: ${extracted.extractedData.experienceYears} years`)
                console.warn(`Skipping this file due to insufficient content extraction.`)
              }
            } catch (error) {
              console.error(`❌ Error extracting ${file.name}:`, error)
              const errorMessage = error instanceof Error ? error.message : String(error)
              console.error(`Error details: ${errorMessage}`)
              // Continue with other files - don't let one bad file stop the whole process
            }
          }

          if (extractedResumes.length === 0) {
            sendError("Failed to extract text from any resume")
            controller.close()
            return
          }

          sendProgress(25, "Text extraction complete. Starting AI analysis...")

          // Step 2: Analyze resumes
          const analyses: ResumeAnalysis[] = []
          for (let i = 0; i < extractedResumes.length; i++) {
            const resume = extractedResumes[i]
            const progressPercent = 25 + (i * 60) / extractedResumes.length
            sendProgress(progressPercent, `AI analyzing ${resume.file.name}...`)

            try {
              console.log(`🤖 Analyzing resume: ${resume.file.name}`)
              console.log(`📝 Resume text preview: ${resume.text.substring(0, 200)}...`)
              console.log(`📊 Available extracted data:`, {
                name: resume.extractedData?.name || 'Not found',
                email: resume.extractedData?.email || 'Not found',
                skills: resume.extractedData?.skills?.length || 0,
                experience: resume.extractedData?.experienceYears || 0
              })

              const analysis = await geminiClient.analyzeResume(resume.text, jobDetails, resume.extractedData)
              analysis.file_name = resume.file.name

              // Validate the analysis contains real data
              const hasRealAnalysis = analysis.skills.length > 0 ||
                                   analysis.experience_years > 0 ||
                                   analysis.email ||
                                   analysis.education

              if (hasRealAnalysis) {
                analyses.push(analysis)
                console.log(`✅ Successfully analyzed: ${resume.file.name}`)
                console.log(`📈 Analysis summary:`, {
                  fitScore: analysis.fit_score || analysis.recommendation_score,
                  skillsFound: analysis.skills.length,
                  experience: analysis.experience_years,
                  hasContact: !!(analysis.email || analysis.phone)
                })
              } else {
                console.warn(`⚠️ Analysis for ${resume.file.name} appears to contain insufficient real data`)
                console.warn(`Creating conservative fallback analysis...`)
                const fallbackAnalysis = geminiClient.createFallbackAnalysis(resume.text, resume.extractedData, jobDetails)
                fallbackAnalysis.file_name = resume.file.name
                analyses.push(fallbackAnalysis)
              }
            } catch (error) {
              console.error(`❌ Error analyzing ${resume.file.name}:`, error)
              if (error instanceof Error) {
                console.error(`Error details: ${error.message}`)
                console.error(`Error stack: ${error.stack}`)
              }

              // Create a fallback analysis even if the main analysis fails
              try {
                console.log(`🔄 Creating fallback analysis for ${resume.file.name}`)
                const fallbackAnalysis = geminiClient.createFallbackAnalysis(resume.text, resume.extractedData, jobDetails)
                fallbackAnalysis.file_name = resume.file.name
                analyses.push(fallbackAnalysis)
                console.log(`✅ Fallback analysis created for ${resume.file.name}`)
              } catch (fallbackError) {
                console.error(`❌ Even fallback analysis failed for ${resume.file.name}:`, fallbackError)
              }
            }
          }

          if (analyses.length === 0) {
            console.log("No analyses completed, creating fallback results...")
            // Create fallback analyses for all resumes
            for (const resume of extractedResumes) {
              try {
                const fallbackAnalysis = geminiClient.createFallbackAnalysis(resume.text, resume.extractedData, jobDetails)
                fallbackAnalysis.file_name = resume.file.name
                analyses.push(fallbackAnalysis)
              } catch (error) {
                console.error(`Error creating fallback for ${resume.file.name}:`, error)
              }
            }

            if (analyses.length === 0) {
              sendError("Failed to analyze any resume")
              controller.close()
              return
            }
          }

          sendProgress(85, "Analysis complete. Ranking candidates...")

          // Step 3: Rank candidates using enhanced ranking system
          const rankedResults = await geminiClient.rankCandidates(analyses, jobDetails)

          sendProgress(100, "Processing complete!")

          // Send final results
          sendResults(rankedResults)
          controller.close()
        } catch (error) {
          console.error("Stream processing error:", error)
          sendError("Processing failed: " + (error instanceof Error ? error.message : "Unknown error"))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    })
  } catch (error) {
    console.error("=== API Route Error ===", error)
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
