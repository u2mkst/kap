
/**
 * @fileOverview 카카오톡 공유 API 헬퍼
 */

declare global {
  interface Window {
    Kakao: any;
  }
}

const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY || 'YOUR_KAKAO_JS_KEY';

export const initKakao = () => {
  if (typeof window !== 'undefined' && window.Kakao && !window.Kakao.isInitialized()) {
    window.Kakao.init(KAKAO_KEY);
  }
};

export const shareMealToKakao = (date: string, schoolName: string, menu: string) => {
  if (typeof window === 'undefined' || !window.Kakao) return;
  
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
  if (typeof window === 'undefined' || !window.Kakao) return;
  
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
