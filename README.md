# JobFit.AI 🤖

**Intelligent Resume Screening & Candidate Matching Platform**

JobFit.AI is an advanced AI-powered resume screening system that automates the candidate evaluation process using cutting-edge technologies including LangChain, RAG (Retrieval-Augmented Generation), and Google's Gemini AI.

## 🚀 Features

### Core Functionality
- **📄 PDF Resume Processing**: Advanced PDF text extraction with multiple fallback methods
- **🧠 AI-Powered Analysis**: Multi-agent AI system for comprehensive candidate evaluation
- **🔍 Smart Skill Matching**: Intelligent matching of candidate skills with job requirements
- **📊 Comprehensive Scoring**: Multi-dimensional scoring system with detailed breakdowns
- **🏆 Automated Ranking**: AI-driven candidate ranking with justifications
- **📈 Real-time Progress**: Live progress tracking through the analysis pipeline

### Multi-Agent AI System
1. **👥 Recruiter Agent**: Contact information extraction and validation
2. **📊 Analyst Agent**: Technical skills analysis and job requirement matching
3. **💼 HR Agent**: Experience evaluation and cultural fit assessment
4. **🏆 Recommender Agent**: Final scoring, ranking, and recommendation generation

### Advanced Data Processing
- **🔗 LangChain Integration**: Semantic text chunking and processing
- **🗄️ RAG Implementation**: Vector-based information retrieval
- **📋 Structured Data Extraction**: Comprehensive resume parsing
- **🎯 Job Requirement Analysis**: Intelligent job description processing

## 🛠️ Tech Stack

### Frontend
- **Next.js 14.2.16** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icons
- **Shadcn/ui** - Modern UI components

### Backend & AI
- **Google Gemini AI** - Advanced language model for analysis
- **LangChain** - AI application framework
- **Vector Stores** - Semantic search and retrieval
- **PDF Processing** - Multiple PDF parsing libraries
- **Node.js** - Server-side runtime

### Key Libraries
```json
{
  "AI & ML": [
    "@langchain/community",
    "@langchain/core", 
    "@langchain/openai",
    "langchain"
  ],
  "PDF Processing": [
    "pdf-parse",
    "pdf-parse-fork",
    "pdf2pic"
  ],
  "UI Components": [
    "@radix-ui/*",
    "lucide-react",
    "tailwindcss",
    "class-variance-authority"
  ],
  "Forms & Validation": [
    "react-hook-form",
    "@hookform/resolvers",
    "zod"
  ],
  "Utilities": [
    "clsx",
    "tailwind-merge",
    "date-fns"
  ]
}
```

## 🏗️ Architecture

### Application Flow
```
1. Resume Upload → 2. PDF Extraction → 3. LangChain Processing → 4. AI Analysis → 5. Results Display
```

### Data Processing Pipeline
1. **PDF Text Extraction**: Multiple extraction methods with fallbacks
2. **LangChain Processing**: Semantic chunking and vector storage
3. **RAG Implementation**: Context-aware information retrieval
4. **Structured Data Extraction**: Contact info, skills, experience parsing
5. **Multi-Agent Analysis**: Sequential processing through specialized AI agents
6. **Scoring & Ranking**: Weighted scoring system with detailed breakdowns

### Scoring Methodology
- **Skills Match (60%)**: Technical skills alignment with job requirements
- **Experience Relevance (25%)**: Work history and career progression
- **Education & Certifications (10%)**: Academic background and credentials
- **Resume Quality (5%)**: Professional presentation and completeness

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Google Gemini API key

### Installation
```bash
# Clone the repository
git clone <https://github.com/Gopikrish-30/JobFit.AI.git>
cd jobfit-ai

# Install dependencies
npm install
# or
pnpm install

# Set up environment variables
cp .env.example .env.local
# Add your Google Gemini API key to .env.local

# Run the development server
npm run dev
# or
pnpm dev
```

### Environment Variables
```env
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
```

## 📱 Usage

1. **Upload Resumes**: Drag and drop PDF resumes or click to select files
2. **Define Job Requirements**: Enter job title, required skills, and job description
3. **AI Processing**: Watch as the system processes resumes through the AI pipeline
4. **Review Results**: Analyze ranked candidates with detailed scoring breakdowns
5. **Export Data**: Download results as CSV for further analysis

## 🔧 API Endpoints

- `POST /api/extract-pdf` - PDF text extraction
- `POST /api/process-with-rag` - LangChain and RAG processing
- `POST /api/analyze-simple` - Multi-agent AI analysis
- `POST /api/analyze-extracted-resumes` - Resume analysis with extracted data

## 📊 Features in Detail

### Resume Processing
- **Multi-format Support**: PDF processing with multiple extraction methods
- **Fallback Systems**: Robust error handling with graceful degradation
- **Quality Assessment**: Extraction confidence scoring
- **Real-time Feedback**: Live progress updates during processing

### AI Analysis
- **Context-Aware**: Uses job requirements for targeted analysis
- **Comprehensive Evaluation**: Multiple scoring dimensions
- **Transparent Scoring**: Detailed breakdowns and justifications
- **Ranking System**: Intelligent candidate prioritization

### Results Display
- **Interactive Dashboard**: Sortable candidate list with detailed views
- **Score Breakdowns**: Visual progress bars and detailed metrics
- **Export Functionality**: CSV download for external analysis
- **Responsive Design**: Works on desktop and mobile devices

## 🙏 Acknowledgments

- Google Gemini AI for advanced language processing
- LangChain for AI application framework
- Radix UI for accessible components
- Shadcn/ui for beautiful UI components
- The open-source community for amazing tools and libraries

---

