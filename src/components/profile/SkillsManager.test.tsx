import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react"
import { SkillsManager } from "./SkillsManager"

// Mock Convex
const mockAddSkill = jest.fn()
const mockRemoveSkill = jest.fn()

jest.mock("convex/react", () => ({
  useMutation: jest.fn((api) => {
    if (api.toString().includes("addSkill")) {
      return mockAddSkill
    }
    if (api.toString().includes("removeSkill")) {
      return mockRemoveSkill
    }
    return jest.fn()
  }),
}))

// Mock validations
jest.mock("../../../lib/validations", () => ({
  validateSkill: jest.fn((skill: string) => {
    if (!skill || skill.trim().length === 0) {
      return { valid: false, error: "Skill name cannot be empty" }
    }
    if (skill.length > 50) {
      return { valid: false, error: "Skill name must not exceed 50 characters" }
    }
    return { valid: true }
  }),
}))

describe("SkillsManager", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAddSkill.mockResolvedValue(undefined)
    mockRemoveSkill.mockResolvedValue(undefined)
    
    // Reset validation mock to default behavior
    const { validateSkill } = require("../../../lib/validations")
    validateSkill.mockImplementation((skill: string) => {
      if (!skill || skill.trim().length === 0) {
        return { valid: false, error: "Skill name cannot be empty" }
      }
      if (skill.length > 50) {
        return { valid: false, error: "Skill name must not exceed 50 characters" }
      }
      return { valid: true }
    })
  })

  afterEach(() => {
    cleanup()
  })

  it("should render skill input and add button", () => {
    render(<SkillsManager skills={[]} />)

    expect(
      screen.getByPlaceholderText(/add a skill/i)
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^add$/i })).toBeInTheDocument()
  })

  it("should display existing skills", () => {
    const skills = ["React", "TypeScript", "Node.js"]
    render(<SkillsManager skills={skills} />)

    skills.forEach((skill) => {
      expect(screen.getByText(skill)).toBeInTheDocument()
    })
  })

  it("should show message when no skills exist", () => {
    render(<SkillsManager skills={[]} />)

    expect(
      screen.getByText(/no skills added yet/i)
    ).toBeInTheDocument()
  })

  it("should add a skill when form is submitted", async () => {
    render(<SkillsManager skills={[]} />)

    const input = screen.getByPlaceholderText(/add a skill/i)
    const addButton = screen.getByRole("button", { name: /^add$/i })

    fireEvent.change(input, { target: { value: "React" } })
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(mockAddSkill).toHaveBeenCalledWith({ skill: "React" })
    })
  })

  it("should clear input after adding skill", async () => {
    render(<SkillsManager skills={[]} />)

    const input = screen.getByPlaceholderText(/add a skill/i) as HTMLInputElement
    const addButton = screen.getByRole("button", { name: /^add$/i })

    fireEvent.change(input, { target: { value: "React" } })
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(input.value).toBe("")
    })
  })

  it("should validate empty skill name", async () => {
    render(<SkillsManager skills={[]} />)

    const input = screen.getByPlaceholderText(/add a skill/i)
    const addButton = screen.getByRole("button", { name: /^add$/i })

    // Type a single space (button will be disabled due to trim check)
    fireEvent.change(input, { target: { value: " " } })
    
    // Button should be disabled for whitespace-only input
    expect(addButton).toBeDisabled()
  })

  it("should validate skill name length", async () => {
    const { validateSkill } = require("../../../lib/validations")
    
    // Clear any previous mock calls
    validateSkill.mockClear()
    
    // Set up the mock for this specific test
    validateSkill.mockImplementation((skill: string) => {
      if (skill.length > 50) {
        return { valid: false, error: "Skill name must not exceed 50 characters" }
      }
      return { valid: true }
    })

    render(<SkillsManager skills={[]} />)

    const input = screen.getByPlaceholderText(/add a skill/i)
    const addButton = screen.getByRole("button", { name: /^add$/i })

    const longSkill = "a".repeat(51)
    
    // Change input
    fireEvent.change(input, { target: { value: longSkill } })
    
    // Click to submit
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(
        screen.getByText("Skill name must not exceed 50 characters")
      ).toBeInTheDocument()
    })

    expect(mockAddSkill).not.toHaveBeenCalled()
  })

  it("should prevent duplicate skills", async () => {
    render(<SkillsManager skills={["React"]} />)

    const input = screen.getByPlaceholderText(/add a skill/i)
    const addButton = screen.getByRole("button", { name: /^add$/i })

    fireEvent.change(input, { target: { value: "React" } })
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(screen.getByText("Skill already exists")).toBeInTheDocument()
    })

    expect(mockAddSkill).not.toHaveBeenCalled()
  })

  it("should remove a skill when remove button is clicked", async () => {
    render(<SkillsManager skills={["React", "TypeScript"]} />)

    const removeButtons = screen.getAllByLabelText(/remove/i)
    fireEvent.click(removeButtons[0])

    await waitFor(() => {
      expect(mockRemoveSkill).toHaveBeenCalledWith({ skill: "React" })
    })
  })

  it("should call onUpdate callback after adding skill", async () => {
    const onUpdate = jest.fn()
    render(<SkillsManager skills={[]} onUpdate={onUpdate} />)

    const input = screen.getByPlaceholderText(/add a skill/i)
    const addButton = screen.getByRole("button", { name: /^add$/i })

    fireEvent.change(input, { target: { value: "React" } })
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalled()
    })
  })

  it("should call onUpdate callback after removing skill", async () => {
    const onUpdate = jest.fn()
    render(<SkillsManager skills={["React"]} onUpdate={onUpdate} />)

    const removeButton = screen.getByLabelText(/remove react/i)
    fireEvent.click(removeButton)

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalled()
    })
  })

  it("should disable add button when input is empty", () => {
    render(<SkillsManager skills={[]} />)

    const addButton = screen.getByRole("button", { name: /^add$/i })
    expect(addButton).toBeDisabled()
  })
})
