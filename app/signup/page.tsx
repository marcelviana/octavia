import Image from "next/image"
import { redirect } from "next/navigation"
import { getServerSideUser } from "@/lib/firebase-server-utils"
import { cookies } from "next/headers"
import { SignupPanel } from "@/components/auth/signup-panel"
import { Music } from "lucide-react"

export default async function SignupPage() {
  const user = await getServerSideUser(await cookies())

  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-amber-50 to-orange-100">
      <SignupPanel />
      <div className="hidden md:flex md:flex-1 bg-amber-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/90 to-orange-700/90 z-10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-16 right-16 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute top-52 left-16 w-64 h-64 bg-orange-300/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-16 right-32 w-96 h-96 bg-amber-300/15 rounded-full blur-3xl"></div>
          <div className="absolute bottom-40 left-20 w-48 h-48 bg-yellow-300/10 rounded-full blur-2xl"></div>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-12 z-20">
          <div className="max-w-md text-center">
            <h2 className="text-4xl font-bold mb-6 leading-tight">Start Your Musical Journey</h2>
            <p className="text-lg mb-8">
              Join thousands of musicians who trust Octavia to organize their musical content and enhance their practice sessions.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg flex items-center space-x-3 w-48">
                <div className="bg-white/30 rounded-full p-2">
                  <Music className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium">Upload Music</h3>
                  <p className="text-xs text-white/80">PDF, images & more</p>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg flex items-center space-x-3 w-48">
                <div className="bg-white/30 rounded-full p-2">
                  <Music className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium">Organize</h3>
                  <p className="text-xs text-white/80">Smart categorization</p>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg flex items-center space-x-3 w-48">
                <div className="bg-white/30 rounded-full p-2">
                  <Music className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium">Perform</h3>
                  <p className="text-xs text-white/80">Distraction-free mode</p>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg flex items-center space-x-3 w-48">
                <div className="bg-white/30 rounded-full p-2">
                  <Music className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium">Access</h3>
                  <p className="text-xs text-white/80">Any device, anywhere</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
