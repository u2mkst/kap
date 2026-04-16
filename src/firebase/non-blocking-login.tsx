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
 * 에러 코드에 따른 한국어 메시지 변환
 */
function handleAuthError(error: any) {
  console.error("Auth Error:", error);
  if (error instanceof FirebaseError || error?.code) {
    switch (error.code) {
      case 'auth/popup-closed-by-user':
        toast({ title: "로그인 취소", description: "로그인 팝업창이 닫혔습니다." });
        break;
      case 'auth/cancelled-popup-request':
        // 이미 팝업이 뜨고 있는 경우이므로 무시하거나 안내
        break;
      case 'auth/popup-blocked':
        toast({ variant: "destructive", title: "팝업 차단됨", description: "브라우저 설정에서 팝업 차단을 해제해 주세요." });
        break;
      case 'auth/unauthorized-domain':
        toast({ 
          variant: "destructive", 
          title: "승인되지 않은 도메인", 
          description: "Firebase 콘솔 > Auth > Settings에서 현재 도메인을 승인된 도메인에 추가해야 합니다." 
        });
        break;
      case 'auth/operation-not-allowed':
        toast({ 
          variant: "destructive", 
          title: "인증 활성화 필요", 
          description: "Firebase 콘솔에서 해당 로그인 제공업체를 활성화해 주세요." 
        });
        break;
      case 'auth/credential-already-in-use':
        toast({ variant: "destructive", title: "계정 연결 실패", description: "이미 다른 가입 정보와 연결된 계정입니다." });
        break;
      default:
        toast({ variant: "destructive", title: "오류 발생", description: error.message || "인증 중 알 수 없는 오류가 발생했습니다." });
    }
  }
}

/** 익명 로그인 (비차단) */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance).catch(handleAuthError);
}

/** 구글 로그인 (비차단) */
export function initiateGoogleSignIn(authInstance: Auth): void {
  const provider = new GoogleAuthProvider();
  // 팝업 설정 커스텀 (필요 시)
  provider.setCustomParameters({ prompt: 'select_account' });
  
  signInWithPopup(authInstance, provider).catch(handleAuthError);
}

/** 네이버 로그인 (비차단) */
export function initiateNaverSignIn(authInstance: Auth): void {
  const provider = new OAuthProvider('oidc.naver');
  signInWithPopup(authInstance, provider).catch(handleAuthError);
}

/** 구글 계정 연결 (계정 전환용) */
export async function linkAccountWithGoogle(user: User): Promise<void> {
  const provider = new GoogleAuthProvider();
  try {
    await linkWithPopup(user, provider);
  } catch (error: any) {
    handleAuthError(error);
    throw error; // 컴포넌트에서 후속 처리를 위해 throw
  }
}

/** 네이버 계정 연결 (계정 전환용) */
export async function linkAccountWithNaver(user: User): Promise<void> {
  const provider = new OAuthProvider('oidc.naver');
  try {
    await linkWithPopup(user, provider);
  } catch (error: any) {
    handleAuthError(error);
    throw error;
  }
}
