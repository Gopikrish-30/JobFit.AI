import { NextRequest, NextResponse } from "next/server"
import { geminiClient } from "@/lib/gemini-client"

export async function GET(request: NextRequest) {
  console.log("=== Test Analysis API Started ===")

  try {
    // Create test data
    const testResumeText = `
John Doe
Email: john.doe@email.com
Phone: +1-555-123-4567

SKILLS:
- Python
- JavaScript
- React
- Node.js
- SQL
- Machine Learning

EXPERIENCE:
Software Engineer at TechCorp (2020-2023)
- Developed web applications using React and Node.js
- Worked with Python for data analysis
- Built REST APIs

EDUCATION:
Bachelor of Science in Computer Science
University of Technology (2016-2020)
`

    const testJobDetails = {
      jobTitle: "Frontend Developer",
      requiredSkills: ["JavaScript", "React", "HTML", "CSS"],
      preferredSkills: ["Node.js", "Python"],
      experienceLevel: "Mid Level",
      jobDescription: "Frontend developer role"
    }

    const testExtractedData = {
      name: "John Doe",
      email: "john.doe@email.com",
      phone: "+1-555-123-4567",
      skills: ["Python", "JavaScript", "React", "Node.js", "SQL", "Machine Learning"],
      fileName: "john_doe_resume.pdf"
    }

    console.log("🧪 Starting test analysis...")
    
    const analysis = await geminiClient.analyzeResume(
      testResumeText,
      testJobDetails,
      testExtractedData
    )

    console.log("✅ Test analysis completed successfully!")
    
    return NextResponse.json({
      success: true,
      analysis: {
        candidate_name: analysis.candidate_name,
        skills: analysis.skills,
        fit_score: analysis.fit_score || analysis.recommendation_score,
        matched_required_skills: analysis.matched_required_skills,
        feedback: analysis.feedback
      }
    })

  } catch (error) {
    console.error("❌ Test analysis failed:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
