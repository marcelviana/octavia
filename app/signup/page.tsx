import Image from "next/image"
import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { isSupabaseConfigured } from "@/lib/supabase"
import { SignupPanel } from "@/components/auth/signup-panel"
import { Music } from "lucide-react"

export default async function SignupPage() {
  let session = null
  if (isSupabaseConfigured) {
    const supabase = await getSupabaseServerClient()
    const {
      data: { session: supabaseSession },
    } = await supabase.auth.getSession()
    session = supabaseSession
  }

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-amber-50 to-orange-100">
      <SignupPanel />
      <div className="hidden md:flex md:flex-1 bg-amber-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/90 to-orange-700/90 z-10"></div>
        <div className="absolute inset-0 bg-[url('/placeholder.svg?height=1080&width=1080')] bg-cover bg-center"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-12 z-20">
          <div className="max-w-md">
            <h2 className="text-4xl font-bold mb-6 leading-tight">Start your musical journey</h2>
            <p className="text-lg mb-8">
              Join thousands of musicians who use Octavia to organize their music and enhance their performances.
            </p>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-white/30 rounded-full p-2 mt-1">
                  <Music className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl">Organize Your Music</h3>
                  <p className="text-white/80">Keep all your sheet music, tabs, and lyrics in one place.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-white/30 rounded-full p-2 mt-1">
                  <Music className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl">Create Setlists</h3>
                  <p className="text-white/80">Plan your performances with customizable setlists.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-white/30 rounded-full p-2 mt-1">
                  <Music className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl">Access Anywhere</h3>
                  <p className="text-white/80">Your music library is available on all your devices.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
