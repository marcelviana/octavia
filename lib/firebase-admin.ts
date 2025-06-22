import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    }),
  });
}

export async function verifyFirebaseToken(idToken: string) {
  const decodedToken = await getAuth().verifyIdToken(idToken);
  return decodedToken;
}