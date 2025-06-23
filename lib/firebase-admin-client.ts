// Client-side utility for calling Firebase Admin API routes
// This file is safe to use in browser/client components and Edge Runtime

export interface VerifyTokenResponse {
  success: boolean;
  user?: {
    uid: string;
    email?: string;
    emailVerified?: boolean;
    displayName?: string;
  };
  error?: string;
}

export interface UserResponse {
  success: boolean;
  user?: {
    uid: string;
    email?: string;
    displayName?: string;
    emailVerified?: boolean;
    disabled?: boolean;
    creationTime?: string;
    lastSignInTime?: string;
  };
  error?: string;
}

export interface CreateUserData {
  email: string;
  password?: string;
  displayName?: string;
  emailVerified?: boolean;
}

export interface UpdateUserData {
  uid: string;
  email?: string;
  displayName?: string;
  emailVerified?: boolean;
  disabled?: boolean;
}

/**
 * Verify a Firebase ID token via API route
 */
export async function verifyTokenViaAPI(token: string): Promise<VerifyTokenResponse> {
  try {
    const response = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    const result: VerifyTokenResponse = await response.json();
    return result;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to verify token'
    };
  }
}

/**
 * Get user by UID via API route
 */
export async function getUserViaAPI(uid: string, adminToken: string): Promise<UserResponse> {
  try {
    const response = await fetch(`/api/auth/user?uid=${encodeURIComponent(uid)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
    });

    const result: UserResponse = await response.json();
    return result;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to get user'
    };
  }
}

/**
 * Create user via API route
 */
export async function createUserViaAPI(userData: CreateUserData, adminToken: string): Promise<UserResponse> {
  try {
    const response = await fetch('/api/auth/user', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const result: UserResponse = await response.json();
    return result;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to create user'
    };
  }
}

/**
 * Update user via API route
 */
export async function updateUserViaAPI(userData: UpdateUserData, adminToken: string): Promise<UserResponse> {
  try {
    const response = await fetch('/api/auth/user', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const result: UserResponse = await response.json();
    return result;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to update user'
    };
  }
}

/**
 * Delete user via API route
 */
export async function deleteUserViaAPI(uid: string, adminToken: string): Promise<UserResponse> {
  try {
    const response = await fetch('/api/auth/user', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uid }),
    });

    const result: UserResponse = await response.json();
    return result;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to delete user'
    };
  }
}

/**
 * Validate Firebase token for authentication purposes
 * This is the main function to use for authentication validation
 */
export async function validateFirebaseTokenClient(token: string): Promise<{
  isValid: boolean;
  user?: {
    uid: string;
    email?: string;
    emailVerified?: boolean;
    displayName?: string;
  };
  error?: string;
}> {
  const result = await verifyTokenViaAPI(token);
  return {
    isValid: result.success,
    user: result.user,
    error: result.error
  };
} 