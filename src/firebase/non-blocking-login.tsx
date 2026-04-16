
'use client';
import {
  Auth,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  OAuthProvider
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
 * This is a placeholder for the Naver OAuth flow.
 */
export function initiateNaverSignIn(authInstance: Auth): void {
  const provider = new OAuthProvider('oidc.naver');
  signInWithPopup(authInstance, provider);
}
