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
 * 내용을 제목(title)에 모두 몰아서 표시하여 잘림 현상을 최소화합니다.
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
        description: '', // 설명란 비움 (제목에 집중)
        imageUrl: '',
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
 * 내용을 제목(title)에 모두 몰아서 표시하여 잘림 현상을 최소화합니다.
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
        title: `[${schoolName}] ${formattedDate} 시간표 (${grade}-${classNum})\n${tableList}`,
        description: '', // 설명란 비움
        imageUrl: '',
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
