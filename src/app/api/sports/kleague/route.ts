
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  try {
    // 한국 시간(KST) 기준 오늘 날짜 구하기
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset);
    const todayStr = kstDate.toISOString().split('T')[0].replace(/-/g, '');

    // K리그는 category=kleague로 호출하여 K1, K2 통합 수집
    const scheduleUrl = `https://api-gw.sports.naver.com/schedule/games?category=kleague&date=${todayStr}`;
    const rankingUrl = `https://api-gw.sports.naver.com/ranking/league?category=kleague`;
    
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Accept-Language": "ko-KR,ko;q=0.9"
    };

    const [scheduleRes, rankingRes] = await Promise.all([
      axios.get(scheduleUrl, { headers, timeout: 5000 }),
      axios.get(rankingUrl, { headers, timeout: 5000 })
    ]);

    const games = scheduleRes.data?.result?.games?.map((g: any) => {
      const isBefore = g.gameState === 'BEFORE';
      return {
        time: g.startTime || '미정',
        teams: `${g.awayTeamName} vs ${g.homeTeamName}`,
        score: isBefore ? "" : `${g.awayTeamScore} : ${g.homeTeamScore}`,
        status: g.gameState,
        leagueName: g.leagueName
      };
    }) || [];

    const rankings = rankingRes.data?.result?.rankings?.map((r: any) => ({
      rank: r.rank,
      teamName: r.teamName,
      gameCount: r.gameCount,
      won: r.won,
      lost: r.lost,
      drawn: r.drawn,
      point: r.point,
      lastResults: r.lastFiveGames
    })) || [];

    return NextResponse.json({ games, rankings });
  } catch (error) {
    console.error("K-League API Error:", error);
    return NextResponse.json({ error: "Failed to fetch K-League data" }, { status: 500 });
  }
}
