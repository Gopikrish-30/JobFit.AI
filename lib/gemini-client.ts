interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string
      }>
    }
  }>
}

export interface ResumeAnalysis {
  candidate_name: string
  email: string
  phone: string
  location?: string
  linkedin?: string
  skills: string[]
  soft_skills: string[]
  programming_languages?: string[]
  frameworks?: string[]
  tools?: string[]
  databases?: string[]
  experience_years: number
  current_role?: string
  previous_companies?: string[]
  education: string
  certifications?: string[]
  key_achievements?: string[]
  matched_required_skills?: string[]
  matched_preferred_skills?: string[]
  missing_required_skills?: string[]
  recruiter_score: number
  analyst_score: number
  hr_score: number
  recommendation_score: number
  fit_score?: number
  skills_match_percentage?: number
  experience_relevance_score?: number
  education_score?: number
  resume_quality_score?: number
  feedback: string
  positive_points: string[]
  negative_points: string[]
  overall_explanation: string
  rank_justification?: string
  match_percentage?: number
  salary_expectation?: string
  availability?: string
  file_name?: string
}

class GeminiClient {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = "AIzaSyCgaFzMltN282Qq0PF0oG6eGzayQciLWNs"
    this.baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent"
  }

  async generateContent(prompt: string): Promise<string> {
    try {
      console.log("Making Gemini API request...")
      console.log("API URL:", `${this.baseUrl}?key=${this.apiKey.substring(0, 10)}...`)
      console.log("Prompt length:", prompt.length)

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      }

      console.log("Request body:", JSON.stringify(requestBody, null, 2))

      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

      let response: Response
      try {
        response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
      } catch (error: any) {
        clearTimeout(timeoutId)
        if (error.name === 'AbortError') {
          throw new Error('Gemini API request timed out after 60 seconds')
        }
        throw error
      }

      console.log("Gemini API response status:", response.status)
      console.log("Response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Gemini API error: ${response.status} - ${errorText}`)
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
      }

      const data: GeminiResponse = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ""

      if (!text) {
        throw new Error("No response from Gemini API")
      }

      console.log("Gemini API response received successfully")
      return text
    } catch (error) {
      console.error("Gemini API error:", error)
      throw error
    }
  }

  async analyzeResume(resumeText: string, jobDetails: any, extractedData?: any): Promise<ResumeAnalysis> {
    try {
      console.log("🤖 Starting enhanced resume analysis with RAG data...")
      console.log("📝 Resume text length:", resumeText.length)
      console.log("📋 Job details:", JSON.stringify(jobDetails, null, 2))

      if (extractedData) {
        console.log("📊 Using RAG-extracted structured data:", {
          name: extractedData.name,
          email: extractedData.email,
          skills: extractedData.skills?.slice(0, 10) || [],
          skillsTotal: extractedData.skills?.length || 0,
          experienceYears: extractedData.experienceYears,
          workHistory: extractedData.workHistory?.length || 0,
          education: extractedData.education || 'Not found'
        })

        // Log a preview of the actual skills found
        if (extractedData.skills && extractedData.skills.length > 0) {
          console.log("🛠️ All extracted skills:", extractedData.skills.join(', '))
        } else {
          console.log("⚠️ No skills found in extracted data")
        }
      } else {
        console.log("⚠️ No extracted data available, analyzing raw text only")
      }

      // Log a preview of the resume text to see what we're working with
      console.log("📄 Resume text preview (first 500 chars):", resumeText.substring(0, 500))

      const prompt = this.getEnhancedResumeAnalysisPrompt(resumeText, jobDetails, extractedData)
      console.log("📝 Generated enhanced prompt length:", prompt.length)

      // Add timeout wrapper for the entire analysis
      const analysisPromise = this.generateContent(prompt)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Resume analysis timed out after 90 seconds')), 90000)
      })

      const response = await Promise.race([analysisPromise, timeoutPromise])
      console.log("📨 Received Gemini response length:", response.length)
      console.log("📄 Gemini response preview:", response.substring(0, 500))

      const analysis = this.parseResumeAnalysis(response, extractedData)
      console.log("✅ Enhanced resume analysis completed successfully")
      console.log("📈 Analysis summary:", {
        candidateName: analysis.candidate_name,
        skillsFound: analysis.skills.length,
        fitScore: analysis.fit_score || analysis.recommendation_score,
        experienceYears: analysis.experience_years
      })
      return analysis
    } catch (error) {
      console.error("❌ Enhanced resume analysis error:", error)
      if (error instanceof Error) {
        console.error("Error message:", error.message)
        console.error("Error stack:", error.stack)
      }
      console.log("🔄 Using enhanced fallback analysis...")
      return this.createEnhancedFallbackAnalysis(resumeText, extractedData, jobDetails)
    }
  }

  private getEnhancedResumeAnalysisPrompt(resumeText: string, jobDetails: any, extractedData?: any): string {
    return `
You are an expert AI Resume Evaluator with access to structured resume data extracted using RAG (Retrieval-Augmented Generation).
Analyze the candidate comprehensively using both the raw resume text and the pre-extracted structured data.

📋 JOB REQUIREMENTS ANALYSIS:
Job Title: ${jobDetails.jobTitle || "Software Engineer"}
Required Skills: ${jobDetails.requiredSkills?.join(", ") || "Programming, Problem Solving"}
Preferred Skills: ${jobDetails.preferredSkills?.join(", ") || "Leadership, Communication"}
Experience Level: ${jobDetails.experienceLevel || "Mid Level"}
Education Requirements: ${jobDetails.educationRequirement || "Bachelor's degree preferred"}
Job Description: ${jobDetails.jobDescription || "Software development role"}
Key Responsibilities: ${jobDetails.keyResponsibilities || "Development and maintenance of software applications"}

📊 STRUCTURED CANDIDATE DATA (Pre-extracted with RAG):
${extractedData ? `
✅ CONTACT INFORMATION:
- Name: ${extractedData.name}
- Email: ${extractedData.email}
- Phone: ${extractedData.phone}
- Location: ${extractedData.location || "Not specified"}
- LinkedIn: ${extractedData.linkedin || "Not provided"}

🛠️ TECHNICAL SKILLS BREAKDOWN:
- All Skills: ${extractedData.skills?.join(", ") || "None extracted"}
- Programming Languages: ${extractedData.programmingLanguages?.join(", ") || "None"}
- Frameworks: ${extractedData.frameworks?.join(", ") || "None"}
- Tools & Technologies: ${extractedData.tools?.join(", ") || "None"}
- Databases: ${extractedData.databases?.join(", ") || "None"}

💼 PROFESSIONAL EXPERIENCE:
- Total Experience: ${extractedData.experienceYears || 0} years
- Current Role: ${extractedData.currentRole || "Not specified"}
- Previous Companies: ${extractedData.previousCompanies?.join(", ") || "None listed"}

📚 EDUCATION & CERTIFICATIONS:
- Education: ${extractedData.education || "Not specified"}
- Certifications: ${extractedData.certifications?.join(", ") || "None listed"}

🏆 KEY ACHIEVEMENTS:
${extractedData.keyAchievements?.map((achievement: string) => '- ' + achievement).join('\n') || "- None extracted"}

💼 DETAILED WORK HISTORY:
${extractedData.workHistory?.map((work: { company: string; role: string; duration: string; responsibilities: string[] }) =>
  'Company: ' + work.company + '\nRole: ' + work.role + '\nDuration: ' + work.duration + '\nKey Responsibilities:\n' + work.responsibilities.map((resp: string) => '  • ' + resp).join('\n')
).join('\n\n') || "No detailed work history available"}

📄 PROFESSIONAL SUMMARY:
${extractedData.summary || "No summary available"}
` : 'No structured data available - analyzing raw text only'}

📄 FULL RESUME TEXT:
${resumeText}

📁 FILENAME: ${extractedData?.fileName || 'resume.pdf'}

🎯 COMPREHENSIVE ANALYSIS TASK:

1. **SKILL MATCHING ANALYSIS (60% Weight):**
   - Compare candidate's technical skills with required skills
   - Identify exact matches, partial matches, and missing skills
   - Evaluate skill depth based on work experience context
   - Calculate skills match percentage: (matched required skills / total required skills) × 100

2. **EXPERIENCE RELEVANCE ASSESSMENT (25% Weight):**
   - Analyze work history relevance to target role
   - Evaluate progression and career growth
   - Assess leadership and project management experience
   - Consider industry experience and company types

3. **EDUCATION & CERTIFICATION EVALUATION (10% Weight):**
   - Match education level with job requirements
   - Evaluate field of study relevance
   - Assess professional certifications value
   - Consider continuous learning indicators

4. **RESUME QUALITY & PROFESSIONALISM (5% Weight):**
   - Evaluate resume structure and clarity
   - Assess communication skills through writing
   - Check for completeness of information
   - Consider professional presentation

🔢 SCORING METHODOLOGY:
- Skills Match Score = (Exact Required Skills Matches / Total Required Skills) × 60
- Experience Score = (Relevance × Years × Seniority Level) × 25
- Education Score = (Degree Match × Field Relevance × Certifications) × 10
- Quality Score = (Structure × Clarity × Completeness) × 5
- TOTAL FIT SCORE = Sum of all weighted scores (0-100)

CRITICAL SKILL MATCHING INSTRUCTIONS:
1. Compare the candidate's extracted skills with the job requirements:
   - Required Skills: ${jobDetails.requiredSkills?.join(", ") || "Not specified"}
   - Preferred Skills: ${jobDetails.preferredSkills?.join(", ") || "Not specified"}

2. For "matched_required_skills": ONLY include skills that appear in BOTH the resume AND the required skills list
3. For "matched_preferred_skills": ONLY include skills that appear in BOTH the resume AND the preferred skills list
4. For "missing_required_skills": List required skills that are NOT found in the resume
5. Calculate "skills_match_percentage" as: (matched required skills / total required skills) × 100

Return ONLY a valid JSON object with this EXACT structure:
{
  "candidate_name": "Use the filename without extension as the candidate name",
  "email": "Extract email from resume or empty string if not found",
  "phone": "Extract phone from resume or empty string if not found",
  "location": "Extract location if available",
  "linkedin": "Extract LinkedIn if available",
  "skills": ["ONLY skills explicitly mentioned in this resume - if none found, use empty array []"],
  "soft_skills": ["ONLY soft skills mentioned in this resume - if none found, use empty array []"],
  "programming_languages": ["ONLY programming languages mentioned in this resume"],
  "frameworks": ["ONLY frameworks and libraries mentioned in this resume"],
  "tools": ["ONLY tools and technologies mentioned in this resume"],
  "databases": ["ONLY databases mentioned in this resume"],
  "experience_years": "Extract actual years from resume or 0 if not found",
  "current_role": "Extract current role from resume or empty string",
  "previous_companies": ["List previous companies or empty array if none found"],
  "education": "Extract education from resume or empty string if not found",
  "certifications": ["List certifications or empty array if none found"],
  "key_achievements": ["List key achievements or empty array if none found"],
  "matched_required_skills": ["ONLY skills that match required skills - be precise"],
  "matched_preferred_skills": ["ONLY skills that match preferred skills - be precise"],
  "missing_required_skills": ["Required skills NOT found in resume"],
  "recruiter_score": "Score based on actual data quality (20-95)",
  "analyst_score": "Score based on actual skills match (20-95)",
  "hr_score": "Score based on actual experience relevance (20-95)",
  "recommendation_score": "Overall score based on actual fit (20-95)",
  "fit_score": "Calculated fit score based on real data (20-95)",
  "skills_match_percentage": "Precise percentage of required skills matched",
  "experience_relevance_score": "Score based on actual experience relevance",
  "education_score": "Score based on actual education match",
  "resume_quality_score": "Score based on actual resume completeness",
  "feedback": "Honest feedback based on actual extracted data - mention specific skills found/missing",
  "positive_points": ["Specific strengths based on actual resume content"],
  "negative_points": ["Specific gaps based on actual missing elements - be honest about what's missing"],
  "overall_explanation": "Honest assessment based on actual extracted data - do not make assumptions",
  "rank_justification": "Justification based on actual skill matches and experience found"
}

⚠️ CRITICAL REQUIREMENTS - EXTRACT ONLY REAL DATA:
- Use ONLY the structured data provided when available
- Extract ONLY skills, experience, and information explicitly mentioned in the resume text
- DO NOT add placeholder skills, sample data, or generic information
- DO NOT fabricate or assume any information not present in the resume
- If information is not available, leave fields empty or use empty arrays
- Calculate precise skill match percentages based on actual extracted skills only
- Provide specific, actionable feedback based on real resume content
- Be accurate with missing skills identification
- Use professional, concise language
- Ensure all scores are realistic and justified based on actual resume content
- If the resume has limited extractable content, reflect this in lower scores`
  }

  private getResumeAnalysisPrompt(resumeText: string, jobDetails: any, extractedData?: any): string {
    return `
You are an expert AI Resume Evaluator that analyzes resumes in detail and compares them with job descriptions to rank candidates accurately.

📋 JOB DESCRIPTION ANALYSIS:
Job Title: ${jobDetails.jobTitle || "Software Engineer"}
Required Skills: ${jobDetails.requiredSkills?.join(", ") || "Programming, Problem Solving"}
Preferred Skills: ${jobDetails.preferredSkills?.join(", ") || "Leadership, Communication"}
Experience Level: ${jobDetails.experienceLevel || "Mid Level"}
Education Requirements: ${jobDetails.educationRequirement || "Bachelor's degree preferred"}
Job Description: ${jobDetails.jobDescription || "Software development role"}
Key Responsibilities: ${jobDetails.keyResponsibilities || "Development and maintenance of software applications"}

📄 RESUME TO ANALYZE:
${resumeText}

📁 FILENAME: ${extractedData?.fileName || 'resume.pdf'}

${extractedData ? `
📊 PRE-EXTRACTED DATA (Use this as a starting point):
Name: ${extractedData.name}
Email: ${extractedData.email}
Phone: ${extractedData.phone}
Skills: ${extractedData.skills?.join(", ") || "None extracted"}
Experience: ${extractedData.experience}
Education: ${extractedData.education}
Summary: ${extractedData.summary}
` : ''}

🎯 YOUR TASK:
1. **EXTRACT KEYWORDS FROM JOB DESCRIPTION:**
   - Required Skills (CRITICAL for scoring)
   - Preferred Skills (BONUS points)
   - Job Role requirements
   - Minimum Experience Level
   - Education/Qualifications

2. **ANALYZE RESUME THOROUGHLY:**
   - Extract ALL skills (technical & soft)
   - Calculate total work experience in years
   - Identify education & certifications
   - Find relevant projects & achievements
   - Extract contact information

3. **DETAILED MATCHING & SCORING:**
   - Match candidate skills with Required Skills (60% weight)
   - Assess experience relevance to job role (25% weight)
   - Evaluate education/certifications (10% weight)
   - Consider resume language & professionalism (5% weight)

4. **CALCULATE FIT SCORE (0-100):**
   - Skills Match: Count exact matches with required skills
   - Experience Relevance: How well experience aligns with job role
   - Education Match: Degree level and field relevance
   - Resume Quality: Professional presentation and clarity

Return ONLY a valid JSON object with this EXACT structure:
{
  "candidate_name": "Use the filename without extension as the candidate name",
  "email": "email@domain.com",
  "phone": "phone number",
  "location": "city, state/country",
  "skills": ["skill1", "skill2", "skill3"],
  "soft_skills": ["communication", "leadership", "teamwork"],
  "programming_languages": ["Python", "JavaScript"],
  "frameworks": ["React", "Django"],
  "tools": ["Git", "Docker", "AWS"],
  "databases": ["PostgreSQL", "MongoDB"],
  "experience_years": 5,
  "current_role": "Current job title",
  "previous_companies": ["Company1", "Company2"],
  "education": "Degree and institution",
  "certifications": ["AWS Certified", "Scrum Master"],
  "key_achievements": ["Achievement 1", "Achievement 2"],
  "matched_required_skills": ["Python", "SQL"],
  "matched_preferred_skills": ["Leadership"],
  "missing_required_skills": ["Apache Spark"],
  "recruiter_score": 85,
  "analyst_score": 80,
  "hr_score": 75,
  "recommendation_score": 82,
  "fit_score": 85,
  "skills_match_percentage": 80,
  "experience_relevance_score": 90,
  "education_score": 75,
  "resume_quality_score": 85,
  "feedback": "📄 Resume: [Candidate Name] ✅ Fit Score: 85/100 🔍 Matched Skills: Python, SQL ❌ Missing Required Skills: Apache Spark 🧠 Experience: 5 years as Software Engineer 🎓 Education: B.Tech Computer Science ⭐ Overall: Strong candidate with excellent technical skills",
  "positive_points": ["Strong technical background in required technologies", "Relevant work experience", "Good educational background"],
  "negative_points": ["Missing some required skills", "Limited experience in specific domain"],
  "overall_explanation": "Candidate shows strong potential with good skill match and relevant experience. Recommended for interview with focus on missing skills assessment.",
  "rank_justification": "High fit score due to strong technical skills match and relevant experience level"
}

🔍 SCORING BREAKDOWN:
- **Skills Match (60%)**: Exact matches with required skills / total required skills
- **Experience Relevance (25%)**: Years of experience + role relevance to job
- **Education/Certifications (10%)**: Degree level + field relevance + certifications
- **Resume Quality (5%)**: Professional presentation, clarity, completeness

⚠️ CRITICAL REQUIREMENTS - REAL DATA EXTRACTION ONLY:
- Extract REAL information only - absolutely NO fabrication, placeholder skills, or sample data
- Only include skills, experience, and information explicitly mentioned in the resume text
- If a skill is not mentioned in the resume, DO NOT include it in any skills arrays
- Calculate accurate experience years ONLY from work history mentioned in the resume
- If no experience is mentioned, set experience_years to 0
- Identify exact skill matches (case-insensitive) with job requirements
- Provide specific, actionable feedback based on actual resume content
- Use the emoji format in feedback for visual appeal
- Be precise with missing skills identification
- Do NOT add generic skills like "C#, Go, Git, Python, JavaScript" unless they explicitly appear in the resume text
- If the resume has very limited content, reflect this with lower scores and honest assessment
- Empty arrays are better than fake data - use [] for skills if none are found`
  }

  private parseResumeAnalysis(response: string, extractedData?: any): ResumeAnalysis {
    try {
      console.log("Parsing Gemini response...")

      // Clean the response
      let cleanResponse = response.trim()
      cleanResponse = cleanResponse.replace(/```json\s*/g, "").replace(/```\s*/g, "")

      // Find JSON object
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("No JSON found in response")
      }

      const parsed = JSON.parse(jsonMatch[0])

      // Always prioritize filename over extracted name to avoid PDF artifacts
      const cleanFileName = extractedData?.fileName ?
        extractedData.fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ") : null

      console.log(`🔍 Gemini Analysis - Original filename: ${extractedData?.fileName}`)
      console.log(`✨ Gemini Analysis - Cleaned filename: ${cleanFileName}`)
      console.log(`📝 Gemini Analysis - Parsed name: ${parsed.candidate_name}`)
      console.log(`👤 Gemini Analysis - Extracted name: ${extractedData?.name}`)

      const analysis: ResumeAnalysis = {
        candidate_name: String(cleanFileName || parsed.candidate_name || extractedData?.name || "Unknown Candidate"),
        email: String(parsed.email || extractedData?.email || ""),
        phone: String(parsed.phone || extractedData?.phone || ""),
        location: parsed.location ? String(parsed.location) : undefined,
        linkedin: parsed.linkedin ? String(parsed.linkedin) : undefined,
        skills: Array.isArray(parsed.skills) ? parsed.skills.slice(0, 15) : (extractedData?.skills || []),
        soft_skills: Array.isArray(parsed.soft_skills) ? parsed.soft_skills.slice(0, 8) : [],
        programming_languages: Array.isArray(parsed.programming_languages) ? parsed.programming_languages.slice(0, 10) : undefined,
        frameworks: Array.isArray(parsed.frameworks) ? parsed.frameworks.slice(0, 10) : undefined,
        tools: Array.isArray(parsed.tools) ? parsed.tools.slice(0, 10) : undefined,
        databases: Array.isArray(parsed.databases) ? parsed.databases.slice(0, 8) : undefined,
        experience_years: Math.max(0, Math.min(50, Number(parsed.experience_years) || 0)),
        current_role: parsed.current_role ? String(parsed.current_role) : undefined,
        previous_companies: Array.isArray(parsed.previous_companies) ? parsed.previous_companies.slice(0, 5) : undefined,
        education: String(parsed.education || ""),
        certifications: Array.isArray(parsed.certifications) ? parsed.certifications.slice(0, 8) : undefined,
        key_achievements: Array.isArray(parsed.key_achievements) ? parsed.key_achievements.slice(0, 5) : undefined,
        matched_required_skills: Array.isArray(parsed.matched_required_skills) ? parsed.matched_required_skills.slice(0, 10) : undefined,
        matched_preferred_skills: Array.isArray(parsed.matched_preferred_skills) ? parsed.matched_preferred_skills.slice(0, 10) : undefined,
        missing_required_skills: Array.isArray(parsed.missing_required_skills) ? parsed.missing_required_skills.slice(0, 10) : undefined,
        recruiter_score: Math.max(0, Math.min(100, Number(parsed.recruiter_score) || 70)),
        analyst_score: Math.max(0, Math.min(100, Number(parsed.analyst_score) || 70)),
        hr_score: Math.max(0, Math.min(100, Number(parsed.hr_score) || 70)),
        recommendation_score: Math.max(0, Math.min(100, Number(parsed.recommendation_score) || 70)),
        fit_score: parsed.fit_score ? Math.max(0, Math.min(100, Number(parsed.fit_score))) : undefined,
        skills_match_percentage: parsed.skills_match_percentage ? Math.max(0, Math.min(100, Number(parsed.skills_match_percentage))) : undefined,
        experience_relevance_score: parsed.experience_relevance_score ? Math.max(0, Math.min(100, Number(parsed.experience_relevance_score))) : undefined,
        education_score: parsed.education_score ? Math.max(0, Math.min(100, Number(parsed.education_score))) : undefined,
        resume_quality_score: parsed.resume_quality_score ? Math.max(0, Math.min(100, Number(parsed.resume_quality_score))) : undefined,
        feedback: String(parsed.feedback || "Analysis completed"),
        positive_points: Array.isArray(parsed.positive_points) ? parsed.positive_points.slice(0, 8) : [],
        negative_points: Array.isArray(parsed.negative_points) ? parsed.negative_points.slice(0, 5) : [],
        overall_explanation: String(parsed.overall_explanation || ""),
        rank_justification: parsed.rank_justification ? String(parsed.rank_justification) : undefined,
        match_percentage: parsed.match_percentage ? Math.max(0, Math.min(100, Number(parsed.match_percentage))) : undefined,
        salary_expectation: parsed.salary_expectation ? String(parsed.salary_expectation) : undefined,
        availability: parsed.availability ? String(parsed.availability) : undefined,
      }

      console.log("Successfully parsed resume analysis")
      return analysis
    } catch (error) {
      console.error("Error parsing Gemini response:", error)
      throw error
    }
  }

  createEnhancedFallbackAnalysis(resumeText: string, extractedData?: any, jobDetails?: any): ResumeAnalysis {
    console.log("🔄 Creating enhanced fallback analysis with REAL extracted data only...")

    // Always prioritize filename over extracted name to avoid PDF artifacts
    const cleanFileName = extractedData?.fileName ?
      extractedData.fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ") : null

    console.log(`🔍 Fallback Analysis - Original filename: ${extractedData?.fileName}`)
    console.log(`✨ Fallback Analysis - Cleaned filename: ${cleanFileName}`)
    console.log(`👤 Fallback Analysis - Extracted name: ${extractedData?.name}`)

    const candidateName = cleanFileName || extractedData?.name || "Unknown Candidate"

    // Extract contact info from resume text if not in extracted data
    const emailFromText = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || ""
    const phoneFromText = resumeText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)?.[0] || ""

    const email = extractedData?.email || emailFromText
    const phone = extractedData?.phone || phoneFromText

    // CRITICAL: If extracted data has no skills, try to extract directly from text
    let skills = extractedData?.skills || []
    if (skills.length === 0 && resumeText) {
      console.log("🔍 No skills in extracted data, attempting direct text extraction...")
      skills = this.extractSkillsFromText(resumeText)
      console.log(`📋 Direct extraction found ${skills.length} skills: ${skills.slice(0, 5).join(', ')}`)
    }

    // Also try to extract other data directly if missing
    let experienceYears = extractedData?.experienceYears || 0
    if (experienceYears === 0 && resumeText) {
      experienceYears = this.extractExperienceFromText(resumeText)
    }

    let education = extractedData?.education || ""
    if (!education && resumeText) {
      education = this.extractEducationFromText(resumeText)
    }

    const programmingLanguages = extractedData?.programmingLanguages || this.categorizeSkills(skills, 'programming')
    const frameworks = extractedData?.frameworks || this.categorizeSkills(skills, 'frameworks')
    const tools = extractedData?.tools || this.categorizeSkills(skills, 'tools')
    const databases = extractedData?.databases || this.categorizeSkills(skills, 'databases')

    const currentRole = extractedData?.currentRole || ""
    const previousCompanies = extractedData?.previousCompanies || []
    const certifications = extractedData?.certifications || []
    const keyAchievements = extractedData?.keyAchievements || []

    // Calculate realistic scores based on ACTUAL extracted data
    const hasContactInfo = !!(email || phone)
    const hasSkills = skills.length > 0
    const hasExperience = experienceYears > 0
    const hasEducation = !!education

    console.log(`📊 Fallback data quality check:`, {
      hasContactInfo,
      hasSkills,
      skillsCount: skills.length,
      hasExperience,
      experienceYears,
      hasEducation,
      education: education.substring(0, 50)
    })

    // More conservative scoring - only give high scores if we have real data
    const skillsScore = hasSkills ? Math.min(85, 40 + (skills.length * 3)) : 20
    const experienceScore = hasExperience ? Math.min(85, 40 + (experienceYears * 2)) : 20
    const educationScore = hasEducation ?
      (education.toLowerCase().includes('master') ? 80 :
       education.toLowerCase().includes('bachelor') ? 70 : 60) : 30
    const qualityScore = hasContactInfo ? 75 : 40

    const baseScore = Math.round((skillsScore + experienceScore + educationScore + qualityScore) / 4)

    // Perform skill matching with job requirements if available
    let matchedRequiredSkills: string[] = []
    let matchedPreferredSkills: string[] = []
    let missingRequiredSkills: string[] = []
    let skillsMatchPercentage = 0

    if (jobDetails && jobDetails.requiredSkills && Array.isArray(jobDetails.requiredSkills)) {
      const requiredSkills = jobDetails.requiredSkills.map((skill: string) => skill.toLowerCase())
      const candidateSkills = skills.map((skill: string) => skill.toLowerCase())

      matchedRequiredSkills = jobDetails.requiredSkills.filter((reqSkill: string) =>
        candidateSkills.includes(reqSkill.toLowerCase())
      )

      missingRequiredSkills = jobDetails.requiredSkills.filter((reqSkill: string) =>
        !candidateSkills.includes(reqSkill.toLowerCase())
      )

      skillsMatchPercentage = requiredSkills.length > 0 ?
        Math.round((matchedRequiredSkills.length / requiredSkills.length) * 100) : 0

      console.log(`🎯 Skill matching results:`, {
        requiredSkills: jobDetails.requiredSkills,
        candidateSkills: skills,
        matchedRequired: matchedRequiredSkills,
        missingRequired: missingRequiredSkills,
        matchPercentage: skillsMatchPercentage
      })
    }

    if (jobDetails && jobDetails.preferredSkills && Array.isArray(jobDetails.preferredSkills)) {
      const candidateSkills = skills.map((skill: string) => skill.toLowerCase())
      matchedPreferredSkills = jobDetails.preferredSkills.filter((prefSkill: string) =>
        candidateSkills.includes(prefSkill.toLowerCase())
      )
    }

    // Create realistic feedback based on actual data availability
    const dataQuality = hasContactInfo && hasSkills && hasExperience && hasEducation ? "Complete" :
                       (hasContactInfo || hasSkills || hasExperience) ? "Partial" : "Limited"

    const statusEmoji = baseScore > 75 ? '✅' : baseScore > 60 ? '⚠️' : '❌'
    const statusText = baseScore > 75 ? 'Good candidate' : baseScore > 60 ? 'Requires review' : 'Insufficient data'

    return {
      candidate_name: candidateName,
      email: email,
      phone: phone,
      location: extractedData?.location,
      linkedin: extractedData?.linkedin,
      skills: skills,
      soft_skills: extractedData?.softSkills || [], // Use only extracted soft skills, no placeholders
      programming_languages: programmingLanguages,
      frameworks: frameworks,
      tools: tools,
      databases: databases,
      experience_years: experienceYears,
      current_role: currentRole,
      previous_companies: previousCompanies,
      education: education,
      certifications: certifications,
      key_achievements: keyAchievements,
      matched_required_skills: matchedRequiredSkills,
      matched_preferred_skills: matchedPreferredSkills,
      missing_required_skills: missingRequiredSkills,
      recruiter_score: baseScore,
      analyst_score: Math.max(0, Math.min(100, baseScore - 3)), // More conservative
      hr_score: Math.max(0, Math.min(100, baseScore - 1)), // Slightly lower than base
      recommendation_score: baseScore,
      fit_score: baseScore,
      skills_match_percentage: skillsMatchPercentage, // Use actual skill matching percentage
      experience_relevance_score: hasExperience ? Math.min(80, experienceYears * 8) : 0,
      education_score: educationScore,
      resume_quality_score: qualityScore,
      feedback: `📄 ${candidateName} | ⭐ Fit Score: ${baseScore}/100 | 🎯 Skills: ${skills.length} identified | 💼 Experience: ${experienceYears} years | 🎓 ${education || 'Not specified'} | ${statusEmoji} ${statusText} | 📊 Data Quality: ${dataQuality}`,
      positive_points: [
        ...(experienceYears > 0 ? [`${experienceYears} years of experience`] : []),
        ...(skills.length > 0 ? [`${skills.length} technical skills identified`] : []),
        ...(education && (education.includes('Bachelor') || education.includes('Master')) ? ["Educational background"] : []),
        ...(hasContactInfo ? ["Contact information available"] : [])
      ].filter(point => point.length > 0),
      negative_points: [
        // Only show specific concerns if we actually have data to assess
        ...(!hasSkills ? ["Technical skills not clearly identified in resume"] : []),
        ...(!hasExperience ? ["Work experience information not found"] : []),
        ...(!hasEducation ? ["Education background not specified"] : []),
        ...(!hasContactInfo ? ["Contact information incomplete"] : []),
        // Only show data quality concerns if we truly have insufficient data
        ...(baseScore < 50 && !hasSkills && !hasExperience ? ["Resume requires manual review for complete assessment"] : [])
      ].filter(point => point.length > 0),
      overall_explanation: hasSkills || hasExperience || hasEducation ?
        `Analysis of ${candidateName} based on extracted data: ${experienceYears > 0 ? `${experienceYears} years experience` : 'No experience data'}${skills.length > 0 ? `, ${skills.length} technical skills` : ', no technical skills identified'}${education ? `, ${education}` : ', no education data'}. ${statusText} - ${dataQuality.toLowerCase()} data available for assessment.` :
        `Very limited information extracted for ${candidateName}. Manual review strongly recommended to properly assess candidate qualifications. Current analysis based on filename and basic text extraction only.`,
      rank_justification: `Scored ${baseScore}/100 based on available data: ${hasSkills ? `${skills.length} skills` : 'no skills'}${hasExperience ? `, ${experienceYears} years experience` : ', no experience'}${hasEducation ? `, education data` : ', no education'}${hasContactInfo ? `, contact info` : ', no contact info'}. ${dataQuality} data quality.`,
      match_percentage: hasSkills ? Math.min(70, skills.length * 8) : 0, // More conservative
      salary_expectation: extractedData?.salaryExpectation,
      availability: extractedData?.availability
    }
  }

  createFallbackAnalysis(resumeText: string, extractedData?: any, jobDetails?: any): ResumeAnalysis {
    console.log("Creating basic fallback analysis...")
    return this.createEnhancedFallbackAnalysis(resumeText, extractedData, jobDetails)
  }

  // Helper method to extract skills directly from text
  private extractSkillsFromText(text: string): string[] {
    const skillKeywords = [
      // Programming Languages
      'JavaScript', 'Python', 'Java', 'C#', 'C++', 'C', 'PHP', 'Ruby', 'Go', 'Rust', 'TypeScript', 'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'Perl', 'Shell', 'Bash', 'PowerShell',
      // Web Technologies
      'HTML', 'CSS', 'SCSS', 'SASS', 'Bootstrap', 'Tailwind', 'jQuery', 'AJAX', 'JSON', 'XML', 'REST', 'GraphQL', 'WebSocket', 'OAuth', 'JWT',
      // Frontend Frameworks
      'React', 'Angular', 'Vue', 'Vue.js', 'Svelte', 'Ember', 'Backbone', 'Next.js', 'Nuxt.js', 'Gatsby', 'Redux', 'MobX', 'Vuex',
      // Backend Frameworks
      'Node.js', 'Express', 'Django', 'Flask', 'FastAPI', 'Spring', 'Spring Boot', 'Laravel', 'Symfony', 'CodeIgniter', 'Ruby on Rails', 'ASP.NET', '.NET Core', 'Gin', 'Echo',
      // Databases
      'SQL', 'MySQL', 'PostgreSQL', 'SQLite', 'Oracle', 'SQL Server', 'MongoDB', 'Redis', 'Elasticsearch', 'Cassandra', 'DynamoDB', 'Firebase', 'Firestore', 'CouchDB', 'Neo4j',
      // Cloud & DevOps
      'AWS', 'Azure', 'GCP', 'Google Cloud', 'Docker', 'Kubernetes', 'Jenkins', 'CI/CD', 'GitLab CI', 'GitHub Actions', 'Terraform', 'Ansible', 'Chef', 'Puppet', 'Vagrant',
      // Version Control & Tools
      'Git', 'GitHub', 'GitLab', 'Bitbucket', 'SVN', 'Mercurial', 'JIRA', 'Confluence', 'Slack', 'Trello', 'Asana',
      // Testing
      'Jest', 'Mocha', 'Chai', 'Cypress', 'Selenium', 'Puppeteer', 'JUnit', 'TestNG', 'PyTest', 'PHPUnit', 'RSpec',
      // Mobile Development
      'React Native', 'Flutter', 'Ionic', 'Xamarin', 'Android', 'iOS', 'Swift', 'Objective-C', 'Kotlin',
      // Data Science & AI
      'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn', 'Pandas', 'NumPy', 'Matplotlib', 'Seaborn', 'Jupyter', 'Apache Spark', 'Hadoop', 'Tableau', 'Power BI', 'PowerBI',
      // Other Technologies
      'Microservices', 'API', 'Agile', 'Scrum', 'Kanban', 'DevOps', 'Linux', 'Unix', 'Windows', 'macOS', 'Nginx', 'Apache', 'Tomcat', 'IIS'
    ]

    const foundSkills = new Set<string>()

    // Strategy 1: Exact word boundary matching (case-insensitive)
    skillKeywords.forEach(skill => {
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
      if (regex.test(text)) {
        foundSkills.add(skill)
      }
    })

    // Strategy 2: Flexible matching for compound terms and variations
    const flexiblePatterns = [
      { pattern: /power\s*bi|powerbi/gi, skill: 'Power BI' },
      { pattern: /machine\s*learning|ml\b/gi, skill: 'Machine Learning' },
      { pattern: /deep\s*learning|dl\b/gi, skill: 'Deep Learning' },
      { pattern: /node\.?js|nodejs/gi, skill: 'Node.js' },
      { pattern: /vue\.?js|vuejs/gi, skill: 'Vue.js' },
      { pattern: /next\.?js|nextjs/gi, skill: 'Next.js' },
      { pattern: /react\.?js|reactjs/gi, skill: 'React' },
      { pattern: /angular\.?js|angularjs/gi, skill: 'Angular' },
      { pattern: /\.net\s*core|dotnet\s*core/gi, skill: '.NET Core' },
      { pattern: /asp\.?net|aspnet/gi, skill: 'ASP.NET' },
      { pattern: /c\s*sharp|c#/gi, skill: 'C#' },
      { pattern: /c\+\+|cpp/gi, skill: 'C++' },
      { pattern: /sql\s*server|sqlserver/gi, skill: 'SQL Server' },
      { pattern: /google\s*cloud|gcp/gi, skill: 'Google Cloud' },
      { pattern: /amazon\s*web\s*services|aws/gi, skill: 'AWS' },
      { pattern: /scikit[\-\s]*learn|sklearn/gi, skill: 'Scikit-learn' },
      { pattern: /apache\s*spark/gi, skill: 'Apache Spark' },
      { pattern: /ruby\s*on\s*rails|rails/gi, skill: 'Ruby on Rails' },
      { pattern: /spring\s*boot/gi, skill: 'Spring Boot' },
      { pattern: /react\s*native/gi, skill: 'React Native' }
    ]

    flexiblePatterns.forEach(({ pattern, skill }) => {
      if (pattern.test(text)) {
        foundSkills.add(skill)
      }
    })

    return Array.from(foundSkills)
  }

  // Helper method to extract experience years from text
  private extractExperienceFromText(text: string): number {
    const experiencePatterns = [
      /(\d+)\+?\s*years?\s*(?:of\s*)?experience/gi,
      /(\d+)\+?\s*yrs?\s*(?:of\s*)?experience/gi,
      /experience[:\s]*(\d+)\+?\s*years?/gi,
      /(\d+)\+?\s*years?\s*in/gi
    ]

    let experienceYears = 0
    for (const pattern of experiencePatterns) {
      const matches = [...text.matchAll(pattern)]
      if (matches.length > 0) {
        const years = matches.map(match => parseInt(match[1] || '0'))
        experienceYears = Math.max(experienceYears, ...years)
        break
      }
    }

    // If no explicit years found, try to estimate from work history dates
    if (experienceYears === 0) {
      const yearPattern = /20\d{2}/g
      const years = [...text.matchAll(yearPattern)].map(match => parseInt(match[0]))
      if (years.length >= 2) {
        experienceYears = Math.max(...years) - Math.min(...years)
      }
    }

    return Math.min(experienceYears, 50) // Cap at 50 years
  }

  // Helper method to extract education from text
  private extractEducationFromText(text: string): string {
    const educationMatch = text.match(/(Bachelor|Master|PhD|B\.S\.|M\.S\.|B\.A\.|M\.A\.).*?(?:in\s+)?([A-Za-z\s]+)(?:from\s+)?([A-Za-z\s]+(?:University|College|Institute))?/i)
    return educationMatch ? educationMatch[0] : ""
  }

  // Helper method to categorize skills
  private categorizeSkills(skills: string[], category: string): string[] {
    const categories = {
      programming: ['JavaScript', 'Python', 'Java', 'C#', 'C++', 'C', 'PHP', 'Ruby', 'Go', 'Rust', 'TypeScript', 'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'Perl', 'Shell', 'Bash', 'PowerShell'],
      frameworks: ['React', 'Angular', 'Vue', 'Vue.js', 'Node.js', 'Express', 'Django', 'Flask', 'FastAPI', 'Spring', 'Spring Boot', 'Laravel', 'Symfony', 'Ruby on Rails', 'ASP.NET', '.NET Core', 'Next.js', 'Nuxt.js', 'Gatsby'],
      tools: ['AWS', 'Azure', 'GCP', 'Google Cloud', 'Docker', 'Kubernetes', 'Git', 'GitHub', 'GitLab', 'Jenkins', 'CI/CD', 'Terraform', 'Ansible', 'Chef', 'Puppet', 'Vagrant'],
      databases: ['SQL', 'MySQL', 'PostgreSQL', 'SQLite', 'Oracle', 'SQL Server', 'MongoDB', 'Redis', 'Elasticsearch', 'Cassandra', 'DynamoDB', 'Firebase', 'Firestore']
    }

    const categorySkills = categories[category as keyof typeof categories] || []
    return skills.filter(skill =>
      categorySkills.some(catSkill => catSkill.toLowerCase() === skill.toLowerCase())
    )
  }

  async rankCandidates(analyses: ResumeAnalysis[], jobDetails: any): Promise<ResumeAnalysis[]> {
    try {
      console.log(`🏆 Starting candidate ranking for ${analyses.length} candidates...`)

      // Log candidate scores for debugging
      analyses.forEach((candidate, index) => {
        console.log(`📊 Candidate ${index + 1}: ${candidate.candidate_name} - Fit: ${candidate.fit_score || 'N/A'}, Rec: ${candidate.recommendation_score}`)
      })

      // Sort by fit_score first, then by recommendation_score as fallback
      const rankedCandidates = analyses.sort((a, b) => {
        const scoreA = a.fit_score || a.recommendation_score || 0
        const scoreB = b.fit_score || b.recommendation_score || 0
        return scoreB - scoreA
      })

      // Add rank information to feedback
      rankedCandidates.forEach((candidate, index) => {
        const rank = index + 1
        const rankSuffix = rank === 1 ? "st" : rank === 2 ? "nd" : rank === 3 ? "rd" : "th"

        // Update feedback with rank information
        if (candidate.feedback && !candidate.feedback.includes("⭐ Rank:")) {
          candidate.feedback += ` ⭐ Rank: ${rank}${rankSuffix} Best Fit`
        }
      })

      console.log("✅ Candidates ranked successfully by fit score")
      console.log(`🥇 Top candidate: ${rankedCandidates[0]?.candidate_name} with score ${rankedCandidates[0]?.fit_score || rankedCandidates[0]?.recommendation_score}`)
      return rankedCandidates
    } catch (error) {
      console.error("❌ Candidate ranking error:", error)
      console.log("🔄 Using fallback ranking by recommendation score...")
      return analyses.sort((a, b) => (b.recommendation_score || 0) - (a.recommendation_score || 0))
    }
  }

  private getRankingPrompt(analyses: ResumeAnalysis[], jobDetails: any): string {
    // Create a simplified version of the analyses for the prompt
    const simplifiedAnalyses = analyses.map((analysis, index) => {
      return {
        id: index,
        name: analysis.candidate_name,
        skills: analysis.skills,
        experience_years: analysis.experience_years,
        education: analysis.education,
        current_score: analysis.recommendation_score,
      }
    })

    return `
You are an expert AI hiring manager. Re-rank these candidates based on their fit for the job.
Return ONLY a JSON array with the candidate IDs in ranked order (best to worst).

Job Requirements:
- Title: ${jobDetails.jobTitle || "Software Engineer"}
- Required Skills: ${jobDetails.requiredSkills?.join(", ") || "Programming"}
- Experience Level: ${jobDetails.experienceLevel || "Mid Level"}
- Job Description: ${jobDetails.jobDescription?.substring(0, 500) || ""}

Candidates:
${JSON.stringify(simplifiedAnalyses, null, 2)}

Return a JSON array with this format:
[0, 2, 1, 3]

Where the numbers are the candidate IDs in ranked order (best to worst).
Return ONLY the JSON array, no other text.`
  }

  private parseRankedCandidates(analyses: ResumeAnalysis[], response: string): ResumeAnalysis[] {
    try {
      // Clean the response to extract JSON
      let cleanResponse = response.trim()

      // Remove markdown code blocks if present
      cleanResponse = cleanResponse.replace(/```json\s*/g, "").replace(/```\s*/g, "")

      // Find JSON array in the response
      const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const rankOrder = JSON.parse(jsonMatch[0])

        if (Array.isArray(rankOrder) && rankOrder.length > 0) {
          // Create a new array based on the ranking
          const rankedAnalyses: ResumeAnalysis[] = []

          for (const id of rankOrder) {
            if (analyses[id]) {
              rankedAnalyses.push(analyses[id])
            }
          }

          // Add any missing analyses at the end
          for (const analysis of analyses) {
            if (!rankedAnalyses.includes(analysis)) {
              rankedAnalyses.push(analysis)
            }
          }

          return rankedAnalyses
        }
      }

      // If parsing fails, return the original array sorted by score
      return analyses.sort((a, b) => b.recommendation_score - a.recommendation_score)
    } catch (error) {
      console.error("Error parsing ranking response:", error)
      return analyses.sort((a, b) => b.recommendation_score - a.recommendation_score)
    }
  }
}

export const geminiClient = new GeminiClient()
