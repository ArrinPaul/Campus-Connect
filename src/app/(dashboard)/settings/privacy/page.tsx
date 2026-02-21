"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Download, Trash2, AlertTriangle, FileJson } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ButtonLoadingSpinner } from "@/components/ui/loading-skeleton"
import { useRouter } from "next/navigation"

/**
 * Privacy & Data Settings Page
 * GDPR Compliance: Data Export & Account Deletion
 */
export default function PrivacySettingsPage() {
  const router = useRouter()
  const exportData = useMutation(api.users.exportUserData)
  const deleteAccount = useMutation(api.users.deleteAccount)

  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")

  /**
   * Export all user data as JSON file
   */
  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const data = await exportData()

      // Create JSON blob and download
      const jsonString = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonString], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement("a")
      link.href = url
      link.download = `campus-connect-data-${Date.now()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)

      toast.success("Data exported successfully", {
        description: "Your data has been downloaded as a JSON file",
      })
    } catch (error) {
      toast.error("Failed to export data", {
        description: error instanceof Error ? error.message : "Please try again later",
      })
    } finally {
      setIsExporting(false)
    }
  }

  /**
   * Permanently delete account and all data
   */
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm")
      return
    }

    setIsDeleting(true)
    try {
      await deleteAccount()

      toast.success("Account deleted successfully", {
        description: "Your account and all data have been permanently deleted",
      })

      // Redirect to sign-out page after brief delay
      setTimeout(() => {
        window.location.href = "/sign-out"
      }, 2000)
    } catch (error) {
      toast.error("Failed to delete account", {
        description: error instanceof Error ? error.message : "Please try again later",
      })
      setIsDeleting(false)
    }
  }

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Privacy & Data</h1>
        <p className="text-muted-foreground mt-2">
          Manage your personal data and account privacy
        </p>
      </div>

      {/* Data Export Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileJson className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle>Export Your Data</CardTitle>
              <CardDescription className="mt-1.5">
                Download a copy of all your data including posts, comments, messages, bookmarks, and more.
                The data will be provided in JSON format.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">Your export will include:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Profile information</li>
                <li>All posts and comments</li>
                <li>Bookmarks and likes</li>
                <li>Messages and conversations</li>
                <li>Following and followers list</li>
                <li>Notification history</li>
              </ul>
            </div>
            
            <Button
              onClick={handleExportData}
              disabled={isExporting}
              variant="outline"
              className="w-full sm:w-auto"
            >
              {isExporting ? (
                <>
                  <ButtonLoadingSpinner />
                  Preparing export...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download My Data
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Deletion Card */}
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-destructive">Delete Account</CardTitle>
              <CardDescription className="mt-1.5">
                Permanently delete your account and all associated data. This action cannot be undone.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg bg-destructive/10 p-4 text-sm">
              <p className="font-semibold text-destructive mb-2">⚠️ Warning: This will permanently delete:</p>
              <ul className="list-disc list-inside space-y-1 ml-2 text-destructive/90">
                <li>Your profile and all personal information</li>
                <li>All posts, comments, and reactions</li>
                <li>All messages and conversations</li>
                <li>All bookmarks and saved content</li>
                <li>Community memberships and event RSVPs</li>
                <li>Follower and following relationships</li>
              </ul>
              <p className="mt-3 font-medium text-destructive">
                This action is <span className="underline">irreversible</span>. Consider exporting your data first.
              </p>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full sm:w-auto"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <ButtonLoadingSpinner />
                      Deleting account...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete My Account
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Are you absolutely sure?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3">
                    <p>
                      This action <strong className="text-destructive">cannot be undone</strong>. 
                      This will permanently delete your account and remove all your data from our servers.
                    </p>
                    <div className="space-y-2">
                      <label htmlFor="confirmText" className="text-sm font-medium text-foreground">
                        Type <span className="font-mono font-bold">DELETE</span> to confirm:
                      </label>
                      <input
                        id="confirmText"
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:border-destructive focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2"
                        placeholder="Type DELETE"
                        autoComplete="off"
                      />
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== "DELETE" || isDeleting}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {isDeleting ? (
                      <>
                        <ButtonLoadingSpinner />
                        Deleting...
                      </>
                    ) : (
                      "Delete Account"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* GDPR Notice */}
      <div className="rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
        <p className="font-medium mb-2">Your Privacy Rights</p>
        <p>
          Under GDPR and other data protection laws, you have the right to access, export, and delete your personal data.
          If you have any questions or concerns about your data, please contact us at{" "}
          <a href="mailto:privacy@campusconnect.com" className="text-primary hover:underline">
            privacy@campusconnect.com
          </a>
        </p>
      </div>
    </div>
  )
}
