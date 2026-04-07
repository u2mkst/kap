
/**
 * @fileOverview 카카오톡 공유 API 헬퍼 (사용자 제공 레거시 텍스트 형식 반영)
 */

declare global {
  interface Window {
    Kakao: any;
  }
}

export const initKakao = (apiKey?: string) => {
  if (typeof window === 'undefined') return false;
  
  const finalKey = apiKey || "1074f182720545c67909372a924b23bb";
  
  if (window.Kakao && finalKey) {
    try {
      if (!window.Kakao.isInitialized()) {
        window.Kakao.init(finalKey);
      }
      return true;
    } catch (e) {
      console.error("Kakao Init Error:", e);
      return false;
    }
  }
  return false;
};

/**
 * 오늘의 급식 카카오톡 공유 (사용자 제공 레거시 텍스트 형식)
 */
export const shareMealToKakao = (date: string, schoolName: string, menu: string, apiKey?: string) => {
  if (typeof window === 'undefined') return;
  
  initKakao(apiKey);
  
  if (!window.Kakao?.Share) {
    alert("카카오톡 SDK를 로드할 수 없습니다.");
    return;
  }
  
  const formattedDate = `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`;
  const menuList = menu.split(',').map(item => `• ${item.trim()}`).filter(Boolean).join('\n');
  
  try {
    window.Kakao.Share.sendDefault({
      objectType: 'text',
      text: `${schoolName}\n${formattedDate} 급식 🍱\n\n${menuList}`,
      link: {
        mobileWebUrl: window.location.origin + '/dashboard',
        webUrl: window.location.origin + '/dashboard',
      },
      buttons: [
        {
          title: 'KST HUB에서 보기',
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
 */
export const shareTimetableToKakao = (date: string, schoolName: string, grade: string, classNum: string, timetable: string, apiKey?: string) => {
  if (typeof window === 'undefined') return;
  
  initKakao(apiKey);
  
  if (!window.Kakao?.Share) {
    alert("카카오톡 SDK를 로드할 수 없습니다.");
    return;
  }
  
  const formattedDate = `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`;
  const tableList = timetable.split(',').map(item => `• ${item.trim()}`).filter(Boolean).join('\n');
  
  try {
    window.Kakao.Share.sendDefault({
      objectType: 'text',
      text: `${schoolName}\n${formattedDate} 시간표 (${grade}-${classNum})\n\n${tableList}`,
      link: {
        mobileWebUrl: window.location.origin + '/dashboard',
        webUrl: window.location.origin + '/dashboard',
      },
      buttons: [
        {
          title: 'KST HUB에서 보기',
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
