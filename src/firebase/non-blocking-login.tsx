'use client';
import {
  Auth,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  OAuthProvider,
  linkWithPopup,
  User
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance);
}

/** Initiate Google sign-in (non-blocking). */
export function initiateGoogleSignIn(authInstance: Auth): void {
  const provider = new GoogleAuthProvider();
  signInWithPopup(authInstance, provider);
}

/** 
 * Initiate Naver sign-in (non-blocking). 
 * Note: Naver requires custom OIDC setup in Firebase console.
 */
export function initiateNaverSignIn(authInstance: Auth): void {
  const provider = new OAuthProvider('oidc.naver');
  signInWithPopup(authInstance, provider);
}

/**
 * Link current user with Google account (to preserve data during migration)
 */
export async function linkAccountWithGoogle(user: User): Promise<void> {
  const provider = new GoogleAuthProvider();
  try {
    await linkWithPopup(user, provider);
  } catch (error: any) {
    if (error.code === 'auth/credential-already-in-use') {
      throw new Error('이 소셜 계정은 이미 다른 가입 정보와 연결되어 있습니다.');
    }
    throw error;
  }
}

/**
 * Link current user with Naver account
 */
export async function linkAccountWithNaver(user: User): Promise<void> {
  const provider = new OAuthProvider('oidc.naver');
  try {
    await linkWithPopup(user, provider);
  } catch (error: any) {
    if (error.code === 'auth/credential-already-in-use') {
      throw new Error('이 소셜 계정은 이미 다른 가입 정보와 연결되어 있습니다.');
    }
    throw error;
  }
}
