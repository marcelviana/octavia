"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Loader2, Play, User, Database, Shield } from 'lucide-react';
import { 
  runFirebaseIntegrationTest,
  testFirebaseClient,
  testFirebaseAdmin,
  testFirestore,
  createTestUser,
  signInTestUser,
  signOutUser,
  type FirebaseTestResult
} from '@/lib/firebase-integration';
import { isFirebaseConfigured } from '@/lib/firebase';

export default function FirebaseTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, FirebaseTestResult>>({});
  const [overallStatus, setOverallStatus] = useState<boolean | null>(null);
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('testpassword123');
  const [adminTestResult, setAdminTestResult] = useState<any>(null);

  const runIndividualTest = async (testName: string, testFunction: () => Promise<FirebaseTestResult>) => {
    setIsLoading(true);
    try {
      const result = await testFunction();
      setTestResults(prev => ({ ...prev, [testName]: result }));
    } catch (error: any) {
      setTestResults(prev => ({ 
        ...prev, 
        [testName]: { 
          success: false, 
          error: error.message || 'Unknown error' 
        } 
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const runFullIntegrationTest = async () => {
    setIsLoading(true);
    setTestResults({});
    setOverallStatus(null);
    
    try {
      const { overall, results } = await runFirebaseIntegrationTest();
      setTestResults(results);
      setOverallStatus(overall);
    } catch (error: any) {
      setTestResults({
        error: {
          success: false,
          error: error.message || 'Integration test failed'
        }
      });
      setOverallStatus(false);
    } finally {
      setIsLoading(false);
    }
  };

  const testAdminAPI = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/firebase-test');
      const result = await response.json();
      setAdminTestResult(result);
    } catch (error: any) {
      setAdminTestResult({
        success: false,
        error: error.message || 'Admin API test failed'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const TestResultCard = ({ title, result, icon: Icon }: { 
    title: string; 
    result: FirebaseTestResult; 
    icon: any;
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
            {result.details && (
              <pre className="mt-2 text-xs bg-green-50 p-2 rounded">
                {JSON.stringify(result.details, null, 2)}
              </pre>
            )}
          </div>
        ) : (
          <div className="text-sm text-red-600">
            ✗ {result.error}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Firebase Integration Test</h1>
        <p className="text-gray-600">
          Test your Firebase configuration and integration with this comprehensive test suite.
        </p>
      </div>

      {/* Configuration Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Configuration Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              {isFirebaseConfigured ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">
                Client SDK: {isFirebaseConfigured ? 'Configured' : 'Not Configured'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">
                Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Missing'}
              </span>
            </div>
          </div>
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
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={runFullIntegrationTest} 
              disabled={isLoading}
              className="flex items-center"
            >
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Run Full Integration Test
            </Button>
            <Button 
              variant="outline"
              onClick={() => runIndividualTest('clientConfig', testFirebaseClient)} 
              disabled={isLoading}
            >
              Test Client
            </Button>
            <Button 
              variant="outline"
              onClick={() => runIndividualTest('adminConfig', testFirebaseAdmin)} 
              disabled={isLoading}
            >
              Test Admin
            </Button>
            <Button 
              variant="outline"
              onClick={() => runIndividualTest('firestore', testFirestore)} 
              disabled={isLoading}
            >
              Test Firestore
            </Button>
            <Button 
              variant="outline"
              onClick={testAdminAPI} 
              disabled={isLoading}
            >
              Test Admin API
            </Button>
          </div>

          <Separator />

          {/* Test User Creation */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Test User Credentials</Label>
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
                onClick={() => runIndividualTest('createUser', () => createTestUser(testEmail, testPassword))} 
                disabled={isLoading}
              >
                Create Test User
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => runIndividualTest('signIn', () => signInTestUser(testEmail, testPassword))} 
                disabled={isLoading}
              >
                Sign In Test User
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => runIndividualTest('signOut', signOutUser)} 
                disabled={isLoading}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Status */}
      {overallStatus !== null && (
        <Alert className={`mb-6 ${overallStatus ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <AlertDescription className="flex items-center">
            {overallStatus ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                All Firebase integration tests passed! Your Firebase setup is working correctly.
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-red-500 mr-2" />
                Some Firebase integration tests failed. Check the results below for details.
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Test Results */}
      {Object.keys(testResults).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Test Results</h2>
          
          {testResults.clientConfig && (
            <TestResultCard 
              title="Firebase Client Configuration" 
              result={testResults.clientConfig} 
              icon={User}
            />
          )}
          
          {testResults.adminConfig && (
            <TestResultCard 
              title="Firebase Admin Configuration" 
              result={testResults.adminConfig} 
              icon={Shield}
            />
          )}
          
          {testResults.firestore && (
            <TestResultCard 
              title="Firestore Operations" 
              result={testResults.firestore} 
              icon={Database}
            />
          )}

          {Object.entries(testResults)
            .filter(([key]) => !['clientConfig', 'adminConfig', 'firestore'].includes(key))
            .map(([key, result]) => (
              <TestResultCard 
                key={key}
                title={key.charAt(0).toUpperCase() + key.slice(1)} 
                result={result} 
                icon={User}
              />
            ))}
        </div>
      )}

      {/* Admin API Test Results */}
      {adminTestResult && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Admin API Test Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto">
              {JSON.stringify(adminTestResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Setup Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">1. Create Firebase Project</h4>
            <p className="text-sm text-gray-600">
              Go to <a href="https://console.firebase.google.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Firebase Console</a> and create a new project.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">2. Enable Authentication & Firestore</h4>
            <p className="text-sm text-gray-600">
              Enable Authentication (Email/Password) and Firestore Database in your Firebase project.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">3. Configure Environment Variables</h4>
            <p className="text-sm text-gray-600">
              Copy the configuration from your Firebase project settings and create a <code>.env.local</code> file with the required variables. 
              Check <code>.env.example</code> for the complete list.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">4. Generate Service Account Key</h4>
            <p className="text-sm text-gray-600">
              Go to Project Settings → Service Accounts → Generate new private key for the Admin SDK configuration.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 