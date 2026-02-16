import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ProfileForm } from "./ProfileForm"

// Mock Convex
jest.mock("convex/react", () => ({
  useMutation: jest.fn(() => jest.fn()),
}))

// Mock validations
jest.mock("../../../lib/validations", () => ({
  validateBio: jest.fn((bio: string) => {
    if (bio.length > 500) {
      return { valid: false, error: "Bio must not exceed 500 characters" }
    }
    return { valid: true }
  }),
  validateUniversity: jest.fn((university: string) => {
    if (university.length > 200) {
      return {
        valid: false,
        error: "University name must not exceed 200 characters",
      }
    }
    return { valid: true }
  }),
  validateRole: jest.fn(() => ({ valid: true })),
  validateExperienceLevel: jest.fn(() => ({ valid: true })),
}))

describe("ProfileForm", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should render all form fields", () => {
    render(<ProfileForm />)

    expect(screen.getByLabelText(/bio/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/university/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^role$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/experience level/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/github/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/linkedin/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/twitter/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/website/i)).toBeInTheDocument()
  })

  it("should display initial data when provided", () => {
    const initialData = {
      bio: "Test bio",
      university: "Test University",
      role: "Student" as const,
      experienceLevel: "Intermediate" as const,
      socialLinks: {
        github: "https://github.com/test",
      },
    }

    render(<ProfileForm initialData={initialData} />)

    expect(screen.getByLabelText(/bio/i)).toHaveValue("Test bio")
    expect(screen.getByLabelText(/university/i)).toHaveValue("Test University")
    expect(screen.getByLabelText(/^role$/i)).toHaveValue("Student")
    expect(screen.getByLabelText(/experience level/i)).toHaveValue("Intermediate")
    expect(screen.getByLabelText(/github/i)).toHaveValue("https://github.com/test")
  })

  it("should show character count for bio", () => {
    render(<ProfileForm />)

    const bioInput = screen.getByLabelText(/bio/i)
    fireEvent.change(bioInput, { target: { value: "Test bio" } })

    expect(screen.getByText("8/500")).toBeInTheDocument()
  })

  it("should show character count for university", () => {
    render(<ProfileForm />)

    const universityInput = screen.getByLabelText(/university/i)
    fireEvent.change(universityInput, { target: { value: "Test University" } })

    expect(screen.getByText("15/200")).toBeInTheDocument()
  })

  it("should validate bio length on submit", async () => {
    const { validateBio } = require("../../../lib/validations")
    validateBio.mockReturnValueOnce({
      valid: false,
      error: "Bio must not exceed 500 characters",
    })

    render(<ProfileForm />)

    const bioInput = screen.getByLabelText(/bio/i)
    fireEvent.change(bioInput, { target: { value: "a".repeat(501) } })

    const submitButton = screen.getByRole("button", { name: /save profile/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText("Bio must not exceed 500 characters")
      ).toBeInTheDocument()
    })
  })

  it("should validate university length on submit", async () => {
    const { validateUniversity } = require("../../../lib/validations")
    validateUniversity.mockReturnValueOnce({
      valid: false,
      error: "University name must not exceed 200 characters",
    })

    render(<ProfileForm />)

    const universityInput = screen.getByLabelText(/university/i)
    fireEvent.change(universityInput, { target: { value: "a".repeat(201) } })

    const submitButton = screen.getByRole("button", { name: /save profile/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText("University name must not exceed 200 characters")
      ).toBeInTheDocument()
    })
  })

  it("should call onSave callback after successful submission", async () => {
    const { useMutation } = require("convex/react")
    const mockUpdateProfile = jest.fn().mockResolvedValue(undefined)
    useMutation.mockReturnValue(mockUpdateProfile)

    const onSave = jest.fn()
    render(<ProfileForm onSave={onSave} />)

    const submitButton = screen.getByRole("button", { name: /save profile/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled()
    })
  })

  it("should display success message after successful submission", async () => {
    const { useMutation } = require("convex/react")
    const mockUpdateProfile = jest.fn().mockResolvedValue(undefined)
    useMutation.mockReturnValue(mockUpdateProfile)

    render(<ProfileForm />)

    const submitButton = screen.getByRole("button", { name: /save profile/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText("Profile updated successfully!")).toBeInTheDocument()
    })
  })

  it("should disable submit button while submitting", async () => {
    const { useMutation } = require("convex/react")
    const mockUpdateProfile = jest
      .fn()
      .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)))
    useMutation.mockReturnValue(mockUpdateProfile)

    render(<ProfileForm />)

    const submitButton = screen.getByRole("button", { name: /save profile/i })
    fireEvent.click(submitButton)

    expect(submitButton).toBeDisabled()
    expect(screen.getByText("Saving...")).toBeInTheDocument()
  })

  it("should display profile picture preview when image is selected", async () => {
    render(<ProfileForm />)

    const file = new File(["test"], "test.png", { type: "image/png" })
    const input = screen.getByLabelText(/profile picture/i) as HTMLInputElement

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      const preview = screen.getByAltText("Profile preview")
      expect(preview).toBeInTheDocument()
    })
  })

  it("should validate image file type", async () => {
    render(<ProfileForm />)

    const file = new File(["test"], "test.txt", { type: "text/plain" })
    const input = screen.getByLabelText(/profile picture/i) as HTMLInputElement

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText("Please select an image file")).toBeInTheDocument()
    })
  })

  it("should validate image file size", async () => {
    render(<ProfileForm />)

    // Create a file larger than 5MB
    const largeFile = new File(["x".repeat(6 * 1024 * 1024)], "large.png", {
      type: "image/png",
    })
    const input = screen.getByLabelText(/profile picture/i) as HTMLInputElement

    fireEvent.change(input, { target: { files: [largeFile] } })

    await waitFor(() => {
      expect(
        screen.getByText("Image size must be less than 5MB")
      ).toBeInTheDocument()
    })
  })
})
