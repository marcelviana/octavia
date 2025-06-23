import { redirect } from "next/navigation"
import { getServerSideUser } from "@/lib/firebase-server-utils"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { Music, FileText, Guitar, Users } from "lucide-react"

export default async function LandingPage() {
  const user = await getServerSideUser()
  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Header */}
      <header className="border-b border-amber-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Image src="/logos/octavia-icon.png" alt="Octavia" width={32} height={32} />
            <Image src="/logos/octavia-wordmark.png" alt="Octavia" width={120} height={24} className="w-[120px] h-auto" />
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="text-amber-700 hover:text-amber-900 hover:bg-amber-100" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg"
              asChild
            >
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-100/20 to-orange-100/20"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-amber-200/30 to-orange-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-red-200/30 to-pink-200/30 rounded-full blur-3xl"></div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <div className="inline-block px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full text-amber-800 font-medium mb-6 border border-amber-200">
                🎵 Digital Music Revolution
              </div>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-amber-800 to-orange-800 bg-clip-text text-transparent mb-6 leading-tight">
                Your Music Library,{" "}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Digitized
                </span>
              </h1>
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                Organize, visualize, and share your sheet music, tabs, and lyrics. Perfect for rehearsals and
                performances with a modern, intuitive interface.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl transform hover:scale-105 transition-all duration-200"
                  asChild
                >
                  <Link href="/signup">Get Started Free</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400 shadow-lg"
                  asChild
                >
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 md:pl-10">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-amber-200 to-orange-200 rounded-2xl blur-2xl opacity-30"></div>
                <Image
                  src="/images/band-hero.webp"
                  alt="Musician performing with digital sheet music on tablet"
                  width={600}
                  height={400}
                  className="rounded-2xl shadow-2xl object-cover relative z-10 border-4 border-white/50"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gradient-to-r from-white via-amber-50/50 to-orange-50/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-amber-800 bg-clip-text text-transparent mb-4">
              Why Musicians Choose Octavia
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed by musicians, for musicians
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-blue-200">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <Music className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Digital Sheet Music</h3>
              <p className="text-gray-700 leading-relaxed">
                Import and organize all your sheet music, tabs, and lyrics in one beautiful, searchable library.
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-green-200">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Setlist Management</h3>
              <p className="text-gray-700 leading-relaxed">
                Create and manage dynamic setlists for different venues, audiences, and performance styles.
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-purple-200">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <Guitar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Performance Mode</h3>
              <p className="text-gray-700 leading-relaxed">
                Distraction-free interface optimized for live performances with large, readable text.
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-red-100 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-orange-200">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Multi-User Access</h3>
              <p className="text-gray-700 leading-relaxed">
                Secure, cloud-based access to your personal music library from any device, anywhere.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-br from-amber-100 via-orange-100 to-red-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-200/20 to-orange-200/20"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-amber-800 bg-clip-text text-transparent mb-4">
              What Musicians Say
            </h2>
            <p className="text-xl text-gray-700">Real feedback from real musicians</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote:
                  "Octavia has completely transformed how I prepare for gigs. No more heavy binders of sheet music!",
                name: "Sarah Johnson",
                role: "Professional Guitarist",
                color: "from-blue-500 to-purple-500",
              },
              {
                quote:
                  "The performance mode is a game-changer for live shows. Easy navigation between songs with no distractions.",
                name: "Michael Chen",
                role: "Keyboard Player",
                color: "from-green-500 to-emerald-500",
              },
              {
                quote:
                  "I can access all my music on any device. Perfect for last-minute rehearsals and impromptu jam sessions.",
                name: "David Rodriguez",
                role: "Band Director",
                color: "from-orange-500 to-red-500",
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-white/50"
              >
                <p className="text-gray-700 italic mb-6 text-lg leading-relaxed">&quot;{testimonial.quote}&quot;</p>
                <div className="flex items-center">
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${testimonial.color} rounded-full flex items-center justify-center mr-4 shadow-lg`}
                  >
                    <span className="font-bold text-white text-lg">{testimonial.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{testimonial.name}</p>
                    <p className="text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-800/20 to-purple-800/20"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-300/20 rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Organize Your Music?</h2>
          <p className="text-xl mb-10 max-w-3xl mx-auto leading-relaxed opacity-90">
            Join thousands of musicians who use Octavia to manage their sheet music, tabs, and lyrics with style and
            efficiency.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 shadow-xl transform hover:scale-105 transition-all duration-200 px-8 py-4 text-lg font-semibold"
              asChild
            >
              <Link href="/signup">Create Free Account</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 shadow-xl transform hover:scale-105 transition-all duration-200 px-8 py-4 text-lg font-semibold"
              asChild
            >
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center space-x-2 mb-6">
                <Image src="/logos/octavia-icon.png" alt="Octavia" width={32} height={32} />
                <Image
                  src="/logos/octavia-wordmark.png"
                  alt="Octavia"
                  width={120}
                  height={24}
                  className="brightness-200 w-[120px] h-auto"
                />
              </div>
              <p className="text-gray-300 max-w-xs leading-relaxed">
                Your digital music companion for rehearsals and performances.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-bold mb-4 text-amber-400">Product</h3>
                <ul className="space-y-3">
                  <li>
                    <Link href="#" className="text-gray-300 hover:text-amber-400 transition-colors">
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-300 hover:text-amber-400 transition-colors">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-300 hover:text-amber-400 transition-colors">
                      FAQ
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-4 text-amber-400">Company</h3>
                <ul className="space-y-3">
                  <li>
                    <Link href="#" className="text-gray-300 hover:text-amber-400 transition-colors">
                      About
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-300 hover:text-amber-400 transition-colors">
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-300 hover:text-amber-400 transition-colors">
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-4 text-amber-400">Legal</h3>
                <ul className="space-y-3">
                  <li>
                    <Link
                      href="/privacy-policy"
                      className="text-gray-300 hover:text-amber-400 transition-colors"
                    >
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-300 hover:text-amber-400 transition-colors">
                      Terms
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Octavia. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
