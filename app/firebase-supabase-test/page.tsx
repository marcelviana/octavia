"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, XCircle, Loader2, Play, User, Database, Shield, LogIn, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/firebase-auth-context'

export default function FirebaseSupabaseTestPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<Record<string, any>>({})
  const [testEmail, setTestEmail] = useState('test@example.com')
  const [testPassword, setTestPassword] = useState('testpassword123')
  
  const { 
    user, 
    profile, 
    idToken, 
    isConfigured, 
    isInitialized,
    signIn, 
    signUp, 
    signOut,
    updateProfile 
  } = useAuth()

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    setIsLoading(true)
    try {
      const result = await testFunction()
      setTestResults(prev => ({ 
        ...prev, 
        [testName]: { 
          success: true, 
          data: result,
          timestamp: new Date().toISOString()
        } 
      }))
    } catch (error: any) {
      setTestResults(prev => ({ 
        ...prev, 
        [testName]: { 
          success: false, 
          error: error.message || 'Unknown error',
          timestamp: new Date().toISOString()
        } 
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const testProfileAPI = async () => {
    if (!idToken) throw new Error('No auth token available')
    
    const response = await fetch('/api/profile', {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    })
    
    if (!response.ok) {
      throw new Error(`Profile API failed: ${response.status}`)
    }
    
    return await response.json()
  }

  const testContentAPI = async () => {
    if (!idToken) throw new Error('No auth token available')
    
    const response = await fetch('/api/content', {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    })
    
    if (!response.ok) {
      throw new Error(`Content API failed: ${response.status}`)
    }
    
    return await response.json()
  }

  const testCreateContent = async () => {
    if (!idToken) throw new Error('No auth token available')
    
    const testContent = {
      title: 'Test Content',
      content_type: 'text',
      content_data: { text: 'This is a test content item' },
      metadata: { test: true }
    }
    
    const response = await fetch('/api/content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify(testContent)
    })
    
    if (!response.ok) {
      throw new Error(`Create content failed: ${response.status}`)
    }
    
    return await response.json()
  }

  const handleSignUp = async () => {
    const result = await signUp(testEmail, testPassword, {
      full_name: 'Test User',
      first_name: 'Test',
      last_name: 'User'
    })
    
    if (result.error) {
      throw new Error(result.error.message)
    }
    
    return result.data
  }

  const handleSignIn = async () => {
    const result = await signIn(testEmail, testPassword)
    
    if (result.error) {
      throw new Error(result.error.message)
    }
    
    return { success: true }
  }

  const TestResultCard = ({ title, result, icon: Icon }: { 
    title: string
    result: any
    icon: any
  }) => (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <Icon className="h-4 w-4 mr-2" />
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {result.success ? (
          <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500 ml-auto" />
        )}
      </CardHeader>
      <CardContent>
        {result.success ? (
          <div className="text-sm text-green-600">
            ✓ Test passed
            {result.data && (
              <pre className="mt-2 text-xs bg-green-50 p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            )}
          </div>
        ) : (
          <div className="text-sm text-red-600">
            ✗ {result.error}
          </div>
        )}
        <div className="text-xs text-gray-500 mt-1">
          {new Date(result.timestamp).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Firebase Auth + Supabase DB Integration Test</h1>
        <p className="text-gray-600">
          Test the complete integration of Firebase Authentication with Supabase Database.
        </p>
      </div>

      {/* Auth Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Authentication Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              {isConfigured ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">
                Firebase: {isConfigured ? 'Configured' : 'Not Configured'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {isInitialized ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">
                Initialized: {isInitialized ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {user ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">
                User: {user ? user.email : 'Not signed in'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {profile ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">
                Profile: {profile ? 'Loaded' : 'Not loaded'}
              </span>
            </div>
          </div>
          
          {user && (
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <h4 className="font-medium mb-2">Current User</h4>
              <pre className="text-xs overflow-auto">
                {JSON.stringify({
                  uid: user.uid,
                  email: user.email,
                  emailVerified: user.emailVerified,
                  displayName: user.displayName
                }, null, 2)}
              </pre>
            </div>
          )}
          
          {profile && (
            <div className="mt-4 p-3 bg-blue-50 rounded">
              <h4 className="font-medium mb-2">Profile Data</h4>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(profile, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Play className="h-5 w-5 mr-2" />
            Test Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Authentication Tests */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Authentication Tests</Label>
            <div className="flex space-x-2">
              <Input
                type="email"
                placeholder="Test email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="flex-1"
              />
              <Input
                type="password"
                placeholder="Test password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => runTest('signUp', handleSignUp)} 
                disabled={isLoading || !!user}
              >
                <LogIn className="h-4 w-4 mr-1" />
                Sign Up
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => runTest('signIn', handleSignIn)} 
                disabled={isLoading || !!user}
              >
                <LogIn className="h-4 w-4 mr-1" />
                Sign In
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => signOut()} 
                disabled={isLoading || !user}
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sign Out
              </Button>
            </div>
          </div>

          <Separator />

          {/* API Tests */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">API Tests (Requires Authentication)</Label>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => runTest('profileAPI', testProfileAPI)} 
                disabled={isLoading || !user}
              >
                <Database className="h-4 w-4 mr-1" />
                Test Profile API
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => runTest('contentAPI', testContentAPI)} 
                disabled={isLoading || !user}
              >
                <Database className="h-4 w-4 mr-1" />
                Test Content API
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => runTest('createContent', testCreateContent)} 
                disabled={isLoading || !user}
              >
                <Database className="h-4 w-4 mr-1" />
                Create Test Content
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {Object.keys(testResults).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Test Results</h2>
          
          {Object.entries(testResults).map(([key, result]) => (
            <TestResultCard 
              key={key}
              title={key.charAt(0).toUpperCase() + key.slice(1)} 
              result={result} 
              icon={Shield}
            />
          ))}
        </div>
      )}

      {/* Setup Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">1. Environment Variables</h4>
            <p className="text-sm text-gray-600">
              Ensure you have both Firebase and Supabase environment variables configured:
            </p>
            <ul className="text-sm text-gray-600 list-disc list-inside mt-2">
              <li>Firebase client config (NEXT_PUBLIC_FIREBASE_*)</li>
              <li>Firebase admin config (FIREBASE_PROJECT_ID, etc.)</li>
              <li>Supabase URL and service role key</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">2. Database Schema</h4>
            <p className="text-sm text-gray-600">
              Make sure your Supabase database has the required tables with proper columns:
            </p>
            <ul className="text-sm text-gray-600 list-disc list-inside mt-2">
              <li>profiles table with Firebase UID as primary key</li>
              <li>content table with user_id referencing Firebase UID</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">3. RLS Policies</h4>
            <p className="text-sm text-gray-600">
              Since we`&apos;`re using service role key, RLS policies should be disabled or adjusted to work with Firebase UIDs.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 