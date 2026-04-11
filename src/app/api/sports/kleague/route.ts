
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  try {
    // 한국 시간(KST) 기준 오늘 날짜 구하기
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset);
    const todayStr = kstDate.toISOString().split('T')[0].replace(/-/g, '');

    // 네이버 스포츠 공식 API (JSON) - K리그는 category=kleague로 호출
    const url = `https://api-gw.sports.naver.com/schedule/games?category=kleague&date=${todayStr}`;
    
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9"
      },
      timeout: 5000
    });

    if (!data?.result?.games) {
      return NextResponse.json([]);
    }

    const games = data.result.games.map((g: any) => {
      const isBefore = g.gameState === 'BEFORE';
      return {
        time: g.startTime || '미정',
        teams: `${g.awayTeamName} vs ${g.homeTeamName}`,
        score: isBefore ? "" : `${g.awayTeamScore} : ${g.homeTeamScore}`
      };
    });

    return NextResponse.json(games);
  } catch (error) {
    console.error("K-League API Error:", error);
    return NextResponse.json({ error: "Failed to fetch K-League data" }, { status: 500 });
  }
}
