"use client"

import { useState } from "react"
import { Download, Trophy, TrendingUp, TrendingDown, User, Mail, Phone, Star, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import type { JobDetails } from "@/app/page"
import type { ResumeAnalysis } from "@/lib/gemini-client"

interface StepFourProps {
  results: ResumeAnalysis[]
  jobDetails: JobDetails
  onBack: () => void
}

export function StepFour({ results, jobDetails, onBack }: StepFourProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<ResumeAnalysis | null>(
    results.length > 0 ? results[0] : null,
  )
  const [activeTab, setActiveTab] = useState("overview")

  // Calculate stats
  const totalCandidates = results.length
  const topCandidates = Math.min(results.length, 4)
  const averageScore =
    results.length > 0
      ? Math.round((results.reduce((sum, r) => sum + r.recommendation_score, 0) / results.length) * 10) / 10
      : 0

  const downloadResults = () => {
    const csv = [
      [
        "Rank",
        "PDF Resume",
        "Final Score",
        "Recruiter Score",
        "Analyst Score",
        "HR Score",
        "Recommendation",
      ].join(","),
      ...results.map((r, index) =>
        [
          index + 1,
          r.file_name || r.candidate_name,
          r.recommendation_score,
          r.recruiter_score,
          r.analyst_score,
          r.hr_score,
          r.feedback,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${jobDetails.jobTitle.replace(/\s+/g, "_")}_candidates.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-50 border-green-200"
    if (score >= 60) return "bg-yellow-50 border-yellow-200"
    return "bg-red-50 border-red-200"
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">No Results Found</h2>
        <p className="text-gray-600 mb-6">There was an issue processing the resumes. Please try again.</p>
        <Button onClick={onBack}>← Back to Upload</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold text-blue-600">{totalCandidates}</div>
            <div className="text-sm text-gray-600 mt-1">Total Candidates</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold text-green-600">{topCandidates}</div>
            <div className="text-sm text-gray-600 mt-1">Top Candidates</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold text-purple-600">{averageScore}</div>
            <div className="text-sm text-gray-600 mt-1">Average Score</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Button onClick={downloadResults} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Candidate List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                Top Candidates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {results.map((candidate, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedCandidate?.candidate_name === candidate.candidate_name
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedCandidate(candidate)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{candidate.file_name || candidate.candidate_name}</div>
                        <div className="text-xs text-gray-500">PDF Resume</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getScoreColor(candidate.fit_score || candidate.recommendation_score)}`}>
                        {(candidate.fit_score || candidate.recommendation_score).toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500">Fit Score</div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Detailed View */}
        <div className="lg:col-span-2">
          {selectedCandidate ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{selectedCandidate.file_name || selectedCandidate.candidate_name}</CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="text-sm text-gray-600">PDF Resume Analysis</span>
                    </CardDescription>
                  </div>
                  <div
                    className={`text-center p-3 rounded-lg border-2 ${getScoreBgColor(selectedCandidate.fit_score || selectedCandidate.recommendation_score)}`}
                  >
                    <div className={`text-2xl font-bold ${getScoreColor(selectedCandidate.fit_score || selectedCandidate.recommendation_score)}`}>
                      {(selectedCandidate.fit_score || selectedCandidate.recommendation_score).toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-600">Fit Score</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="scores">Scores</TabsTrigger>
                    <TabsTrigger value="analysis">Analysis</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Overall Recommendation</h4>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-700">{selectedCandidate.feedback}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Positive Points
                        </h4>
                        <ul className="space-y-2">
                          {selectedCandidate.positive_points?.length > 0 ? (
                            selectedCandidate.positive_points.map((point, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <Star className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span>{point}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-sm text-gray-500">No specific positive points identified</li>
                          )}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                          <TrendingDown className="h-4 w-4" />
                          Areas of Concern
                        </h4>
                        <ul className="space-y-2">
                          {selectedCandidate.negative_points?.length > 0 ? (
                            selectedCandidate.negative_points.map((point, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                <span>{point}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-sm text-gray-500">No major concerns identified</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="scores" className="space-y-6">
                    {/* Fit Score Breakdown */}
                    {selectedCandidate.fit_score && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Fit Score Breakdown</h4>
                        <div className="grid md:grid-cols-4 gap-4">
                          <Card>
                            <CardContent className="p-4 text-center">
                              <div className="text-2xl font-bold text-blue-600">
                                {selectedCandidate.skills_match_percentage || "N/A"}
                              </div>
                              <div className="text-sm text-gray-600 mb-2">Skills Match</div>
                              <Progress value={selectedCandidate.skills_match_percentage || 0} className="h-2" />
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4 text-center">
                              <div className="text-2xl font-bold text-green-600">
                                {selectedCandidate.experience_relevance_score || "N/A"}
                              </div>
                              <div className="text-sm text-gray-600 mb-2">Experience</div>
                              <Progress value={selectedCandidate.experience_relevance_score || 0} className="h-2" />
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4 text-center">
                              <div className="text-2xl font-bold text-purple-600">
                                {selectedCandidate.education_score || "N/A"}
                              </div>
                              <div className="text-sm text-gray-600 mb-2">Education</div>
                              <Progress value={selectedCandidate.education_score || 0} className="h-2" />
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4 text-center">
                              <div className="text-2xl font-bold text-orange-600">
                                {selectedCandidate.resume_quality_score || "N/A"}
                              </div>
                              <div className="text-sm text-gray-600 mb-2">Quality</div>
                              <Progress value={selectedCandidate.resume_quality_score || 0} className="h-2" />
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    )}

                    {/* Traditional Scores */}
                    <div className="grid md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">{selectedCandidate.recruiter_score}</div>
                          <div className="text-sm text-gray-600 mb-2">Recruiter Score</div>
                          <Progress value={selectedCandidate.recruiter_score} className="h-2" />
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {selectedCandidate.analyst_score.toFixed(1)}
                          </div>
                          <div className="text-sm text-gray-600 mb-2">Analyst Score</div>
                          <Progress value={selectedCandidate.analyst_score} className="h-2" />
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-purple-600">{selectedCandidate.hr_score}</div>
                          <div className="text-sm text-gray-600 mb-2">HR Score</div>
                          <Progress value={selectedCandidate.hr_score} className="h-2" />
                        </CardContent>
                      </Card>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Detailed Assessment</h4>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-700">{selectedCandidate.overall_explanation}</p>
                      </div>
                    </div>
                  </TabsContent>



                  <TabsContent value="analysis" className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Job Match Analysis</h4>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-700">
                          {selectedCandidate.overall_explanation ||
                            "This candidate has been evaluated across multiple dimensions including technical skills, experience relevance, and cultural fit."}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Resume Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <h5 className="font-medium text-gray-900 mb-1">Experience</h5>
                          <span className="text-xl font-bold text-blue-600">{selectedCandidate.experience_years}</span>
                          <span className="text-gray-600 ml-1">years</span>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <h5 className="font-medium text-gray-900 mb-1">Education</h5>
                          <p className="text-sm text-gray-700">{selectedCandidate.education || "Not specified"}</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <User className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Candidate</h3>
                <p className="text-gray-600">Choose a candidate from the list to view detailed analysis</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack} size="lg">
          ← Start New Analysis
        </Button>
        <div className="text-center">
          <div className="text-green-600 font-semibold">✅ Analysis Complete</div>
          <div className="text-sm text-gray-600">Top {topCandidates} candidates identified</div>
        </div>
      </div>
    </div>
  )
}
