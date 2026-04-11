
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  try {
    // 한국 시간(KST) 기준 오늘 날짜 구하기
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset);
    const todayStr = kstDate.toISOString().split('T')[0].replace(/-/g, '');

    // 1. 경기 일정 API
    const scheduleUrl = `https://api-gw.sports.naver.com/schedule/games?category=kbo&date=${todayStr}`;
    // 2. 순위 API
    const rankingUrl = `https://api-gw.sports.naver.com/ranking/league?category=kbo`;
    
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
        stadium: g.stadium
      };
    }) || [];

    const rankings = rankingRes.data?.result?.rankings?.map((r: any) => ({
      rank: r.rank,
      teamName: r.teamName,
      gameCount: r.gameCount,
      won: r.won,
      lost: r.lost,
      drawn: r.drawn,
      winRate: r.winRate,
      lastResults: r.lastFiveGames
    })) || [];

    return NextResponse.json({ games, rankings });
  } catch (error) {
    console.error("KBO API Error:", error);
    return NextResponse.json({ error: "Failed to fetch KBO data" }, { status: 500 });
  }
}
