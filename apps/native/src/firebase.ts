/**
 * Firebase no RN (N0-D1: JS SDK + AsyncStorage). Espelha lib/firebase.ts do web: as mesmas seis
 * chaves públicas, agora EXPO_PUBLIC_* (apps/native/.env, gitignored). `initializeAuth` com
 * persistência em AsyncStorage ANTES de qualquer `getAuth` (N0-PRECHECK C2: sem isso, memória).
 */
import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth, initializeAuth, type Persistence } from 'firebase/auth'
import * as firebaseAuth from 'firebase/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'

// `getReactNativePersistence` existe em runtime (Metro resolve a condition `react-native` de
// @firebase/auth → dist/rn/index.js — N0-H2), mas o .d.ts que o tsc vê é `auth-public.d.ts`:
// no `exports["."]` de @firebase/auth a chave `types` vem ANTES de `react-native` e vence, mesmo
// com `customConditions: ["react-native"]` (expo/tsconfig.base). Cast tipado, sem `any`.
const { getReactNativePersistence } = firebaseAuth as unknown as {
  getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence
}

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
}

// Idempotente como lib/firebase.ts do web (getApps): o Fast Refresh do Metro re-executa este módulo
// e um segundo initializeAuth lança `auth/already-initialized` — nesse caso reaproveita a instância.
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

function initAuth() {
  try {
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
  } catch (e: unknown) {
    const code = typeof e === 'object' && e && 'code' in e ? String((e as { code: unknown }).code) : ''
    if (code === 'auth/already-initialized') return getAuth(app)
    throw e
  }
}

export const auth = initAuth()
