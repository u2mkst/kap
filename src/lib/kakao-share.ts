
/**
 * @fileOverview 카카오톡 공유 API 헬퍼
 */

declare global {
  interface Window {
    Kakao: any;
  }
}

export const initKakao = (apiKey?: string) => {
  const finalKey = apiKey || process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;
  if (typeof window !== 'undefined' && window.Kakao && finalKey && !window.Kakao.isInitialized()) {
    try {
      window.Kakao.init(finalKey);
    } catch (e) {
      console.warn("Kakao SDK Initialization failed:", e);
    }
  }
};

export const shareMealToKakao = (date: string, schoolName: string, menu: string) => {
  if (typeof window === 'undefined' || !window.Kakao || !window.Kakao.isInitialized()) {
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

export const shareTimetableToKakao = (date: string, schoolName: string, grade: string, classNum: string, timetable: string) => {
  if (typeof window === 'undefined' || !window.Kakao || !window.Kakao.isInitialized()) {
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
