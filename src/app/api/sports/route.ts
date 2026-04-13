import { NextResponse } from 'next/server';
import axios from 'axios';

/**
 * @fileOverview KST HUB 통합 스포츠 API (KBO 네이버 공식 API + K리그 RapidAPI)
 * 
 * - GET: 실시간 데이터 수집 및 통합 반환
 */

export async function GET() {
  try {
    // 1. 한국 시간(KST) 기준 오늘 날짜 구하기 (YYYYMMDD)
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset);
    const todayStr = kstDate.toISOString().split('T')[0].replace(/-/g, '');

    // 2. KBO 데이터 수집 (네이버 공식 데이터 API - 크롤링보다 안정적)
    let kboGames: any[] = [];
    try {
      const kboUrl = `https://api-gw.sports.naver.com/schedule/games?category=kbo&date=${todayStr}`;
      const kboRes = await axios.get(kboUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Referer": "https://sports.news.naver.com/kbaseball/index"
        },
        timeout: 5000
      });

      if (kboRes.data?.result?.games) {
        kboGames = kboRes.data.result.games.map((g: any) => ({
          league: "KBO",
          time: g.startTime || "미정",
          teams: `${g.awayTeamName} vs ${g.homeTeamName}`,
          score: g.gameState === 'BEFORE' ? "경기 전" : `${g.awayTeamScore}:${g.homeTeamScore}`,
          status: g.gameState // BEFORE, RUNNING, END, CANCEL
        }));
      }
    } catch (e) {
      console.error("KBO API Fetch Error:", e);
    }

    // 3. K리그 데이터 수집 (RapidAPI)
    const API_KEY = "18d3e84e0351d299a100acfae51ad8e3";
    async function getKLeague(leagueId: number, name: string) {
      try {
        const res = await axios.get(
          "https://api-football-v1.p.rapidapi.com/v3/fixtures",
          {
            params: {
              league: leagueId,
              next: 10
            },
            headers: {
              "x-rapidapi-key": API_KEY,
              "x-rapidapi-host": "api-football-v1.p.rapidapi.com"
            },
            timeout: 5000
          }
        );

        if (!res.data || !res.data.response) return [];

        return res.data.response.map((g: any) => ({
          league: name,
          time: new Date(g.fixture.date).toLocaleString('ko-KR', { 
            month: 'numeric', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          teams: `${g.teams.home.name} vs ${g.teams.away.name}`,
          score: g.goals.home !== null ? `${g.goals.home}:${g.goals.away}` : "경기 전",
          status: g.fixture.status.short
        }));
      } catch (e) {
        return [];
      }
    }

    const [k1, k2] = await Promise.all([
      getKLeague(292, "K리그1"),
      getKLeague(293, "K리그2")
    ]);

    return NextResponse.json({
      kbo: kboGames,
      kleague1: k1,
      kleague2: k2
    });

  } catch (err: any) {
    return NextResponse.json({
      kbo: [],
      kleague1: [],
      kleague2: [],
      error: err.message
    }, { status: 500 });
  }
}
