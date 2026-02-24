import "@testing-library/jest-dom"
import { render, screen } from "@testing-library/react"
import SettingsPage from "./page"

// Mock next/navigation (settings page uses useSearchParams)
jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(() => ({ get: jest.fn().mockReturnValue(null) })),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  usePathname: jest.fn(() => "/settings"),
}))

// Mock the v2 settings sub-components
jest.mock("../../(components)/settings/SettingsNav", () => ({
  SettingsNav: () => <nav data-testid="settings-nav">Settings Navigation</nav>,
}))

jest.mock("../../(components)/settings/ProfileSettings", () => ({
  ProfileSettings: () => <div data-testid="profile-settings">Profile Settings</div>,
}))

jest.mock("../../(components)/settings/AccountSettings", () => ({
  AccountSettings: () => <div data-testid="account-settings">Account Settings</div>,
}))

jest.mock("../../(components)/settings/PrivacySettings", () => ({
  PrivacySettings: () => <div data-testid="privacy-settings">Privacy Settings</div>,
}))

jest.mock("../../(components)/settings/NotificationSettings", () => ({
  NotificationSettings: () => <div data-testid="notification-settings">Notification Settings</div>,
}))

jest.mock("../../(components)/settings/BillingSettings", () => ({
  BillingSettings: () => <div data-testid="billing-settings">Billing Settings</div>,
}))

describe("SettingsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should render settings navigation", () => {
    const { useSearchParams } = require("next/navigation")
    useSearchParams.mockReturnValue({ get: jest.fn().mockReturnValue(null) })

    render(<SettingsPage />)

    expect(screen.getByTestId("settings-nav")).toBeInTheDocument()
  })

  it("should render profile settings by default (no tab param)", () => {
    const { useSearchParams } = require("next/navigation")
    useSearchParams.mockReturnValue({ get: jest.fn().mockReturnValue(null) })

    render(<SettingsPage />)

    expect(screen.getByTestId("profile-settings")).toBeInTheDocument()
  })

  it("should render account settings when tab=account", () => {
    const { useSearchParams } = require("next/navigation")
    useSearchParams.mockReturnValue({ get: jest.fn().mockReturnValue("account") })

    render(<SettingsPage />)

    expect(screen.getByTestId("account-settings")).toBeInTheDocument()
  })

  it("should render privacy settings when tab=privacy", () => {
    const { useSearchParams } = require("next/navigation")
    useSearchParams.mockReturnValue({ get: jest.fn().mockReturnValue("privacy") })

    render(<SettingsPage />)

    expect(screen.getByTestId("privacy-settings")).toBeInTheDocument()
  })

  it("should render notification settings when tab=notifications", () => {
    const { useSearchParams } = require("next/navigation")
    useSearchParams.mockReturnValue({ get: jest.fn().mockReturnValue("notifications") })

    render(<SettingsPage />)

    expect(screen.getByTestId("notification-settings")).toBeInTheDocument()
  })

  it("should render billing settings when tab=billing", () => {
    const { useSearchParams } = require("next/navigation")
    useSearchParams.mockReturnValue({ get: jest.fn().mockReturnValue("billing") })

    render(<SettingsPage />)

    expect(screen.getByTestId("billing-settings")).toBeInTheDocument()
  })
})

