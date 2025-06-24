"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createContentFilesBucket } from "@/lib/setup-storage"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function SetupPage() {
  const [isCreating, setIsCreating] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleCreateBucket = async () => {
    setIsCreating(true)
    setResult(null)
    
    try {
      const result = await createContentFilesBucket()
      
      if (result.success) {
        setResult({ 
          success: true, 
          message: 'Storage bucket "content-files" is ready! You can now upload sheet music files.' 
        })
      } else {
        setResult({ 
          success: false, 
          message: `Failed to create bucket: ${result.error?.message || 'Unknown error'}` 
        })
      }
    } catch (error) {
      setResult({ 
        success: false, 
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto pt-20">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Octavia Setup
            </CardTitle>
            <p className="text-center text-gray-600">
              Set up your storage bucket for file uploads
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-sm text-gray-700 space-y-2">
              <p>
                <strong>What this does:</strong> Creates a storage bucket called &ldquo;content-files&rdquo; 
                in your Supabase project to store uploaded sheet music files.
              </p>
              <p>
                <strong>Requirements:</strong> You need to be connected to your Supabase project 
                with proper credentials.
              </p>
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-amber-800 font-medium">🔒 Secure Firebase Auth + Supabase Storage</p>
                <p className="text-amber-700 text-sm mb-2">
                  This app uses <strong>Firebase Auth</strong> for user authentication and <strong>Supabase Storage</strong> for file storage.
                  All uploads go through secure API endpoints that validate Firebase tokens server-side before uploading to Supabase.
                </p>
                <p className="text-amber-700 text-sm">
                  File uploads will not work until you complete this setup process.
                  If you see 400 errors or permission errors when uploading, this is the cause.
                </p>
              </div>
            </div>

            <Button 
              onClick={handleCreateBucket}
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating bucket...
                </>
              ) : (
                "Create Storage Bucket"
              )}
            </Button>

            {result && (
              <div className={`flex items-start space-x-3 p-4 rounded-lg ${
                result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    {result.success ? 'Success!' : 'Error'}
                  </p>
                  <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                    {result.message}
                  </p>
                </div>
              </div>
            )}

            <div className="border-t pt-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Step 2: Storage Policies (Required)</h3>
                <p className="text-sm text-gray-600 mb-3">
                  After creating the bucket, you need to set up storage policies to allow uploads:
                </p>
                <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside mb-4">
                  <li>Go to your Supabase project dashboard</li>
                  <li>Navigate to <strong>Storage</strong> → <strong>Policies</strong></li>
                  <li>Click <strong>&ldquo;New Policy&rdquo;</strong> for the <strong>Objects</strong> table</li>
                  <li>Select <strong>&ldquo;Create a policy from template&rdquo;</strong></li>
                  <li>Choose <strong>&ldquo;Allow access to uploads for authenticated users&rdquo;</strong></li>
                  <li>Click <strong>&ldquo;Use this template&rdquo;</strong></li>
                  <li>Update the policy to target the <code className="bg-gray-100 px-1 rounded">content-files</code> bucket</li>
                  <li>Click <strong>&ldquo;Save Policy&rdquo;</strong></li>
                </ol>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Quick SQL Setup (Recommended)</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Copy and paste these SQL commands in your Supabase SQL Editor to set up storage policies:
                  </p>
                  <div className="bg-blue-100 p-3 rounded text-xs overflow-x-auto">
                    <pre className="whitespace-pre-wrap">
{`-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Since we're using Firebase Auth with secure API endpoints,
-- we allow service role access (API routes authenticate users server-side)
CREATE POLICY "Allow service role access to content-files" ON storage.objects
FOR ALL USING (
  bucket_id = 'content-files' AND auth.role() = 'service_role'
);

-- Allow public read access to files (so uploaded content can be viewed)
CREATE POLICY "Allow public read access to content-files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'content-files'
);`}
                    </pre>
                  </div>
                  <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded">
                    <p className="text-xs text-amber-800 mb-2">
                      <strong>💡 Tip:</strong> If you get &ldquo;policy already exists&rdquo; errors, that&apos;s normal - it means the policies are already set up.
                    </p>
                    <p className="text-xs text-amber-800">
                      <strong>🔑 Service Key:</strong> Make sure your <code className="bg-amber-100 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> environment variable is set for server-side storage operations.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Manual Bucket Setup (Alternative)</h3>
                <p className="text-sm text-gray-600 mb-3">
                  If the automatic bucket creation doesn&apos;t work:
                </p>
                <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                  <li>Go to your Supabase project dashboard</li>
                  <li>Navigate to <strong>Storage</strong> in the sidebar</li>
                  <li>Click <strong>&ldquo;New Bucket&rdquo;</strong></li>
                  <li>Name it <code className="bg-gray-100 px-1 rounded">content-files</code></li>
                  <li>Set it to <strong>Public</strong></li>
                  <li>Click <strong>&ldquo;Create Bucket&rdquo;</strong></li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 