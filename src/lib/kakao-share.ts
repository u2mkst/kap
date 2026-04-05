/**
 * @fileOverview 카카오톡 공유 API 헬퍼
 */

declare global {
  interface Window {
    Kakao: any;
  }
}

/**
 * 카카오 SDK 초기화
 * @param apiKey 카카오 JavaScript 키
 */
export const initKakao = (apiKey?: string) => {
  if (typeof window === 'undefined') return;
  
  const finalKey = apiKey || process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;
  
  if (window.Kakao && finalKey) {
    if (!window.Kakao.isInitialized()) {
      try {
        window.Kakao.init(finalKey);
      } catch (e) {
        console.warn("Kakao SDK Initialization failed:", e);
      }
    }
  } else if (!window.Kakao) {
    console.warn("Kakao SDK script not loaded yet");
  }
};

/**
 * 오늘의 급식 카카오톡 공유
 */
export const shareMealToKakao = (date: string, schoolName: string, menu: string, apiKey?: string) => {
  if (typeof window === 'undefined') return;
  
  // 실행 전 한 번 더 초기화 시도
  if (apiKey) initKakao(apiKey);
  
  if (!window.Kakao || !window.Kakao.isInitialized()) {
    console.warn("Kakao SDK not initialized for sharing");
    return;
  }
  
  const formattedDate = `${date.substring(4, 6)}월 ${date.substring(6, 8)}일`;
  
  window.Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: `🍴 ${schoolName} 오늘의 급식`,
      description: `[${formattedDate}]\n${menu}`,
      imageUrl: 'https://picsum.photos/seed/meal/400/400',
      link: {
        mobileWebUrl: window.location.href,
        webUrl: window.location.href,
      },
    },
    buttons: [
      {
        title: '급식 확인하러 가기',
        link: {
          mobileWebUrl: window.location.href,
          webUrl: window.location.href,
        },
      },
    ],
  });
};

/**
 * 시간표 카카오톡 공유
 */
export const shareTimetableToKakao = (date: string, schoolName: string, grade: string, classNum: string, timetable: string, apiKey?: string) => {
  if (typeof window === 'undefined') return;
  
  // 실행 전 한 번 더 초기화 시도
  if (apiKey) initKakao(apiKey);
  
  if (!window.Kakao || !window.Kakao.isInitialized()) {
    console.warn("Kakao SDK not initialized for sharing");
    return;
  }
  
  const formattedDate = `${date.substring(4, 6)}월 ${date.substring(6, 8)}일`;
  
  window.Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: `📅 ${schoolName} 시간표`,
      description: `[${formattedDate}] ${grade}학년 ${classNum}반\n${timetable}`,
      imageUrl: 'https://picsum.photos/seed/timetable/400/400',
      link: {
        mobileWebUrl: window.location.href,
        webUrl: window.location.href,
      },
    },
    buttons: [
      {
        title: '시간표 확인하기',
        link: {
          mobileWebUrl: window.location.href,
          webUrl: window.location.href,
        },
      },
    ],
  });
};
