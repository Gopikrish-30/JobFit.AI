import type { NextRequest } from "next/server"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { MemoryVectorStore } from "langchain/vectorstores/memory"
import { Document } from "@langchain/core/documents"
import { Embeddings } from "@langchain/core/embeddings"

// Mock Embeddings class for development
class MockEmbeddings extends Embeddings {
  constructor() {
    super({})
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    // Return mock embeddings (random vectors for development)
    return texts.map(() => Array.from({ length: 384 }, () => Math.random()))
  }

  async embedQuery(text: string): Promise<number[]> {
    // Return mock embedding for query
    return Array.from({ length: 384 }, () => Math.random())
  }
}

export async function POST(request: NextRequest) {
  console.log("=== RAG Processing API Started (Fixed) ===")

  try {
    const formData = await request.formData()
    const text = formData.get("text") as string
    const fileName = formData.get("fileName") as string
    const jobDetailsStr = formData.get("jobDetails") as string
    const chunksStr = formData.get("chunks") as string

    if (!text) {
      console.error("No text provided")
      return new Response(JSON.stringify({ error: "No text provided" }), {
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

    console.log(`🧠 Processing ${fileName} with LangChain + RAG`)
    console.log(`📝 Text length: ${text.length} characters`)

    // Step 1: Use pre-created chunks from PDF extraction or create new ones
    let docs: Document[] = []

    if (chunksStr) {
      try {
        const chunks = JSON.parse(chunksStr) as string[]
        console.log(`📦 Using ${chunks.length} pre-created chunks from PDF extraction`)

        docs = chunks.map((chunk, index) => new Document({
          pageContent: chunk,
          metadata: { source: fileName, type: "resume", chunkIndex: index }
        }))
      } catch (chunkError) {
        console.error("Error parsing chunks, falling back to text splitting:", chunkError)
      }
    }

    if (docs.length === 0) {
      console.log(`🧩 Creating new document chunks using LangChain text splitter...`)
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
        separators: ["\n\n", "\n", " ", ""]
      })

      docs = await textSplitter.createDocuments([text], [
        { source: fileName, type: "resume" }
      ])
    }

    console.log(`🧩 Using ${docs.length} document chunks for processing`)

    // Step 2: Create vector store for semantic search
    const embeddings = new MockEmbeddings()
    const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings)

    console.log(`🔍 Vector store created with ${docs.length} documents`)

    // Step 3: Use RAG to extract structured information
    const contactQuery = await vectorStore.similaritySearch("contact information email phone address", 3)
    const skillsQuery = await vectorStore.similaritySearch("technical skills programming languages frameworks tools", 3)
    const experienceQuery = await vectorStore.similaritySearch("work experience employment history job responsibilities", 3)
    const educationQuery = await vectorStore.similaritySearch("education degree university college certification", 3)

    console.log(`📊 RAG queries completed:`)
    console.log(`- Contact info chunks: ${contactQuery.length}`)
    console.log(`- Skills chunks: ${skillsQuery.length}`)
    console.log(`- Experience chunks: ${experienceQuery.length}`)
    console.log(`- Education chunks: ${educationQuery.length}`)

    // Step 4: Extract structured data from relevant chunks
    console.log(`🔄 Starting structured data extraction for ${fileName}...`)

    let structuredData
    let confidence = 0.5

    try {
      structuredData = await extractStructuredDataFromChunks({
        contactChunks: contactQuery,
        skillsChunks: skillsQuery,
        experienceChunks: experienceQuery,
        educationChunks: educationQuery,
        fullText: text,
        fileName: fileName || "resume.pdf"
      })

      console.log(`✅ Structured data extraction completed for ${fileName}`)
      console.log(`📋 Extracted:`, {
        name: structuredData.name,
        email: structuredData.email,
        skills: structuredData.skills,
        skillsCount: structuredData.skills.length,
        experience: structuredData.experience ? 'Yes' : 'No',
        education: structuredData.education ? 'Yes' : 'No'
      })

      // CRITICAL: Log the actual skills array to debug fake skills
      console.log(`🎯 ACTUAL SKILLS EXTRACTED:`, JSON.stringify(structuredData.skills))

      // Calculate confidence score based on extraction quality
      confidence = calculateConfidence(structuredData, text)

    } catch (extractionError) {
      console.error(`❌ Structured data extraction failed for ${fileName}:`, extractionError)

      // Provide fallback structured data
      structuredData = {
        name: fileName?.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ") || "Unknown",
        email: "",
        phone: "",
        skills: [],
        experience: "",
        education: "",
        summary: "Resume processing failed"
      }
    }

    return new Response(JSON.stringify({
      success: true,
      chunks: docs.map((doc, index) => ({
        content: doc.pageContent,
        metadata: doc.metadata,
        index
      })),
      structuredData,
      confidence,
      vectorStoreSize: docs.length
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })

  } catch (error) {
    console.error("=== RAG Processing API Error ===", error)
    return new Response(
      JSON.stringify({
        error: "Failed to process with RAG: " + (error instanceof Error ? error.message : "Unknown error"),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

// Extract structured data from RAG chunks
async function extractStructuredDataFromChunks(params: {
  contactChunks: Document[]
  skillsChunks: Document[]
  experienceChunks: Document[]
  educationChunks: Document[]
  fullText: string
  fileName: string
}) {
  console.log(`🔄 extractStructuredDataFromChunks started for ${params.fileName}`)
  const { contactChunks, skillsChunks, experienceChunks, educationChunks, fullText, fileName } = params

  try {
    // Extract contact information
    console.log(`📞 Extracting contact info from ${contactChunks.length} chunks...`)
    const contactText = contactChunks.map(doc => doc.pageContent).join(' ')
    const email = extractEmail(contactText) || extractEmail(fullText) || ""
    const phone = extractPhone(contactText) || extractPhone(fullText) || ""
    console.log(`📞 Contact extraction complete: email=${!!email}, phone=${!!phone}`)

    // Extract skills from skills chunks and full text
    console.log(`🛠️ Extracting skills from ${skillsChunks.length} chunks...`)
    const skillsText = skillsChunks.map(doc => doc.pageContent).join(' ')
    console.log(`🛠️ Skills text length: ${skillsText.length} chars`)
    console.log(`🛠️ Skills text preview: "${skillsText.substring(0, 200)}..."`)

    const skills = extractSkills(skillsText + ' ' + fullText)
    console.log(`🛠️ Skills extraction complete: found ${skills.length} skills`)

    // Extract experience from experience chunks
    console.log(`💼 Extracting experience from ${experienceChunks.length} chunks...`)
    const experienceText = experienceChunks.map(doc => doc.pageContent).join(' ')
    const experience = extractExperience(experienceText)
    console.log(`💼 Experience extraction complete: ${experience ? 'found' : 'not found'}`)

    // Extract education from education chunks
    console.log(`🎓 Extracting education from ${educationChunks.length} chunks...`)
    const educationText = educationChunks.map(doc => doc.pageContent).join(' ')
    const education = extractEducation(educationText)
    console.log(`🎓 Education extraction complete: ${education ? 'found' : 'not found'}`)

    // Use filename as name (cleaned)
    const name = fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ")
    console.log(`👤 Name extracted from filename: "${name}"`)

    // Generate summary
    console.log(`📝 Generating summary...`)
    const summary = generateSummary(skills, experience, education)
    console.log(`📝 Summary generated: "${summary.substring(0, 100)}..."`)

    const result = {
      name,
      email,
      phone,
      skills,
      experience,
      education,
      summary
    }

    console.log(`✅ extractStructuredDataFromChunks completed successfully`)
    return result

  } catch (error) {
    console.error(`❌ Error in extractStructuredDataFromChunks:`, error)
    throw error
  }
}

// Helper functions for extraction
function extractEmail(text: string): string | null {
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  return emailMatch ? emailMatch[0] : null
}

function extractPhone(text: string): string | null {
  const phoneMatch = text.match(/(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/)
  return phoneMatch ? phoneMatch[0] : null
}

function extractSkills(text: string): string[] {
  console.log(`🔍 EXTRACTING SKILLS FROM TEXT (${text.length} chars)`)
  console.log(`📄 Text preview: "${text.substring(0, 300)}..."`)

  // ONLY include skills that are clearly identifiable and not single letters
  const skillKeywords = [
    // Programming Languages (excluding single letters like C, R)
    'JavaScript', 'Python', 'Java', 'C#', 'C++', 'PHP', 'Ruby', 'TypeScript', 'Swift', 'Kotlin', 'Scala', 'MATLAB',

    // Web Technologies
    'HTML', 'CSS', 'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Laravel',

    // Databases
    'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Oracle', 'SQL Server',

    // Cloud & DevOps
    'AWS', 'Azure', 'GCP', 'Google Cloud', 'Docker', 'Kubernetes', 'Jenkins', 'Git', 'GitHub',

    // Data Science & AI
    'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Scikit-learn',
    'Power BI', 'PowerBI', 'Tableau', 'Data Visualization', 'Analytics', 'Artificial Intelligence', 'LLMs',

    // Other
    'Frontend Development', 'Backend Development', 'Full Stack', 'API', 'REST', 'GraphQL', 'Microservices'
  ]

  const foundSkills = new Set<string>()

  // STRICT word boundary matching - only add if actually found
  skillKeywords.forEach(skill => {
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    if (regex.test(text)) {
      foundSkills.add(skill)
      console.log(`✅ FOUND SKILL: "${skill}"`)
    }
  })

  // Special patterns for compound terms - ONLY if they actually exist
  const specialPatterns = [
    { pattern: /power\s*bi|powerbi/gi, skill: 'Power BI' },
    { pattern: /machine\s*learning/gi, skill: 'Machine Learning' },
    { pattern: /deep\s*learning/gi, skill: 'Deep Learning' },
    { pattern: /frontend\s*development/gi, skill: 'Frontend Development' },
    { pattern: /data\s*visualization/gi, skill: 'Data Visualization' },
    { pattern: /artificial\s*intelligence/gi, skill: 'Artificial Intelligence' }
  ]

  specialPatterns.forEach(({ pattern, skill }) => {
    if (pattern.test(text) && !foundSkills.has(skill)) {
      foundSkills.add(skill)
      console.log(`✅ FOUND COMPOUND SKILL: "${skill}"`)
    }
  })

  const skillsArray = Array.from(foundSkills)
  console.log(`📊 TOTAL SKILLS EXTRACTED: ${skillsArray.length}`)
  console.log(`📋 SKILLS LIST: [${skillsArray.join(', ')}]`)

  // CRITICAL: Only return skills if we actually found them
  if (skillsArray.length === 0) {
    console.log(`❌ NO REAL SKILLS FOUND - RETURNING EMPTY ARRAY`)
  }

  return skillsArray
}

function extractExperience(text: string): string {
  // Look for experience patterns
  const expPatterns = [
    /(\d+)\+?\s*years?\s*(?:of\s*)?experience/gi,
    /experience[:\s]*(\d+)\+?\s*years?/gi,
    /(\d+)\+?\s*years?\s*in/gi
  ]

  for (const pattern of expPatterns) {
    const match = text.match(pattern)
    if (match) {
      return match[0]
    }
  }

  // Look for work history indicators
  const workIndicators = ['employed', 'worked', 'developer', 'engineer', 'analyst', 'manager']
  for (const indicator of workIndicators) {
    if (text.toLowerCase().includes(indicator)) {
      return `Professional experience in ${indicator}`
    }
  }

  return ""
}

function extractEducation(text: string): string {
  const eduMatch = text.match(/(Bachelor|Master|PhD|B\.S\.|M\.S\.|B\.A\.|M\.A\.|Degree).*?(?:in\s+)?([A-Za-z\s]+)(?:from\s+)?([A-Za-z\s]+(?:University|College|Institute))?/i)
  return eduMatch ? eduMatch[0] : ""
}

function generateSummary(skills: string[], experience: string, education: string): string {
  const parts = []
  
  if (skills.length > 0) {
    parts.push(`Skilled in ${skills.slice(0, 3).join(', ')}${skills.length > 3 ? ' and more' : ''}`)
  }
  
  if (experience) {
    parts.push(`with ${experience.toLowerCase()}`)
  }
  
  if (education) {
    parts.push(`holding ${education}`)
  }
  
  return parts.length > 0 ? parts.join(' ') + '.' : 'Professional background available.'
}

function calculateConfidence(structuredData: any, fullText: string): number {
  let confidence = 0.5 // Base confidence
  
  // Boost confidence based on extracted data quality
  if (structuredData.email) confidence += 0.1
  if (structuredData.phone) confidence += 0.1
  if (structuredData.skills.length > 0) confidence += 0.2
  if (structuredData.skills.length > 3) confidence += 0.1
  if (structuredData.experience) confidence += 0.15
  if (structuredData.education) confidence += 0.1
  if (fullText.length > 500) confidence += 0.05
  
  return Math.min(confidence, 1.0)
}
