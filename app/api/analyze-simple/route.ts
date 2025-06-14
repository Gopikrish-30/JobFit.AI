import type { NextRequest } from "next/server"
import { geminiClient, type ResumeAnalysis } from "@/lib/gemini-client"
import type { ExtractedResumeData } from "@/app/page"

export async function POST(request: NextRequest) {
  console.log("=== Simple AI Analysis API Started ===")

  // Set up overall timeout for the entire analysis
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Analysis timed out after 5 minutes')), 300000) // 5 minute timeout
  })

  try {
    const analysisPromise = (async () => {
      const formData = await request.formData()
      const extractedDataStr = formData.get("extractedData") as string
      const jobDetailsStr = formData.get("jobDetails") as string

      console.log("📥 Form data received:")
      console.log("- extractedData exists:", !!extractedDataStr)
      console.log("- extractedData length:", extractedDataStr?.length || 0)
      console.log("- jobDetails exists:", !!jobDetailsStr)
      console.log("- jobDetails length:", jobDetailsStr?.length || 0)

      if (extractedDataStr) {
        console.log("📄 extractedData preview:", extractedDataStr.substring(0, 200) + "...")
      }
      if (jobDetailsStr) {
        console.log("🎯 jobDetails preview:", jobDetailsStr.substring(0, 200) + "...")
      }

      if (!extractedDataStr) {
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

      console.log(`🤖 Analyzing ${extractedData.length} extracted resumes`)

    // Analyze each extracted resume
    const analyses: ResumeAnalysis[] = []
    for (let i = 0; i < extractedData.length; i++) {
      const resumeData = extractedData[i]
      console.log(`🧠 [${i + 1}/${extractedData.length}] Analyzing extracted data for: ${resumeData.fileName}`)
      console.log(`📊 Resume data preview:`, {
        textLength: resumeData.extractedText?.length || 0,
        skillsCount: resumeData.structuredData?.skills?.length || 0,
        hasEmail: !!resumeData.structuredData?.email,
        hasName: !!resumeData.structuredData?.name
      })

      try {
        console.log(`🔄 Starting Gemini analysis for ${resumeData.fileName}...`)

        // Use the extracted text and structured data for analysis
        const analysis = await geminiClient.analyzeResume(
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

        console.log(`✅ Gemini analysis completed for ${resumeData.fileName}`)
        console.log(`📈 Analysis result:`, {
          candidate_name: analysis.candidate_name,
          fit_score: analysis.fit_score || analysis.recommendation_score,
          skills_count: analysis.skills?.length || 0
        })

        analysis.file_name = resumeData.fileName
        analyses.push(analysis)
        console.log(`✅ Successfully analyzed: ${resumeData.fileName}`)
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
      console.error("❌ No analyses completed successfully")
      return new Response(JSON.stringify({ error: "Failed to analyze any resume" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    console.log(`✅ Individual analysis complete. ${analyses.length} resumes analyzed successfully.`)
    console.log("🏆 Starting candidate ranking...")

    // Rank candidates using enhanced ranking system
    const rankedResults = await geminiClient.rankCandidates(analyses, jobDetails)

    console.log("✅ Ranking complete!")
    console.log(`📊 Final results: ${rankedResults.length} candidates ranked`)
    console.log("✅ Analysis complete, returning results")

      return new Response(JSON.stringify({ results: rankedResults }), {
        headers: { "Content-Type": "application/json" },
      })
    })()

    // Race between analysis and timeout
    return await Promise.race([analysisPromise, timeoutPromise])

  } catch (error) {
    console.error("=== Simple AI Analysis API Error ===", error)
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
