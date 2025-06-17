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
                <strong>What this does:</strong> Creates a storage bucket called "content-files" 
                in your Supabase project to store uploaded sheet music files.
              </p>
              <p>
                <strong>Requirements:</strong> You need to be connected to your Supabase project 
                with proper credentials.
              </p>
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
                  <li>Click <strong>"New Policy"</strong> for the <strong>Objects</strong> table</li>
                  <li>Select <strong>"Create a policy from template"</strong></li>
                  <li>Choose <strong>"Allow access to uploads for authenticated users"</strong></li>
                  <li>Click <strong>"Use this template"</strong></li>
                  <li>Update the policy to target the <code className="bg-gray-100 px-1 rounded">content-files</code> bucket</li>
                  <li>Click <strong>"Save Policy"</strong></li>
                </ol>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Quick SQL Setup (Advanced)</h4>
                  <p className="text-sm text-blue-700 mb-2">
                    Alternatively, run this SQL in your Supabase SQL Editor:
                  </p>
                  <pre className="bg-blue-100 p-3 rounded text-xs overflow-x-auto">
{`-- Allow authenticated users to upload to content-files bucket
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND 
  bucket_id = 'content-files'
);

-- Allow public access to view files
CREATE POLICY "Allow public access" ON storage.objects
FOR SELECT USING (bucket_id = 'content-files');`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Manual Bucket Setup (Alternative)</h3>
                <p className="text-sm text-gray-600 mb-3">
                  If the automatic bucket creation doesn't work:
                </p>
                <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                  <li>Go to your Supabase project dashboard</li>
                  <li>Navigate to <strong>Storage</strong> in the sidebar</li>
                  <li>Click <strong>"New Bucket"</strong></li>
                  <li>Name it <code className="bg-gray-100 px-1 rounded">content-files</code></li>
                  <li>Set it to <strong>Public</strong></li>
                  <li>Click <strong>"Create Bucket"</strong></li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 