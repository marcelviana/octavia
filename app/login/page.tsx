import { LoginForm } from "@/components/auth/login-form"
import Image from "next/image"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#fff9f0]">
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Image src="/logos/octavia-logo-full.png" alt="Octavia" width={200} height={80} className="mx-auto" />
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Welcome back to Octavia</h1>
            <p className="mt-2 text-gray-600">Your digital music companion</p>
          </div>
          <LoginForm />
        </div>
      </div>
      <div className="hidden md:flex md:flex-1 bg-blue-600 relative">
        <div className="absolute inset-0 bg-black bg-opacity-30 flex flex-col items-center justify-center text-white p-12">
          <h2 className="text-3xl font-bold mb-4">Organize your music, anywhere</h2>
          <p className="text-lg max-w-md text-center">
            Access your sheet music, tabs, and lyrics from any device. Perfect for rehearsals and performances.
          </p>
        </div>
        <Image src="/placeholder.svg?height=1080&width=1080" alt="Musician" fill className="object-cover" priority />
      </div>
    </div>
  )
}
