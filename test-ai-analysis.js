// Simple test to verify Gemini API connectivity
async function testGeminiAPI() {
  const apiKey = "AIzaSyCgaFzMltN282Qq0PF0oG6eGzayQciLWNs";
  const baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: "Analyze this resume: John Doe, Software Engineer with Python and JavaScript skills. Return JSON with candidate_name, skills array, and recommendation_score.",
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    },
  };

  try {
    console.log('🧪 Testing Gemini API directly...');

    const response = await fetch(`${baseUrl}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    console.log('✅ Gemini API response received');
    console.log('📄 Response:', text.substring(0, 500));

    return text;
  } catch (error) {
    console.error('❌ Gemini API test failed:', error.message);
    throw error;
  }
}

testGeminiAPI().catch(console.error);
