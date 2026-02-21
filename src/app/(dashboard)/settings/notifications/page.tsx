"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useEffect, useState } from "react"

export default function NotificationSettingsPage() {
  const prefs = useQuery(api.pushNotifications.getEmailPreferences)
  const subs = useQuery(api.pushNotifications.getUserSubscriptions)
  const updateEmailPrefs = useMutation(api.pushNotifications.updateEmailPreferences)
  const subscribeToPush = useMutation(api.pushNotifications.subscribeToPush)
  const unsubscribeFromPush = useMutation(api.pushNotifications.unsubscribeFromPush)

  const [emailFrequency, setEmailFrequency] = useState<"daily" | "weekly" | "never">("weekly")
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (prefs) {
      setEmailFrequency(prefs.emailDigestFrequency as "daily" | "weekly" | "never")
      setEmailNotifications(prefs.emailNotifications)
    }
  }, [prefs])

  useEffect(() => {
    if ("Notification" in window) {
      setPushPermission(Notification.permission)
    }
    if (subs && subs.length > 0) {
      setPushEnabled(true)
    }
  }, [subs])

  const handleSaveEmail = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await updateEmailPrefs({ emailDigestFrequency: emailFrequency, emailNotifications })
      setMessage("Email preferences saved.")
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Failed to save.")
    } finally {
      setSaving(false)
    }
  }

  const handleTogglePush = async () => {
    if (pushEnabled) {
      // Unsubscribe
      if (subs?.[0]) {
        try {
          await unsubscribeFromPush({ endpoint: subs[0].endpoint as string })
          setPushEnabled(false)
          setMessage("Push notifications disabled.")
        } catch (error) {
          console.error("Failed to unsubscribe from push:", error)
          setMessage("Failed to disable push notifications.")
        }
      }
      return
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setMessage("Push notifications are not supported in this browser.")
      return
    }

    try {
      const permission = await Notification.requestPermission()
      setPushPermission(permission)
      if (permission !== "granted") {
        setMessage("Permission denied. Please allow notifications in browser settings.")
        return
      }

      const reg = await navigator.serviceWorker.ready
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey).buffer as ArrayBuffer,
      })
      const json = sub.toJSON()
      await subscribeToPush({
        endpoint: sub.endpoint,
        p256dh: (json.keys as Record<string, string>)?.p256dh ?? "",
        auth: (json.keys as Record<string, string>)?.auth ?? "",
      })
      setPushEnabled(true)
      setMessage("Push notifications enabled!")
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Failed to enable push notifications.")
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Notification Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Control how and when you hear from Campus Connect.</p>
      </div>

      {message && (
        <div className="rounded-lg border border-blue-200 bg-primary/10 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
          {message}
        </div>
      )}

      {/* Push Notifications */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Push Notifications</h2>
        <div className="rounded-xl border bg-card p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Browser Push Notifications</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Receive real-time alerts for messages, mentions, and events
            </p>
            {pushPermission === "denied" && (
              <p className="text-xs text-destructive mt-1">
                Blocked by browser — change in browser settings
              </p>
            )}
          </div>
          <button
            onClick={handleTogglePush}
            disabled={pushPermission === "denied"}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-40 ${
              pushEnabled ? "bg-primary" : "bg-muted-foreground/30"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-card shadow-sm transition-transform ${
                pushEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </section>

      {/* Email Digest */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Email Digest</h2>
        <div className="rounded-xl border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Email Notifications</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Receive email alerts for important activity
              </p>
            </div>
            <button
              onClick={() => setEmailNotifications(!emailNotifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                emailNotifications ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-card shadow-sm transition-transform ${
                  emailNotifications ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Digest Frequency</p>
            <div className="flex gap-2">
              {(["daily", "weekly", "never"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setEmailFrequency(f)}
                  className={`px-3 py-1.5 rounded-lg border text-sm capitalize transition-colors ${
                    emailFrequency === f
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-muted"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {emailFrequency === "daily" && "You'll receive a digest every morning."}
              {emailFrequency === "weekly" && "You'll receive a digest every Monday."}
              {emailFrequency === "never" && "No email digests will be sent."}
            </p>
          </div>

          <button
            onClick={handleSaveEmail}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : "Save Email Preferences"}
          </button>
        </div>
      </section>
    </div>
  )
}

// ── Utility ───────────────────────────────────
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
