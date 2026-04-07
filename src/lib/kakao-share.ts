
/**
 * @fileOverview 카카오톡 공유 API 헬퍼
 */

declare global {
  interface Window {
    Kakao: any;
  }
}

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
      console.error("Kakao Init Error:", e);
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
  
  const isReady = initKakao(apiKey);
  
  if (!window.Kakao?.Share) {
    alert("카카오톡 SDK를 로드할 수 없습니다. 잠시 후 다시 시도해 주세요.");
    return;
  }
  
  const formattedDate = `${parseInt(date.substring(4, 6))}월 ${parseInt(date.substring(6, 8))}일`;
  const menuList = menu.split(',').map(item => `• ${item.trim()}`).filter(Boolean).join('\n');
  
  try {
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: `[${schoolName}] ${formattedDate} 급식\n${menuList}`,
        description: '', 
        imageUrl: '',
        link: {
          mobileWebUrl: window.location.origin + '/dashboard',
          webUrl: window.location.origin + '/dashboard',
        },
      },
      buttons: [
        {
          title: 'KST HUB 앱에서 보기',
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
  
  const isReady = initKakao(apiKey);
  
  if (!window.Kakao?.Share) {
    alert("카카오톡 SDK를 로드할 수 없습니다.");
    return;
  }
  
  const formattedDate = `${parseInt(date.substring(4, 6))}월 ${parseInt(date.substring(6, 8))}일`;
  const tableList = timetable.split(',').map(item => `• ${item.trim()}`).filter(Boolean).join('\n');
  
  try {
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: `[${schoolName}] ${formattedDate} 시간표 (${grade}-${classNum})\n${tableList}`,
        description: '',
        imageUrl: '',
        link: {
          mobileWebUrl: window.location.origin + '/dashboard',
          webUrl: window.location.origin + '/dashboard',
        },
      },
      buttons: [
        {
          title: 'KST HUB 앱에서 보기',
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
