'use client';
import { FirebaseError } from 'firebase/app';
import {
  Auth,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  OAuthProvider,
  linkWithPopup,
  User
} from 'firebase/auth';
import { toast } from '@/hooks/use-toast';

/**
 * 에러 코드에 따른 한국어 메시지 변환 및 조치 가이드
 */
function handleAuthError(error: any) {
  console.error("Auth Error Details:", error);
  const code = error?.code || "";
  
  let title = "인증 오류";
  let description = error.message || "알 수 없는 오류가 발생했습니다.";

  switch (code) {
    case 'auth/popup-closed-by-user':
      title = "로그인 취소";
      description = "로그인 팝업창이 사용자에 의해 닫혔습니다.";
      break;
    case 'auth/cancelled-popup-request':
      return; // 중복 요청은 무시
    case 'auth/popup-blocked':
      title = "팝업 차단됨";
      description = "브라우저 설정에서 팝업 차단을 해제해 주세요.";
      break;
    case 'auth/unauthorized-domain':
      const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '현재 도메인';
      title = "승인되지 않은 도메인";
      description = `Firebase 콘솔에서 '${currentDomain}'을 승인된 도메인에 추가해야 합니다. 설정을 마쳤다면 1~2분 정도 기다린 후 다시 시도해 주세요.`;
      break;
    case 'auth/operation-not-allowed':
      title = "인증 제공자 미활성화";
      description = "Firebase 콘솔에서 Google 또는 OIDC(네이버) 제공자를 활성화해 주세요.";
      break;
    case 'auth/credential-already-in-use':
      title = "계정 연결 실패";
      description = "이미 다른 계정에 연결된 소셜 정보입니다.";
      break;
    case 'auth/network-request-failed':
      title = "네트워크 오류";
      description = "인터넷 연결 상태를 확인해 주세요.";
      break;
  }

  toast({ 
    variant: "destructive", 
    title: `${title} (${code})`, 
    description: description 
  });
}

/** 익명 로그인 */
export async function initiateAnonymousSignIn(authInstance: Auth): Promise<void> {
  try {
    await signInAnonymously(authInstance);
  } catch (error) {
    handleAuthError(error);
    throw error;
  }
}

/** 구글 로그인 */
export async function initiateGoogleSignIn(authInstance: Auth): Promise<void> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await signInWithPopup(authInstance, provider);
  } catch (error) {
    handleAuthError(error);
    throw error;
  }
}

/** 네이버 로그인 (OIDC 설정 필요) */
export async function initiateNaverSignIn(authInstance: Auth): Promise<void> {
  const provider = new OAuthProvider('oidc.naver');
  try {
    await signInWithPopup(authInstance, provider);
  } catch (error) {
    handleAuthError(error);
    throw error;
  }
}

/** 구글 계정 연결 */
export async function linkAccountWithGoogle(user: User): Promise<void> {
  const provider = new GoogleAuthProvider();
  try {
    await linkWithPopup(user, provider);
  } catch (error: any) {
    handleAuthError(error);
    throw error;
  }
}

/** 네이버 계정 연결 */
export async function linkAccountWithNaver(user: User): Promise<void> {
  const provider = new OAuthProvider('oidc.naver');
  try {
    await linkWithPopup(user, provider);
  } catch (error: any) {
    handleAuthError(error);
    throw error;
  }
}
