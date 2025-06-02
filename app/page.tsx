"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { Music, FileText, Guitar, Users } from "lucide-react"

export default function LandingPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fffcf7]">
        <div className="animate-pulse">
          <Image src="/logos/octavia-logo-full.png" alt="Octavia" width={200} height={80} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fffcf7]">
      {/* Header */}
      <header className="border-b border-[#A69B8E] bg-[#fff9f0]">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Image src="/logos/octavia-icon.png" alt="Octavia" width={32} height={32} />
            <Image src="/logos/octavia-wordmark.png" alt="Octavia" width={120} height={24} />
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Your Music Library, <span className="text-[#2E7CE4]">Digitized</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Organize, visualize, and share your sheet music, tabs, and lyrics. Perfect for rehearsals and
                performances.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Button size="lg" asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 md:pl-10">
              <div className="relative">
                <Image
                  src="/placeholder.svg?height=400&width=600"
                  alt="Musician with digital sheet music"
                  width={600}
                  height={400}
                  className="rounded-lg shadow-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Musicians Choose Octavia</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-[#fff9f0] p-6 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Music className="w-6 h-6 text-[#2E7CE4]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Digital Sheet Music</h3>
              <p className="text-gray-600">Import and organize all your sheet music, tabs, and lyrics in one place.</p>
            </div>
            <div className="bg-[#fff9f0] p-6 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-[#2E7CE4]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Setlist Management</h3>
              <p className="text-gray-600">Create and manage setlists for different venues and performances.</p>
            </div>
            <div className="bg-[#fff9f0] p-6 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Guitar className="w-6 h-6 text-[#2E7CE4]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Performance Mode</h3>
              <p className="text-gray-600">Distraction-free interface optimized for live performances.</p>
            </div>
            <div className="bg-[#fff9f0] p-6 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-[#2E7CE4]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Multi-User Access</h3>
              <p className="text-gray-600">Secure access to your personal music library from any device.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-[#F2EDE5]">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What Musicians Say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote:
                  "Octavia has completely transformed how I prepare for gigs. No more heavy binders of sheet music!",
                name: "Sarah Johnson",
                role: "Professional Guitarist",
              },
              {
                quote:
                  "The performance mode is a game-changer for live shows. Easy navigation between songs with no distractions.",
                name: "Michael Chen",
                role: "Keyboard Player",
              },
              {
                quote:
                  "I can access all my music on any device. Perfect for last-minute rehearsals and impromptu jam sessions.",
                name: "David Rodriguez",
                role: "Band Director",
              },
            ].map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                <p className="text-gray-600 italic mb-4">"{testimonial.quote}"</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="font-semibold text-[#2E7CE4]">{testimonial.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#2E7CE4] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Organize Your Music?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of musicians who use Octavia to manage their sheet music, tabs, and lyrics.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/signup">Create Free Account</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-[#2E7CE4]"
              asChild
            >
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center space-x-2 mb-4">
                <Image src="/logos/octavia-icon.png" alt="Octavia" width={32} height={32} />
                <Image
                  src="/logos/octavia-wordmark.png"
                  alt="Octavia"
                  width={120}
                  height={24}
                  className="brightness-200"
                />
              </div>
              <p className="text-gray-400 max-w-xs">Your digital music companion for rehearsals and performances.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-semibold mb-4">Product</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="text-gray-400 hover:text-white">
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-400 hover:text-white">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-400 hover:text-white">
                      FAQ
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Company</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="text-gray-400 hover:text-white">
                      About
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-400 hover:text-white">
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-400 hover:text-white">
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Legal</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="text-gray-400 hover:text-white">
                      Privacy
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-400 hover:text-white">
                      Terms
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Octavia. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
