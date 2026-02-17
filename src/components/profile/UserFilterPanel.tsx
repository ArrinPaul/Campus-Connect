"use client"

import { useState } from "react"
import { X } from "lucide-react"

interface FilterCriteria {
  role?: "Student" | "Research Scholar" | "Faculty"
  skills: string[]
}

interface UserFilterPanelProps {
  onFilterChange: (filters: FilterCriteria) => void
}

export function UserFilterPanel({ onFilterChange }: UserFilterPanelProps) {
  const [selectedRole, setSelectedRole] = useState<
    "Student" | "Research Scholar" | "Faculty" | ""
  >("")
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState("")

  const handleRoleChange = (role: string) => {
    const newRole = role === "" ? undefined : (role as "Student" | "Research Scholar" | "Faculty")
    setSelectedRole(role as any)
    
    onFilterChange({
      role: newRole,
      skills: selectedSkills,
    })
  }

  const handleAddSkill = () => {
    const trimmedSkill = skillInput.trim()
    
    if (trimmedSkill && !selectedSkills.includes(trimmedSkill)) {
      const newSkills = [...selectedSkills, trimmedSkill]
      setSelectedSkills(newSkills)
      setSkillInput("")
      
      onFilterChange({
        role: selectedRole === "" ? undefined : selectedRole,
        skills: newSkills,
      })
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    const newSkills = selectedSkills.filter((skill) => skill !== skillToRemove)
    setSelectedSkills(newSkills)
    
    onFilterChange({
      role: selectedRole === "" ? undefined : selectedRole,
      skills: newSkills,
    })
  }

  const handleClearFilters = () => {
    setSelectedRole("")
    setSelectedSkills([])
    setSkillInput("")
    
    onFilterChange({
      role: undefined,
      skills: [],
    })
  }

  const hasActiveFilters = selectedRole !== "" || selectedSkills.length > 0

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
            aria-label="Clear all filters"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Role Filter */}
      <div className="mb-4">
        <label
          htmlFor="role-filter"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Role
        </label>
        <select
          id="role-filter"
          value={selectedRole}
          onChange={(e) => handleRoleChange(e.target.value)}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label="Filter by role"
        >
          <option value="">All Roles</option>
          <option value="Student">Student</option>
          <option value="Research Scholar">Research Scholar</option>
          <option value="Faculty">Faculty</option>
        </select>
      </div>

      {/* Skills Filter */}
      <div>
        <label
          htmlFor="skills-filter"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Skills
        </label>
        
        {/* Skill Input */}
        <div className="mb-2 flex gap-2">
          <input
            id="skills-filter"
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleAddSkill()
              }
            }}
            placeholder="Add skill..."
            className="block flex-1 rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-label="Add skill filter"
          />
          <button
            type="button"
            onClick={handleAddSkill}
            disabled={!skillInput.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            aria-label="Add skill"
          >
            Add
          </button>
        </div>

        {/* Selected Skills */}
        {selectedSkills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedSkills.map((skill) => (
              <div
                key={skill}
                className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="text-blue-600 hover:text-blue-800"
                  aria-label={`Remove ${skill} filter`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
