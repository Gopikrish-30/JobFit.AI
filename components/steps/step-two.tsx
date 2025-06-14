"use client"

import type React from "react"

import { useState } from "react"
import { ChevronLeft, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import type { JobDetails } from "@/app/page"

interface StepTwoProps {
  jobDetails: JobDetails
  setJobDetails: (details: JobDetails) => void
  onNext: () => void
  onBack: () => void
}

export function StepTwo({ jobDetails, setJobDetails, onNext, onBack }: StepTwoProps) {
  const [activeTab, setActiveTab] = useState("basic")
  const [newRequiredSkill, setNewRequiredSkill] = useState("")
  const [newPreferredSkill, setNewPreferredSkill] = useState("")

  const isFormValid = () => {
    return (
      jobDetails.jobTitle.trim() &&
      jobDetails.experienceLevel &&
      jobDetails.jobDescription.trim() &&
      jobDetails.requiredSkills.length > 0
    )
  }

  const addRequiredSkill = () => {
    if (newRequiredSkill.trim() && !jobDetails.requiredSkills.includes(newRequiredSkill.trim())) {
      setJobDetails({
        ...jobDetails,
        requiredSkills: [...jobDetails.requiredSkills, newRequiredSkill.trim()],
      })
      setNewRequiredSkill("")
    }
  }

  const removeRequiredSkill = (index: number) => {
    setJobDetails({
      ...jobDetails,
      requiredSkills: jobDetails.requiredSkills.filter((_, i) => i !== index),
    })
  }

  const addPreferredSkill = () => {
    if (newPreferredSkill.trim() && !jobDetails.preferredSkills.includes(newPreferredSkill.trim())) {
      setJobDetails({
        ...jobDetails,
        preferredSkills: [...jobDetails.preferredSkills, newPreferredSkill.trim()],
      })
      setNewPreferredSkill("")
    }
  }

  const removePreferredSkill = (index: number) => {
    setJobDetails({
      ...jobDetails,
      preferredSkills: jobDetails.preferredSkills.filter((_, i) => i !== index),
    })
  }

  const handleRequiredSkillKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addRequiredSkill()
    }
  }

  const handlePreferredSkillKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addPreferredSkill()
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-slate-900">Job Requirements</h2>
        <p className="text-slate-600 text-sm">Define role requirements for candidate matching</p>
      </div>

      {/* Form Container */}
      <div className="bg-white rounded-xl shadow-lg p-5">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 mb-2">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="skills">Skills & Experience</TabsTrigger>
            <TabsTrigger value="details">Job Details</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-3">
            {/* Job Title and Department */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="jobTitle" className="text-sm font-medium text-slate-700">
                  Job Title *
                </Label>
                <Input
                  id="jobTitle"
                  placeholder="e.g., Senior Software Engineer"
                  value={jobDetails.jobTitle}
                  onChange={(e) => setJobDetails({ ...jobDetails, jobTitle: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="department" className="text-sm font-medium text-slate-700">
                  Department
                </Label>
                <Input
                  id="department"
                  placeholder="e.g., Engineering, Marketing"
                  value={jobDetails.department}
                  onChange={(e) => setJobDetails({ ...jobDetails, department: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* Experience Level and Years */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="experienceLevel" className="text-sm font-medium text-slate-700">
                  Experience Level *
                </Label>
                <Select
                  value={jobDetails.experienceLevel}
                  onValueChange={(value) => setJobDetails({ ...jobDetails, experienceLevel: value })}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior Level</SelectItem>
                    <SelectItem value="lead">Lead/Principal</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="minExperience" className="text-sm font-medium text-slate-700">
                  Min Years
                </Label>
                <Input
                  id="minExperience"
                  type="number"
                  placeholder="0"
                  value={jobDetails.minExperience}
                  onChange={(e) => setJobDetails({ ...jobDetails, minExperience: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="maxExperience" className="text-sm font-medium text-slate-700">
                  Max Years
                </Label>
                <Input
                  id="maxExperience"
                  type="number"
                  placeholder="10"
                  value={jobDetails.maxExperience}
                  onChange={(e) => setJobDetails({ ...jobDetails, maxExperience: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* Education Requirements */}
            <div className="space-y-1">
              <Label htmlFor="educationRequirement" className="text-sm font-medium text-slate-700">
                Education Requirements
              </Label>
              <Select
                value={jobDetails.educationRequirement}
                onValueChange={(value) => setJobDetails({ ...jobDetails, educationRequirement: value })}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select education requirement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high-school">High School</SelectItem>
                  <SelectItem value="associate">Associate Degree</SelectItem>
                  <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                  <SelectItem value="master">Master's Degree</SelectItem>
                  <SelectItem value="phd">PhD</SelectItem>
                  <SelectItem value="none">No Specific Requirement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-2 text-right">
              <Button
                onClick={() => setActiveTab("skills")}
                className="px-4 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Next →
              </Button>
            </div>
          </TabsContent>

          {/* Skills & Experience Tab */}
          <TabsContent value="skills" className="space-y-4">
            {/* Required Skills */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Required Skills *</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a required skill..."
                  value={newRequiredSkill}
                  onChange={(e) => setNewRequiredSkill(e.target.value)}
                  onKeyPress={handleRequiredSkillKeyPress}
                  className="h-9 text-sm flex-1"
                />
                <Button onClick={addRequiredSkill} size="sm" className="px-3 h-9">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[2rem]">
                {jobDetails.requiredSkills.map((skill, index) => (
                  <Badge key={index} variant="destructive" className="flex items-center gap-1">
                    {skill}
                    <X
                      className="h-3 w-3 cursor-pointer hover:bg-red-700 rounded"
                      onClick={() => removeRequiredSkill(index)}
                    />
                  </Badge>
                ))}
                {jobDetails.requiredSkills.length === 0 && (
                  <p className="text-xs text-slate-500 italic">No required skills added yet</p>
                )}
              </div>
            </div>

            {/* Preferred Skills */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Preferred Skills</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a preferred skill..."
                  value={newPreferredSkill}
                  onChange={(e) => setNewPreferredSkill(e.target.value)}
                  onKeyPress={handlePreferredSkillKeyPress}
                  className="h-9 text-sm flex-1"
                />
                <Button onClick={addPreferredSkill} size="sm" variant="outline" className="px-3 h-9">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[2rem]">
                {jobDetails.preferredSkills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {skill}
                    <X
                      className="h-3 w-3 cursor-pointer hover:bg-slate-400 rounded"
                      onClick={() => removePreferredSkill(index)}
                    />
                  </Badge>
                ))}
                {jobDetails.preferredSkills.length === 0 && (
                  <p className="text-xs text-slate-500 italic">No preferred skills added yet</p>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-between">
              <Button onClick={() => setActiveTab("basic")} variant="outline" className="px-4 py-1 text-sm">
                ← Back
              </Button>
              <Button
                onClick={() => setActiveTab("details")}
                className="px-4 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Next →
              </Button>
            </div>
          </TabsContent>

          {/* Job Details Tab */}
          <TabsContent value="details" className="space-y-3">
            {/* Job Description */}
            <div className="space-y-1">
              <Label htmlFor="jobDescription" className="text-sm font-medium text-slate-700">
                Job Description *
              </Label>
              <Textarea
                id="jobDescription"
                placeholder="Detailed description of the role, responsibilities, and what the ideal candidate looks like..."
                value={jobDetails.jobDescription}
                onChange={(e) => setJobDetails({ ...jobDetails, jobDescription: e.target.value })}
                rows={3}
                className="text-sm resize-none"
              />
            </div>

            {/* Key Responsibilities */}
            <div className="space-y-1">
              <Label htmlFor="keyResponsibilities" className="text-sm font-medium text-slate-700">
                Key Responsibilities
              </Label>
              <Textarea
                id="keyResponsibilities"
                placeholder="List the main responsibilities and duties for this role..."
                value={jobDetails.keyResponsibilities}
                onChange={(e) => setJobDetails({ ...jobDetails, keyResponsibilities: e.target.value })}
                rows={3}
                className="text-sm resize-none"
              />
            </div>

            {/* Company Information */}
            <div className="space-y-1">
              <Label htmlFor="companyInformation" className="text-sm font-medium text-slate-700">
                Company Information
              </Label>
              <Textarea
                id="companyInformation"
                placeholder="Brief company description, culture, values..."
                value={jobDetails.companyInformation}
                onChange={(e) => setJobDetails({ ...jobDetails, companyInformation: e.target.value })}
                rows={2}
                className="text-sm resize-none"
              />
            </div>

            <div className="pt-2 flex justify-between">
              <Button onClick={() => setActiveTab("skills")} variant="outline" className="px-4 py-1 text-sm">
                ← Back
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Navigation */}
        <div className="flex justify-between pt-4 mt-4 border-t border-slate-200">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex items-center gap-1 px-4 py-1 text-sm border-slate-300 hover:bg-slate-50"
          >
            <ChevronLeft className="h-3 w-3" />
            Back to Upload
          </Button>
          <Button
            onClick={onNext}
            disabled={!isFormValid()}
            className="px-6 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Start AI Analysis →
          </Button>
        </div>
      </div>
    </div>
  )
}
