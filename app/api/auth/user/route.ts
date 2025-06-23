import { NextRequest, NextResponse } from 'next/server';
import { 
  createUser, 
  updateUser, 
  deleteUser, 
  getUserByUid,
  verifyFirebaseToken 
} from '@/lib/firebase-admin';

export const runtime = 'nodejs'; // Explicitly use Node.js runtime

export interface CreateUserRequest {
  email: string;
  password?: string;
  displayName?: string;
  emailVerified?: boolean;
}

export interface UpdateUserRequest {
  uid: string;
  email?: string;
  displayName?: string;
  emailVerified?: boolean;
  disabled?: boolean;
}

export interface DeleteUserRequest {
  uid: string;
}

export interface GetUserRequest {
  uid: string;
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

// Helper function to verify admin token from request
async function verifyAdminToken(request: NextRequest): Promise<{ uid: string; email?: string } | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    const decodedToken = await verifyFirebaseToken(token);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email
    };
  } catch {
    return null;
  }
}

// GET - Get user by UID
export async function GET(request: NextRequest): Promise<NextResponse<UserResponse>> {
  try {
    // Verify admin token
    const admin = await verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json(
        { success: false, error: 'Missing uid parameter' },
        { status: 400 }
      );
    }

    const userRecord = await getUserByUid(uid);

    return NextResponse.json({
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
        disabled: userRecord.disabled,
        creationTime: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime
      }
    });

  } catch (error: any) {
    console.error('Get user failed:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'Get user failed' },
      { status: 500 }
    );
  }
}

// POST - Create new user
export async function POST(request: NextRequest): Promise<NextResponse<UserResponse>> {
  try {
    // Verify admin token
    const admin = await verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: CreateUserRequest = await request.json();
    const { email, password, displayName, emailVerified } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const userRecord = await createUser({
      email,
      password,
      displayName,
      emailVerified
    });

    return NextResponse.json({
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
        disabled: userRecord.disabled,
        creationTime: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime
      }
    });

  } catch (error: any) {
    console.error('Create user failed:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'Create user failed' },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(request: NextRequest): Promise<NextResponse<UserResponse>> {
  try {
    // Verify admin token
    const admin = await verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: UpdateUserRequest = await request.json();
    const { uid, email, displayName, emailVerified, disabled } = body;

    if (!uid) {
      return NextResponse.json(
        { success: false, error: 'UID is required' },
        { status: 400 }
      );
    }

    const userRecord = await updateUser(uid, {
      email,
      displayName,
      emailVerified,
      disabled
    });

    return NextResponse.json({
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
        disabled: userRecord.disabled,
        creationTime: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime
      }
    });

  } catch (error: any) {
    console.error('Update user failed:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'Update user failed' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest): Promise<NextResponse<UserResponse>> {
  try {
    // Verify admin token
    const admin = await verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: DeleteUserRequest = await request.json();
    const { uid } = body;

    if (!uid) {
      return NextResponse.json(
        { success: false, error: 'UID is required' },
        { status: 400 }
      );
    }

    await deleteUser(uid);

    return NextResponse.json({
      success: true
    });

  } catch (error: any) {
    console.error('Delete user failed:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'Delete user failed' },
      { status: 500 }
    );
  }
} 