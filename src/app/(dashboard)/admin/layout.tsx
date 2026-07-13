import { ReactNode } from "react"
import Link from "next/link"
import { LayoutDashboard, Users, ShieldAlert } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/sign-in")
  }

  const { data: userData } = await supabase.from("users").select("role, is_admin").eq("id", user.id).single()

  if (!userData || (!userData.is_admin && userData.role !== "admin")) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="max-w-xl text-center text-muted-foreground bg-card p-12 border rounded-lg shadow-sm">
          <ShieldAlert className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h3 className="text-2xl font-bold text-foreground">Access Denied</h3>
          <p className="mt-2">You do not have administrative privileges to view this area.</p>
          <Link href="/feed" className="mt-6 inline-block text-primary hover:underline">
            &larr; Return to Feed
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 border-r bg-card shrink-0">
        <div className="p-4 border-b">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-primary" />
            Admin Panel
          </h2>
        </div>
        <nav className="p-4 space-y-1">
          <Link 
            href="/admin/dashboard" 
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            Overview
          </Link>
          <Link 
            href="/admin/users" 
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium transition-colors"
          >
            <Users className="w-4 h-4" />
            User Management
          </Link>
          <Link 
            href="/admin/moderation" 
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium transition-colors"
          >
            <ShieldAlert className="w-4 h-4 text-red-500" />
            Moderation Queue
          </Link>
        </nav>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 min-w-0 bg-background overflow-auto">
        {children}
      </main>
    </div>
  )
}
