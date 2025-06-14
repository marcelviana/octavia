import Image from "next/image"
import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { LoginPanel } from "@/components/auth/login-panel"
import { Music } from "lucide-react"

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect("/dashboard")
  }

  const errorDescription = await Promise.resolve(searchParams?.error_description)
  const error = typeof errorDescription === "string" ? errorDescription : ""

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-amber-50 to-orange-100">
      <LoginPanel initialError={error} />
      <div className="hidden md:flex md:flex-1 bg-amber-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/90 to-orange-700/90 z-10"></div>
        <div className="absolute inset-0 bg-[url('/placeholder.svg?height=1080&width=1080')] bg-cover bg-center"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-12 z-20">
          <div className="max-w-md text-center">
            <h2 className="text-4xl font-bold mb-6 leading-tight">Your music, organized and accessible</h2>
            <p className="text-lg mb-8">
              Access your sheet music, tabs, and lyrics from any device. Perfect for rehearsals and performances.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg flex items-center space-x-3 w-48">
                <div className="bg-white/30 rounded-full p-2">
                  <Music className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium">Sheet Music</h3>
                  <p className="text-xs text-white/80">Organize & annotate</p>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg flex items-center space-x-3 w-48">
                <div className="bg-white/30 rounded-full p-2">
                  <Music className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium">Chord Charts</h3>
                  <p className="text-xs text-white/80">Quick reference</p>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg flex items-center space-x-3 w-48">
                <div className="bg-white/30 rounded-full p-2">
                  <Music className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium">Lyrics</h3>
                  <p className="text-xs text-white/80">Never forget words</p>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg flex items-center space-x-3 w-48">
                <div className="bg-white/30 rounded-full p-2">
                  <Music className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium">Setlists</h3>
                  <p className="text-xs text-white/80">Plan performances</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
