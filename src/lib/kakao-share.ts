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
 * 내용을 모두 제목에 넣고 아래에 페이지 링크를 추가합니다.
 */
export const shareMealToKakao = (date: string, schoolName: string, menu: string, apiKey?: string) => {
  if (typeof window === 'undefined') return;
  
  const initialized = initKakao(apiKey);
  
  if (!initialized || !window.Kakao?.Share) {
    alert("카카오톡 공유를 준비 중입니다. 잠시 후 다시 시도해 주세요.");
    return;
  }
  
  const formattedDate = `${parseInt(date.substring(4, 6))}월 ${parseInt(date.substring(6, 8))}일`;
  const menuList = menu.split(',').map(item => `•${item.trim()}`).filter(Boolean).join('\n');
  
  try {
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: `[${schoolName}] ${formattedDate} 급식\n${menuList}`,
        description: 'KST HUB에서 오늘의 정보를 확인하세요!',
        imageUrl: '', // 사진 삭제
        link: {
          mobileWebUrl: window.location.origin + '/dashboard',
          webUrl: window.location.origin + '/dashboard',
        },
      },
      buttons: [
        {
          title: 'KST HUB 바로가기',
          link: {
            mobileWebUrl: window.location.origin + '/dashboard',
            webUrl: window.location.origin + '/dashboard',
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
 * 내용을 모두 제목에 넣고 아래에 페이지 링크를 추가합니다.
 */
export const shareTimetableToKakao = (date: string, schoolName: string, grade: string, classNum: string, timetable: string, apiKey?: string) => {
  if (typeof window === 'undefined') return;
  
  const initialized = initKakao(apiKey);
  
  if (!initialized || !window.Kakao?.Share) {
    alert("카카오톡 공유를 준비 중입니다. 잠시 후 다시 시도해 주세요.");
    return;
  }
  
  const formattedDate = `${parseInt(date.substring(4, 6))}월 ${parseInt(date.substring(6, 8))}일`;
  const tableList = timetable.split(',').map(item => `•${item.trim()}`).filter(Boolean).join('\n');
  
  try {
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: `[${schoolName}] ${formattedDate} 시간표 (${grade}학년 ${classNum}반)\n${tableList}`,
        description: 'KST HUB에서 우리 반 시간표를 확인하세요!',
        imageUrl: '', // 사진 삭제
        link: {
          mobileWebUrl: window.location.origin + '/dashboard',
          webUrl: window.location.origin + '/dashboard',
        },
      },
      buttons: [
        {
          title: 'KST HUB 바로가기',
          link: {
            mobileWebUrl: window.location.origin + '/dashboard',
            webUrl: window.location.origin + '/dashboard',
          },
        },
      ],
    });
  } catch (e) {
    console.error("Kakao Share Error:", e);
  }
};
