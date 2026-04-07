
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
      return false;
    }
  }
  return false;
};

/**
 * 오늘의 급식 카카오톡 공유
 * 말줄임 현상을 막기 위해 모든 내용을 제목(Title)에 통합합니다.
 */
export const shareMealToKakao = (date: string, schoolName: string, menu: string, apiKey?: string) => {
  if (typeof window === 'undefined') return;
  
  initKakao(apiKey);
  
  if (!window.Kakao?.Share) {
    alert("공유 기능을 준비 중입니다. 잠시 후 다시 시도해 주세요. (관리자 설정에서 API 키가 정확한지 확인해 주세요)");
    return;
  }
  
  const formattedDate = `${parseInt(date.substring(4, 6))}월 ${parseInt(date.substring(6, 8))}일`;
  // 줄바꿈으로 메뉴를 나열하여 가독성 높임
  const menuList = menu.split(',').map(item => `• ${item.trim()}`).filter(Boolean).join('\n');
  
  try {
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        // 제목에 모든 정보를 통합하여 말줄임표 현상을 최소화함
        title: `[${schoolName}] ${formattedDate} 급식\n${menuList}`,
        description: '', 
        imageUrl: '', // 사진 제거
        link: {
          mobileWebUrl: window.location.origin + '/dashboard',
          webUrl: window.location.origin + '/dashboard',
        },
      },
      buttons: [
        {
          title: 'KST HUB에서 확인하기',
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
    alert("공유 기능을 준비 중입니다. 잠시 후 다시 시도해 주세요.");
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
          title: 'KST HUB에서 확인하기',
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
