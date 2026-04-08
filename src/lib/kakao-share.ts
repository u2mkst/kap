
/**
 * @fileOverview 카카오톡 공유 API 헬퍼 (사용자 요청 커스텀 포맷 및 특정 링크 반영)
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
 * 오늘의 급식 카카오톡 공유 (커스텀 텍스트 형식 + 고정 링크)
 */
export const shareMealToKakao = (date: string, schoolName: string, menu: string, apiKey?: string) => {
  if (typeof window === 'undefined') return;
  
  initKakao(apiKey);
  
  if (!window.Kakao?.Share) {
    alert("카카오톡 SDK를 로드할 수 없습니다.");
    return;
  }
  
  // 날짜 형식: 20260325 -> 3월 25일
  const month = parseInt(date.substring(4, 6));
  const day = parseInt(date.substring(6, 8));
  const formattedDate = `${month}월 ${day}일`;
  
  // 급식 리스트
  const menuList = menu.split(',').map(item => item.trim()).filter(Boolean).join('\n');
  const siteUrl = window.location.origin;
  const kstLink = "https://tr.ee/ksthub";
  
  try {
    window.Kakao.Share.sendDefault({
      objectType: 'text',
      text: `${schoolName}\n${formattedDate} 급식 🍱\n\n${menuList}\n\n🔗 ${kstLink}`,
      link: {
        mobileWebUrl: siteUrl + '/dashboard',
        webUrl: siteUrl + '/dashboard',
      },
      buttons: [
        {
          title: 'KST HUB에서 보기',
          link: {
            mobileWebUrl: siteUrl + '/dashboard',
            webUrl: siteUrl + '/dashboard',
          },
        },
      ],
    });
  } catch (e) {
    console.error("Kakao Share Error:", e);
  }
};

/**
 * 시간표 카카오톡 공유 (커스텀 텍스트 형식 + 고정 링크)
 */
export const shareTimetableToKakao = (date: string, schoolName: string, grade: string, classNum: string, timetable: string, apiKey?: string) => {
  if (typeof window === 'undefined') return;
  
  initKakao(apiKey);
  
  if (!window.Kakao?.Share) {
    alert("카카오톡 SDK를 로드할 수 없습니다.");
    return;
  }
  
  // 날짜 형식: 20260325 -> 3월 25일
  const month = parseInt(date.substring(4, 6));
  const day = parseInt(date.substring(6, 8));
  const formattedDate = `${month}월 ${day}일`;
  
  // 시간표 리스트
  const tableList = timetable.split(',').map(item => {
    const cleanItem = item.trim();
    if (cleanItem.includes(':')) {
      return cleanItem.replace(':', ' | ');
    }
    return cleanItem;
  }).filter(Boolean).join('\n');
  
  const siteUrl = window.location.origin;
  const kstLink = "https://tr.ee/ksthub";
  
  try {
    window.Kakao.Share.sendDefault({
      objectType: 'text',
      text: `${schoolName}\n${formattedDate} 시간표 (${grade}-${classNum})\n\n${tableList}\n\n🔗 ${kstLink}`,
      link: {
        mobileWebUrl: siteUrl + '/dashboard',
        webUrl: siteUrl + '/dashboard',
      },
      buttons: [
        {
          title: 'KST HUB에서 보기',
          link: {
            mobileWebUrl: siteUrl + '/dashboard',
            webUrl: siteUrl + '/dashboard',
          },
        },
      ],
    });
  } catch (e) {
    console.error("Kakao Share Error:", e);
  }
};

/**
 * 오늘의 행운 점수 카카오톡 공유
 */
export const shareFortuneToKakao = (score: number, nickname: string, apiKey?: string) => {
  if (typeof window === 'undefined') return;
  
  initKakao(apiKey);
  
  if (!window.Kakao?.Share) {
    alert("카카오톡 SDK를 로드할 수 없습니다.");
    return;
  }
  
  const siteUrl = window.location.origin;
  const kstLink = "https://tr.ee/ksthub";
  
  let comment = "오늘 기분이 아주 좋아요! 👍";
  if (score >= 90) comment = "역대급 행운이에요! 오늘은 뭘 해도 되는 날! ✨";
  else if (score >= 75) comment = "운이 아주 좋네요! 행복한 하루 예약! 🙂";
  
  try {
    window.Kakao.Share.sendDefault({
      objectType: 'text',
      text: `${nickname}님의 오늘의 행운 점수 🍀\n\n🎉 ${score}점!\n\n${comment}\n\n🔗 ${kstLink}`,
      link: {
        mobileWebUrl: siteUrl + '/dashboard',
        webUrl: siteUrl + '/dashboard',
      },
      buttons: [
        {
          title: '나도 점수 확인하기',
          link: {
            mobileWebUrl: siteUrl + '/dashboard',
            webUrl: siteUrl + '/dashboard',
          },
        },
      ],
    });
  } catch (e) {
    console.error("Kakao Share Error:", e);
  }
};

/**
 * 오늘의 명언 카카오톡 공유
 */
export const shareQuoteToKakao = (quote: string, author: string, apiKey?: string) => {
  if (typeof window === 'undefined') return;
  
  initKakao(apiKey);
  
  if (!window.Kakao?.Share) {
    alert("카카오톡 SDK를 로드할 수 없습니다.");
    return;
  }
  
  const siteUrl = window.location.origin;
  const kstLink = "https://tr.ee/ksthub";
  
  try {
    window.Kakao.Share.sendDefault({
      objectType: 'text',
      text: `오늘의 명언 📜\n\n"${quote}"\n\n- ${author || '알 수 없음'}\n\n🔗 ${kstLink}`,
      link: {
        mobileWebUrl: siteUrl + '/dashboard',
        webUrl: siteUrl + '/dashboard',
      },
      buttons: [
        {
          title: 'KST HUB에서 보기',
          link: {
            mobileWebUrl: siteUrl + '/dashboard',
            webUrl: siteUrl + '/dashboard',
          },
        },
      ],
    });
  } catch (e) {
    console.error("Kakao Share Error:", e);
  }
};
