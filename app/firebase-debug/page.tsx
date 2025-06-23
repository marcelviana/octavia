'use client'

import { useEffect, useState } from 'react'
import { auth, db, isFirebaseConfigured } from '@/lib/firebase'

export default function FirebaseDebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    const checkFirebase = () => {
      const info = {
        isConfigured: isFirebaseConfigured,
        authExists: !!auth,
        dbExists: !!db,
        authCurrentUser: auth?.currentUser,
        envVars: {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'SET' : 'MISSING',
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'SET' : 'MISSING',
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'SET' : 'MISSING',
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? 'SET' : 'MISSING',
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? 'SET' : 'MISSING',
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? 'SET' : 'MISSING',
        },
        actualValues: {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 10) + '...',
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        }
      }
      
      console.log('Firebase Debug Info:', info)
      setDebugInfo(info)
    }

    checkFirebase()
  }, [])

  const testSignIn = async () => {
    if (!auth) {
      console.error('Firebase Auth not initialized')
      return
    }

    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth')
      const result = await signInWithEmailAndPassword(auth, 'test@example.com', 'testpassword123')
      console.log('Sign in successful:', result)
    } catch (error) {
      console.error('Sign in error:', error)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-4">Firebase Debug Page</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <h2 className="text-xl font-semibold mb-2">Debug Information</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      <div className="space-y-2">
        <button 
          onClick={testSignIn}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test Sign In
        </button>
      </div>
    </div>
  )
} 