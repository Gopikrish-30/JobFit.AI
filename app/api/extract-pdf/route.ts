import type { NextRequest } from "next/server"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"

// Import PDF parsing libraries
let pdfParse: any = null
let pdfParseFork: any = null

// Try to load pdf-parse (primary)
try {
  pdfParse = require('pdf-parse')
  console.log('✅ pdf-parse library loaded successfully')
} catch (error) {
  console.log('❌ pdf-parse not available:', error.message)
}

// Try to load pdf-parse-fork as backup
try {
  pdfParseFork = require('pdf-parse-fork')
  console.log('✅ pdf-parse-fork library loaded successfully')
} catch (error) {
  console.log('❌ pdf-parse-fork not available:', error.message)
}

export async function POST(request: NextRequest) {
  console.log("=== PDF Extraction API Started ===")

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.error("No file provided")
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    console.log(`📄 Extracting text from PDF: ${file.name}`)

    // Convert File to Buffer for pdf-parse
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    try {
      let extractedText = ""
      let pageCount = 1
      let extractionMethod = "unknown"
      let textChunks: string[] = []

      // Method 1: Try pdf-parse if available (PRIORITY METHOD)
      if (pdfParse) {
        try {
          console.log(`🔄 Attempting extraction with pdf-parse...`)
          const pdfData = await pdfParse(buffer)
          extractedText = pdfData.text || ""
          pageCount = pdfData.numpages || 1
          extractionMethod = "pdf-parse"

          console.log(`✅ pdf-parse extraction: ${extractedText.length} characters from ${pageCount} pages`)
          console.log(`📄 Raw text preview (first 500 chars): "${extractedText.substring(0, 500)}..."`)

          // Check if we got meaningful text (not just PDF metadata)
          if (extractedText.length > 50) {
            // Check if it's readable text (contains letters and common words)
            const readableTextTest = /[a-zA-Z]{3,}/.test(extractedText.substring(0, 500))
            const hasCommonWords = /\b(the|and|or|of|to|in|for|with|by|from|as|at|on|is|are|was|were|be|been|have|has|had|do|does|did|will|would|could|should|may|might|can|must)\b/i.test(extractedText.substring(0, 1000))

            if (readableTextTest && extractedText.length > 100) {
              console.log(`📝 Good quality text extracted with pdf-parse`)
              extractedText = extractedText.trim()
            } else {
              console.log(`⚠️ pdf-parse extracted poor quality text, trying alternatives...`)
              extractedText = ""
            }
          } else {
            console.log(`⚠️ pdf-parse extracted insufficient text (${extractedText.length} chars)`)
            extractedText = ""
          }
        } catch (pdfError) {
          console.error(`❌ pdf-parse failed:`, pdfError)
          extractedText = ""
        }
      }

      // Method 1.5: Try pdf-parse-fork if pdf-parse failed
      if ((!extractedText || extractedText.length < 50) && pdfParseFork) {
        try {
          console.log(`🔄 Attempting extraction with pdf-parse-fork...`)
          const pdfData = await pdfParseFork(buffer)
          extractedText = pdfData.text || ""
          pageCount = pdfData.numpages || 1
          extractionMethod = "pdf-parse-fork"

          console.log(`✅ pdf-parse-fork extraction: ${extractedText.length} characters from ${pageCount} pages`)

          if (extractedText.length > 50) {
            const readableTextTest = /[a-zA-Z]{3,}/.test(extractedText.substring(0, 500))
            if (readableTextTest && extractedText.length > 100) {
              console.log(`📝 Good quality text extracted with pdf-parse-fork`)
              extractedText = extractedText.trim()
            } else {
              console.log(`⚠️ pdf-parse-fork extracted poor quality text`)
              extractedText = ""
            }
          }
        } catch (pdfForkError) {
          console.error(`❌ pdf-parse-fork failed:`, pdfForkError)
          extractedText = ""
        }
      }

      // Method 2: Enhanced Manual PDF text extraction
      if (!extractedText || extractedText.length < 50) {
        console.log(`🔄 Attempting enhanced manual PDF text extraction...`)
        try {
          // Try different string encodings
          const bufferStr = buffer.toString('latin1')  // Better for PDF binary data
          let manualText = ""

          // Method 2a: Extract text from PDF text objects (most reliable)
          const textObjectRegex = /BT\s*([\s\S]*?)\s*ET/g
          let textObjMatch
          while ((textObjMatch = textObjectRegex.exec(bufferStr)) !== null) {
            const textBlock = textObjMatch[1]

            // Extract text from various PDF text operators
            const textPatterns = [
              /\(([^)]+)\)\s*Tj/g,        // (text)Tj
              /\(([^)]+)\)\s*TJ/g,        // (text)TJ
              /\(([^)]+)\)\s*'/g,         // (text)'
              /\(([^)]+)\)\s*"/g,         // (text)"
              /\[([^\]]+)\]\s*TJ/g,       // [text]TJ
              /\(([^)]*)\)/g              // Any (text) pattern
            ]

            textPatterns.forEach(pattern => {
              let match
              while ((match = pattern.exec(textBlock)) !== null) {
                let text = match[1]
                if (text && text.length > 0) {
                  // Clean up PDF escape sequences
                  text = text
                    .replace(/\\n/g, '\n')
                    .replace(/\\r/g, '\r')
                    .replace(/\\t/g, '\t')
                    .replace(/\\\(/g, '(')
                    .replace(/\\\)/g, ')')
                    .replace(/\\\\/g, '\\')

                  // Only add if it contains readable characters
                  if (/[a-zA-Z0-9@.\-_]/.test(text)) {
                    manualText += text + " "
                  }
                }
              }
            })
          }

          // Method 2b: Extract from stream objects
          const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g
          let streamMatch
          while ((streamMatch = streamRegex.exec(bufferStr)) !== null) {
            const streamContent = streamMatch[1]

            // Look for readable text patterns in streams
            const readableTextRegex = /([A-Za-z][A-Za-z0-9\s@.\-_]{5,})/g
            let readableMatch
            while ((readableMatch = readableTextRegex.exec(streamContent)) !== null) {
              const text = readableMatch[1].trim()
              if (text.length > 3 && /[a-zA-Z]/.test(text)) {
                manualText += text + " "
              }
            }
          }

          // Method 2c: Look for common resume patterns
          const resumePatterns = [
            /([A-Z][a-z]+\s+[A-Z][a-z]+)/g,  // Names
            /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,  // Emails
            /(\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/g,  // Phone numbers
            /(Python|JavaScript|Java|React|SQL|HTML|CSS)/gi,  // Common skills
            /(Experience|Education|Skills|Projects|Contact)/gi  // Resume sections
          ]

          resumePatterns.forEach(pattern => {
            let match
            while ((match = pattern.exec(bufferStr)) !== null) {
              const text = match[1]
              if (text && text.length > 2) {
                manualText += text + " "
              }
            }
          })

          // Clean up extracted text
          manualText = manualText
            .replace(/\s+/g, ' ')  // Normalize whitespace
            .replace(/[^\x20-\x7E\n\r\t]/g, ' ')  // Remove non-printable chars
            .replace(/\s+/g, ' ')  // Remove extra spaces again
            .trim()

          if (manualText.length > 100) {
            extractedText = manualText
            extractionMethod = "enhanced-manual-extraction"
            console.log(`✅ Enhanced manual extraction found ${extractedText.length} characters`)
            console.log(`📋 Text preview: "${extractedText.substring(0, 300)}..."`)
          } else {
            console.log(`⚠️ Enhanced manual extraction yielded insufficient results: ${manualText.length} chars`)
          }
        } catch (manualError) {
          console.error(`❌ Enhanced manual extraction failed:`, manualError)
        }
      }

      // Method 3: Last resort - try to extract any readable text
      if (!extractedText || extractedText.length < 50) {
        console.log(`🔄 Attempting last resort text extraction...`)
        try {
          const bufferStr = buffer.toString('utf8', 0, Math.min(buffer.length, 50000))  // Limit to first 50KB

          // Look for any sequences of readable characters
          const readableChunks = []
          const readableRegex = /[A-Za-z][A-Za-z0-9\s.,@\-_()]{10,}/g
          let match

          while ((match = readableRegex.exec(bufferStr)) !== null) {
            const chunk = match[0].trim()
            if (chunk.length > 5 && /[a-zA-Z].*[a-zA-Z]/.test(chunk)) {
              readableChunks.push(chunk)
            }
          }

          if (readableChunks.length > 0) {
            const lastResortText = readableChunks.join(' ')
              .replace(/\s+/g, ' ')
              .trim()

            if (lastResortText.length > 100) {
              extractedText = lastResortText
              extractionMethod = "last-resort-extraction"
              console.log(`✅ Last resort extraction found ${extractedText.length} characters`)
              console.log(`📋 Text preview: "${extractedText.substring(0, 300)}..."`)
            }
          }
        } catch (lastResortError) {
          console.error(`❌ Last resort extraction failed:`, lastResortError)
        }
      }

      // Step 2: Create text chunks using RecursiveCharacterTextSplitter
      if (extractedText && extractedText.length > 0) {
        console.log(`🧩 Creating text chunks with RecursiveCharacterTextSplitter...`)

        const textSplitter = new RecursiveCharacterTextSplitter({
          chunkSize: 1000,
          chunkOverlap: 200,
          separators: ["\n\n", "\n", ". ", " ", ""]
        })

        try {
          textChunks = await textSplitter.splitText(extractedText)
          console.log(`✅ Created ${textChunks.length} text chunks`)

          // Log chunk details
          textChunks.forEach((chunk, index) => {
            console.log(`📄 Chunk ${index + 1}: ${chunk.length} chars - "${chunk.substring(0, 100)}..."`)
          })
        } catch (chunkError) {
          console.error(`❌ Text chunking failed:`, chunkError)
          // Fallback: create simple chunks
          textChunks = [extractedText]
        }
      }

      console.log(`📊 Final extraction results:`)
      console.log(`- Method: ${extractionMethod}`)
      console.log(`- Text length: ${extractedText.length} characters`)
      console.log(`- Pages: ${pageCount}`)
      console.log(`- Chunks created: ${textChunks.length}`)

      if (extractedText.length > 0) {
        console.log(`📝 Text preview (first 500 chars): ${extractedText.substring(0, 500)}...`)
      } else {
        console.log(`⚠️ No readable text extracted`)
      }

      // Clean up extracted text - remove excessive whitespace but preserve structure
      const cleanText = extractedText
        .replace(/\s+/g, ' ')  // Replace multiple whitespace with single space
        .replace(/\n\s*\n/g, '\n')  // Remove empty lines
        .trim()

      // Log some key information for debugging
      const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(cleanText)
      const hasPhone = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/.test(cleanText)

      // Enhanced skill detection including your specific skills
      const skillKeywords = [
        'Python', 'JavaScript', 'Java', 'React', 'SQL', 'Machine Learning', 'Deep Learning',
        'Power BI', 'PowerBI', 'Frontend', 'Backend', 'Data', 'LLMs', 'Data Visualization',
        'Frontend Development', 'Technical Interest', 'Programming', 'Development', 'Analytics',
        'Artificial Intelligence', 'AI', 'ML', 'DL', 'Business Intelligence', 'Visualization',
        'HTML', 'CSS', 'Node.js', 'Express', 'Django', 'Flask', 'MongoDB', 'PostgreSQL',
        'AWS', 'Azure', 'Docker', 'Git', 'GitHub', 'API', 'REST', 'GraphQL', 'TypeScript'
      ]

      const foundSkills = new Set<string>()

      // Standard skill detection
      skillKeywords.forEach(skill => {
        const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
        if (regex.test(cleanText)) {
          foundSkills.add(skill)
        }
      })

      // Special patterns for compound skills
      const specialPatterns = [
        { pattern: /frontend\s+development/gi, skill: 'Frontend Development' },
        { pattern: /data\s+visualization/gi, skill: 'Data Visualization' },
        { pattern: /machine\s+learning/gi, skill: 'Machine Learning' },
        { pattern: /deep\s+learning/gi, skill: 'Deep Learning' },
        { pattern: /power\s*bi|powerbi/gi, skill: 'Power BI' },
        { pattern: /business\s+intelligence/gi, skill: 'Business Intelligence' },
        { pattern: /artificial\s+intelligence/gi, skill: 'Artificial Intelligence' }
      ]

      specialPatterns.forEach(({ pattern, skill }) => {
        if (pattern.test(cleanText)) {
          foundSkills.add(skill)
        }
      })

      const foundSkillsArray = Array.from(foundSkills)

      // Enhanced detection for "Areas of Technical Interest" and similar sections
      const technicalSectionPatterns = [
        /Areas?\s+of\s+Technical\s+Interest[:\s]*([\s\S]*?)(?:\n\s*\n|$)/gi,
        /Technical\s+Interest[s]?[:\s]*([\s\S]*?)(?:\n\s*\n|$)/gi,
        /Interest[s]?\s+Area[s]?[:\s]*([\s\S]*?)(?:\n\s*\n|$)/gi,
        /Technical\s+Skills?\s+&?\s*Interest[s]?[:\s]*([\s\S]*?)(?:\n\s*\n|$)/gi
      ]

      let technicalInterests = []
      for (const pattern of technicalSectionPatterns) {
        const matches = cleanText.match(pattern)
        if (matches) {
          console.log(`🎯 Found technical interest section with pattern: ${pattern.source}`)
          const sectionContent = matches[0]
          console.log(`📄 Section content: ${sectionContent.substring(0, 200)}...`)

          // Extract individual interests
          const interests = sectionContent
            .replace(/Areas?\s+of\s+Technical\s+Interest[:\s]*/gi, '')
            .replace(/Technical\s+Interest[s]?[:\s]*/gi, '')
            .split(/[,·•\n\r]/)
            .map(s => s.trim())
            .filter(s => s.length > 2 && !/^\d+\.?$/.test(s))

          technicalInterests = [...technicalInterests, ...interests]
          console.log(`📋 Extracted interests: ${interests.join(', ')}`)
          break
        }
      }

      // Also look for numbered lists that might contain technical interests
      const numberedListMatch = cleanText.match(/(?:1\.?\s+.*(?:Development|Learning|BI|Visualization|Programming).*(?:\n\d+\.?\s+.*)*)/gi)
      if (numberedListMatch && technicalInterests.length === 0) {
        console.log(`🔢 Found numbered list with technical content`)
        const listItems = numberedListMatch[0].split(/\n?\d+\.?\s+/).filter(item => item.trim().length > 3)
        technicalInterests = [...technicalInterests, ...listItems.map(item => item.trim())]
        console.log(`📋 List items: ${listItems.join(', ')}`)
      }

      console.log(`🔍 Quick content analysis:`)
      console.log(`- Text length: ${cleanText.length} characters`)
      console.log(`- Has email: ${hasEmail}`)
      console.log(`- Has phone: ${hasPhone}`)
      console.log(`- Skills found: ${foundSkillsArray.join(', ') || 'None'}`)
      console.log(`- Technical interests found: ${technicalInterests.length > 0 ? 'Yes' : 'No'}`)

      if (technicalInterests.length > 0) {
        console.log(`📋 Technical interests: ${technicalInterests.slice(0, 5).join(', ')}`)
      }

      // Log first 1000 characters for debugging
      console.log(`📄 Full text preview (first 1000 chars):`)
      console.log(cleanText.substring(0, 1000))

      return new Response(JSON.stringify({
        success: true,
        text: cleanText,
        chunks: textChunks,
        pageCount: pageCount,
        length: cleanText.length,
        hasEmail,
        hasPhone,
        foundSkills: foundSkillsArray,
        technicalInterests: technicalInterests || [],
        extractionMethod
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })

    } catch (pdfError) {
      console.error(`❌ PDF parsing failed:`, pdfError)
      
      // Fallback: try to extract as plain text
      try {
        const fallbackText = await file.text()
        console.log(`🔄 Fallback text extraction: ${fallbackText.length} characters`)
        
        return new Response(JSON.stringify({
          success: true,
          text: fallbackText,
          pageCount: 1,
          length: fallbackText.length,
          fallback: true
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      } catch (fallbackError) {
        console.error(`❌ Fallback extraction also failed:`, fallbackError)
        throw new Error(`Both PDF parsing and fallback extraction failed: ${pdfError.message}`)
      }
    }

  } catch (error) {
    console.error("=== PDF Extraction API Error ===", error)
    return new Response(
      JSON.stringify({
        error: "Failed to extract PDF text: " + (error instanceof Error ? error.message : "Unknown error"),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
