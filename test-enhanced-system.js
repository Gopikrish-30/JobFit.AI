// Test script for the enhanced RAG-based resume analysis system
const { extractTextFromFile } = require('./lib/pdf-extractor.ts')
const { geminiClient } = require('./lib/gemini-client.ts')

async function testEnhancedSystem() {
  console.log("🚀 Testing Enhanced RAG-based Resume Analysis System")
  console.log("=" .repeat(60))
  
  try {
    // Create a mock file for testing
    const mockResumeContent = `
John Doe
Email: john.doe@email.com
Phone: (555) 123-4567
Location: San Francisco, CA
LinkedIn: linkedin.com/in/johndoe

PROFESSIONAL SUMMARY
Experienced software engineer with 5+ years of experience in full-stack development. 
Proven track record of delivering high-quality applications and leading development teams.

TECHNICAL SKILLS
• Programming Languages: JavaScript, Python, TypeScript, Java
• Frameworks & Technologies: React, Node.js, Django, Express
• Databases: PostgreSQL, MongoDB, MySQL, Redis
• Cloud & DevOps: AWS, Docker, Git, CI/CD, Kubernetes
• Soft Skills: Leadership, Communication, Problem Solving, Team Collaboration

PROFESSIONAL EXPERIENCE

Senior Software Engineer | Tech Solutions Inc. | 2020 - Present
• Led development of scalable web applications serving 100K+ users
• Implemented microservices architecture reducing system latency by 40%
• Mentored junior developers and conducted code reviews
• Collaborated with cross-functional teams to deliver projects on time

Software Engineer | Digital Innovations LLC | 2018 - 2020
• Developed and maintained multiple client-facing applications
• Optimized database queries improving application performance by 30%
• Participated in agile development processes and sprint planning
• Contributed to technical documentation and best practices

EDUCATION
Bachelor of Science in Computer Science
University of Technology | 2014 - 2018
GPA: 3.7/4.0

CERTIFICATIONS
• AWS Certified Developer Associate
• Scrum Master Certification
• JavaScript Professional Certification

PROJECTS
E-commerce Platform: Built a full-stack e-commerce solution using React and Node.js
Task Management App: Developed a collaborative task management application
API Gateway: Designed and implemented RESTful APIs for multiple client applications
`

    const mockFile = {
      name: 'john_doe_resume.txt',
      type: 'text/plain',
      size: mockResumeContent.length,
      text: () => Promise.resolve(mockResumeContent)
    }

    console.log("📄 Step 1: Testing Enhanced PDF Extraction with RAG")
    console.log("-".repeat(50))
    
    // Test the enhanced extraction
    const extractedResume = await extractTextFromFile(mockFile)
    
    console.log("✅ Extraction Results:")
    console.log(`   📝 Text Length: ${extractedResume.text.length} characters`)
    console.log(`   🧩 Document Chunks: ${extractedResume.chunks.length}`)
    console.log(`   👤 Candidate Name: ${extractedResume.extractedData.name}`)
    console.log(`   📧 Email: ${extractedResume.extractedData.email}`)
    console.log(`   📱 Phone: ${extractedResume.extractedData.phone}`)
    console.log(`   🛠️  Skills: ${extractedResume.extractedData.skills.slice(0, 5).join(', ')}...`)
    console.log(`   💻 Programming Languages: ${extractedResume.extractedData.programmingLanguages.join(', ')}`)
    console.log(`   🔧 Frameworks: ${extractedResume.extractedData.frameworks.join(', ')}`)
    console.log(`   💼 Experience Years: ${extractedResume.extractedData.experienceYears}`)
    console.log(`   🏢 Work History: ${extractedResume.extractedData.workHistory.length} positions`)
    console.log(`   ⏱️  Processing Time: ${extractedResume.metadata.processingTime}ms`)
    
    console.log("\n🤖 Step 2: Testing Enhanced AI Analysis")
    console.log("-".repeat(50))
    
    // Test job requirements
    const jobDetails = {
      jobTitle: "Senior Full Stack Developer",
      requiredSkills: ["JavaScript", "React", "Node.js", "Python", "AWS"],
      preferredSkills: ["TypeScript", "Docker", "Kubernetes", "Leadership"],
      experienceLevel: "Senior Level (5+ years)",
      educationRequirement: "Bachelor's degree in Computer Science or related field",
      jobDescription: "We are looking for a senior full stack developer to lead our development team and build scalable web applications.",
      keyResponsibilities: "Lead development team, architect solutions, mentor junior developers, ensure code quality"
    }
    
    console.log("📋 Job Requirements:")
    console.log(`   🎯 Title: ${jobDetails.jobTitle}`)
    console.log(`   ✅ Required Skills: ${jobDetails.requiredSkills.join(', ')}`)
    console.log(`   ⭐ Preferred Skills: ${jobDetails.preferredSkills.join(', ')}`)
    console.log(`   📈 Experience Level: ${jobDetails.experienceLevel}`)
    
    // Test the enhanced analysis
    const analysis = await geminiClient.analyzeResume(
      extractedResume.text, 
      jobDetails, 
      extractedResume.extractedData
    )
    
    console.log("\n✅ Analysis Results:")
    console.log(`   👤 Candidate: ${analysis.candidate_name}`)
    console.log(`   ⭐ Fit Score: ${analysis.fit_score || analysis.recommendation_score}/100`)
    console.log(`   🎯 Skills Match: ${analysis.skills_match_percentage}%`)
    console.log(`   💼 Experience Score: ${analysis.experience_relevance_score}/100`)
    console.log(`   🎓 Education Score: ${analysis.education_score}/100`)
    console.log(`   📄 Resume Quality: ${analysis.resume_quality_score}/100`)
    console.log(`   ✅ Matched Required Skills: ${analysis.matched_required_skills?.join(', ') || 'None'}`)
    console.log(`   ⭐ Matched Preferred Skills: ${analysis.matched_preferred_skills?.join(', ') || 'None'}`)
    console.log(`   ❌ Missing Required Skills: ${analysis.missing_required_skills?.join(', ') || 'None'}`)
    
    console.log("\n📝 Detailed Feedback:")
    console.log(`   ${analysis.feedback}`)
    
    console.log("\n✅ Positive Points:")
    analysis.positive_points.forEach((point, index) => {
      console.log(`   ${index + 1}. ${point}`)
    })
    
    if (analysis.negative_points && analysis.negative_points.length > 0) {
      console.log("\n❌ Areas for Improvement:")
      analysis.negative_points.forEach((point, index) => {
        console.log(`   ${index + 1}. ${point}`)
      })
    }
    
    console.log("\n📊 Overall Assessment:")
    console.log(`   ${analysis.overall_explanation}`)
    
    console.log("\n🎉 Enhanced RAG-based Resume Analysis System Test Completed Successfully!")
    console.log("=" .repeat(60))
    
    return {
      extractedResume,
      analysis,
      success: true
    }
    
  } catch (error) {
    console.error("❌ Test Failed:", error)
    console.error("Error details:", error.message)
    if (error.stack) {
      console.error("Stack trace:", error.stack)
    }
    return {
      success: false,
      error: error.message
    }
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testEnhancedSystem()
    .then(result => {
      if (result.success) {
        console.log("\n🎯 Test Summary: All systems working correctly!")
        process.exit(0)
      } else {
        console.log("\n💥 Test Summary: System needs attention")
        process.exit(1)
      }
    })
    .catch(error => {
      console.error("💥 Unexpected test error:", error)
      process.exit(1)
    })
}

module.exports = { testEnhancedSystem }
