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
  if (typeof window === 'undefined') return false;
  
  const finalKey = apiKey || process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;
  
  if (window.Kakao && finalKey) {
    try {
      if (!window.Kakao.isInitialized()) {
        window.Kakao.init(finalKey);
      }
      return true;
    } catch (e) {
      console.warn("Kakao SDK Initialization failed:", e);
      return false;
    }
  }
  return false;
};

/**
 * 오늘의 급식 카카오톡 공유
 */
export const shareMealToKakao = (date: string, schoolName: string, menu: string, apiKey?: string) => {
  if (typeof window === 'undefined') return;
  
  const initialized = initKakao(apiKey);
  
  if (!initialized || !window.Kakao?.Share) {
    alert("카카오톡 공유를 준비 중입니다. 잠시 후 다시 시도해 주세요. (관리자 설정에서 API 키가 정확한지 확인해 주세요)");
    return;
  }
  
  const formattedDate = `${date.substring(4, 6)}월 ${date.substring(6, 8)}일`;
  // 급식 메뉴 줄바꿈 처리
  const formattedMenu = menu.split(',').map(item => item.trim()).join('\n');
  
  try {
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: `${schoolName}`,
        description: `${formattedDate} 급식\n\n${formattedMenu}`,
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
  } catch (e) {
    console.error("Kakao Share Error:", e);
  }
};

/**
 * 시간표 카카오톡 공유
 */
export const shareTimetableToKakao = (date: string, schoolName: string, grade: string, classNum: string, timetable: string, apiKey?: string) => {
  if (typeof window === 'undefined') return;
  
  const initialized = initKakao(apiKey);
  
  if (!initialized || !window.Kakao?.Share) {
    alert("카카오톡 공유를 준비 중입니다. 잠시 후 다시 시도해 주세요.");
    return;
  }
  
  const formattedDate = `${date.substring(4, 6)}월 ${date.substring(6, 8)}일`;
  // 시간표 줄바꿈 처리
  const formattedTimetable = timetable.split(',').map(item => item.trim()).join('\n');
  
  try {
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: `${schoolName}`,
        description: `${formattedDate} (${grade}학년 ${classNum}반) 시간표\n\n${formattedTimetable}`,
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
  } catch (e) {
    console.error("Kakao Share Error:", e);
  }
};
