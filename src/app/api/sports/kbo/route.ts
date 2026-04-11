
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 한국 시간(KST) 기준 오늘 날짜 구하기
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset);
    const todayStr = kstDate.toISOString().split('T')[0].replace(/-/g, '');

    // 네이버 스포츠 공식 API (JSON)
    const scheduleUrl = `https://api-gw.sports.naver.com/schedule/games?category=kbo&date=${todayStr}`;
    const rankingUrl = `https://api-gw.sports.naver.com/ranking/league?category=kbo`;
    
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Accept": "application/json, text/plain, */*",
      "Referer": "https://sports.news.naver.com/kbaseball/index",
      "Origin": "https://sports.news.naver.com"
    };

    const [scheduleRes, rankingRes] = await Promise.all([
      fetch(scheduleUrl, { headers, next: { revalidate: 30 } }),
      fetch(rankingUrl, { headers, next: { revalidate: 60 } })
    ]);

    if (!scheduleRes.ok || !rankingRes.ok) {
      throw new Error('Naver API response was not ok');
    }

    const scheduleData = await scheduleRes.json();
    const rankingData = await rankingRes.json();

    const games = scheduleData?.result?.games?.map((g: any) => {
      const isBefore = g.gameState === 'BEFORE';
      return {
        time: g.startTime || '미정',
        teams: `${g.awayTeamName} vs ${g.homeTeamName}`,
        score: isBefore ? "" : `${g.awayTeamScore} : ${g.homeTeamScore}`,
        status: g.gameState,
        stadium: g.stadium
      };
    }) || [];

    const rankings = rankingData?.result?.rankings?.map((r: any) => ({
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
    // 500 에러 대신 빈 데이터와 에러 메시지를 반환하여 UI 크래시 방지
    return NextResponse.json({ 
      games: [], 
      rankings: [], 
      error: "데이터를 불러오는 중 오류가 발생했습니다." 
    }, { status: 200 });
  }
}
