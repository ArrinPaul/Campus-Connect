import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { UserFilterPanel } from "./UserFilterPanel"

describe("UserFilterPanel", () => {
  it("should render filter panel with role dropdown and skills input", () => {
    const mockOnFilterChange = jest.fn()
    render(<UserFilterPanel onFilterChange={mockOnFilterChange} />)

    expect(screen.getByText("Filters")).toBeInTheDocument()
    expect(screen.getByLabelText("Filter by role")).toBeInTheDocument()
    expect(screen.getByLabelText("Add skill filter")).toBeInTheDocument()
  })

  it("should trigger filter change when role is selected", () => {
    const mockOnFilterChange = jest.fn()
    render(<UserFilterPanel onFilterChange={mockOnFilterChange} />)

    const roleSelect = screen.getByLabelText("Filter by role")
    fireEvent.change(roleSelect, { target: { value: "Student" } })

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      role: "Student",
      skills: [],
    })
  })

  it("should trigger filter change when role is cleared", () => {
    const mockOnFilterChange = jest.fn()
    render(<UserFilterPanel onFilterChange={mockOnFilterChange} />)

    const roleSelect = screen.getByLabelText("Filter by role")
    
    // Select a role first
    fireEvent.change(roleSelect, { target: { value: "Faculty" } })
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      role: "Faculty",
      skills: [],
    })

    // Clear the role
    fireEvent.change(roleSelect, { target: { value: "" } })
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      role: undefined,
      skills: [],
    })
  })

  it("should add skill when Add button is clicked", () => {
    const mockOnFilterChange = jest.fn()
    render(<UserFilterPanel onFilterChange={mockOnFilterChange} />)

    const skillInput = screen.getByLabelText("Add skill filter")
    const addButton = screen.getByLabelText("Add skill")

    fireEvent.change(skillInput, { target: { value: "React" } })
    fireEvent.click(addButton)

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      role: undefined,
      skills: ["React"],
    })
    expect(screen.getByText("React")).toBeInTheDocument()
  })

  it("should add skill when Enter key is pressed", () => {
    const mockOnFilterChange = jest.fn()
    render(<UserFilterPanel onFilterChange={mockOnFilterChange} />)

    const skillInput = screen.getByLabelText("Add skill filter")

    fireEvent.change(skillInput, { target: { value: "TypeScript" } })
    fireEvent.keyDown(skillInput, { key: "Enter" })

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      role: undefined,
      skills: ["TypeScript"],
    })
    expect(screen.getByText("TypeScript")).toBeInTheDocument()
  })

  it("should clear skill input after adding", () => {
    const mockOnFilterChange = jest.fn()
    render(<UserFilterPanel onFilterChange={mockOnFilterChange} />)

    const skillInput = screen.getByLabelText(
      "Add skill filter"
    ) as HTMLInputElement
    const addButton = screen.getByLabelText("Add skill")

    fireEvent.change(skillInput, { target: { value: "JavaScript" } })
    fireEvent.click(addButton)

    expect(skillInput.value).toBe("")
  })

  it("should not add duplicate skills", () => {
    const mockOnFilterChange = jest.fn()
    render(<UserFilterPanel onFilterChange={mockOnFilterChange} />)

    const skillInput = screen.getByLabelText("Add skill filter")
    const addButton = screen.getByLabelText("Add skill")

    // Add skill first time
    fireEvent.change(skillInput, { target: { value: "Python" } })
    fireEvent.click(addButton)

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      role: undefined,
      skills: ["Python"],
    })

    // Try to add same skill again
    mockOnFilterChange.mockClear()
    fireEvent.change(skillInput, { target: { value: "Python" } })
    fireEvent.click(addButton)

    // Should not trigger filter change with duplicate
    expect(mockOnFilterChange).not.toHaveBeenCalled()
  })

  it("should not add empty or whitespace-only skills", () => {
    const mockOnFilterChange = jest.fn()
    render(<UserFilterPanel onFilterChange={mockOnFilterChange} />)

    const skillInput = screen.getByLabelText("Add skill filter")
    const addButton = screen.getByLabelText("Add skill")

    // Try to add empty skill
    fireEvent.change(skillInput, { target: { value: "" } })
    fireEvent.click(addButton)
    expect(mockOnFilterChange).not.toHaveBeenCalled()

    // Try to add whitespace-only skill
    fireEvent.change(skillInput, { target: { value: "   " } })
    fireEvent.click(addButton)
    expect(mockOnFilterChange).not.toHaveBeenCalled()
  })

  it("should remove skill when X button is clicked", () => {
    const mockOnFilterChange = jest.fn()
    render(<UserFilterPanel onFilterChange={mockOnFilterChange} />)

    const skillInput = screen.getByLabelText("Add skill filter")
    const addButton = screen.getByLabelText("Add skill")

    // Add a skill
    fireEvent.change(skillInput, { target: { value: "Java" } })
    fireEvent.click(addButton)

    expect(screen.getByText("Java")).toBeInTheDocument()

    // Remove the skill
    mockOnFilterChange.mockClear()
    const removeButton = screen.getByLabelText("Remove Java filter")
    fireEvent.click(removeButton)

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      role: undefined,
      skills: [],
    })
    expect(screen.queryByText("Java")).not.toBeInTheDocument()
  })

  it("should display multiple selected skills", () => {
    const mockOnFilterChange = jest.fn()
    render(<UserFilterPanel onFilterChange={mockOnFilterChange} />)

    const skillInput = screen.getByLabelText("Add skill filter")
    const addButton = screen.getByLabelText("Add skill")

    // Add multiple skills
    fireEvent.change(skillInput, { target: { value: "React" } })
    fireEvent.click(addButton)

    fireEvent.change(skillInput, { target: { value: "Node.js" } })
    fireEvent.click(addButton)

    fireEvent.change(skillInput, { target: { value: "MongoDB" } })
    fireEvent.click(addButton)

    expect(screen.getByText("React")).toBeInTheDocument()
    expect(screen.getByText("Node.js")).toBeInTheDocument()
    expect(screen.getByText("MongoDB")).toBeInTheDocument()
  })

  it("should show Clear all button when filters are active", () => {
    const mockOnFilterChange = jest.fn()
    render(<UserFilterPanel onFilterChange={mockOnFilterChange} />)

    // Initially no Clear all button
    expect(screen.queryByText("Clear all")).not.toBeInTheDocument()

    // Add a role filter
    const roleSelect = screen.getByLabelText("Filter by role")
    fireEvent.change(roleSelect, { target: { value: "Student" } })

    // Clear all button should appear
    expect(screen.getByText("Clear all")).toBeInTheDocument()
  })

  it("should clear all filters when Clear all button is clicked", () => {
    const mockOnFilterChange = jest.fn()
    render(<UserFilterPanel onFilterChange={mockOnFilterChange} />)

    const roleSelect = screen.getByLabelText("Filter by role")
    const skillInput = screen.getByLabelText("Add skill filter")
    const addButton = screen.getByLabelText("Add skill")

    // Add role filter
    fireEvent.change(roleSelect, { target: { value: "Faculty" } })

    // Add skill filter
    fireEvent.change(skillInput, { target: { value: "AI" } })
    fireEvent.click(addButton)

    expect(screen.getByText("AI")).toBeInTheDocument()

    // Clear all filters
    mockOnFilterChange.mockClear()
    const clearAllButton = screen.getByText("Clear all")
    fireEvent.click(clearAllButton)

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      role: undefined,
      skills: [],
    })
    expect(screen.queryByText("AI")).not.toBeInTheDocument()
    expect((roleSelect as HTMLSelectElement).value).toBe("")
  })

  it("should combine role and skills filters", () => {
    const mockOnFilterChange = jest.fn()
    render(<UserFilterPanel onFilterChange={mockOnFilterChange} />)

    const roleSelect = screen.getByLabelText("Filter by role")
    const skillInput = screen.getByLabelText("Add skill filter")
    const addButton = screen.getByLabelText("Add skill")

    // Add role filter
    fireEvent.change(roleSelect, { target: { value: "Research Scholar" } })

    // Add skill filter
    fireEvent.change(skillInput, { target: { value: "Machine Learning" } })
    fireEvent.click(addButton)

    expect(mockOnFilterChange).toHaveBeenLastCalledWith({
      role: "Research Scholar",
      skills: ["Machine Learning"],
    })
  })

  it("should disable Add button when skill input is empty", () => {
    const mockOnFilterChange = jest.fn()
    render(<UserFilterPanel onFilterChange={mockOnFilterChange} />)

    const addButton = screen.getByLabelText("Add skill") as HTMLButtonElement

    // Initially disabled
    expect(addButton.disabled).toBe(true)

    // Enable when input has value
    const skillInput = screen.getByLabelText("Add skill filter")
    fireEvent.change(skillInput, { target: { value: "CSS" } })
    expect(addButton.disabled).toBe(false)

    // Disable again when input is cleared
    fireEvent.change(skillInput, { target: { value: "" } })
    expect(addButton.disabled).toBe(true)
  })

  it("should trim whitespace from skill input", () => {
    const mockOnFilterChange = jest.fn()
    render(<UserFilterPanel onFilterChange={mockOnFilterChange} />)

    const skillInput = screen.getByLabelText("Add skill filter")
    const addButton = screen.getByLabelText("Add skill")

    fireEvent.change(skillInput, { target: { value: "  Docker  " } })
    fireEvent.click(addButton)

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      role: undefined,
      skills: ["Docker"],
    })
    expect(screen.getByText("Docker")).toBeInTheDocument()
  })
})
