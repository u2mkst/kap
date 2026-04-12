
import { NextResponse } from 'next/server';
import axios from 'axios';

/**
 * @fileOverview KST HUB 통합 스포츠 API (KBO 네이버 API + K리그 RapidAPI)
 */

export async function GET() {
  try {
    // 한국 시간(KST) 기준 오늘 날짜 구하기 (YYYYMMDD)
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset);
    const todayStr = kstDate.toISOString().split('T')[0].replace(/-/g, '');

    // 1. ⚾ KBO 데이터 수집 (네이버 스포츠 공식 API)
    // 네이버 스포츠 일정 페이지는 클라이언트 사이드 렌더링(JS)이므로 
    // HTML 파싱보다는 네이버가 내부적으로 사용하는 데이터 API를 직접 호출하는 것이 100% 정확합니다.
    const kboUrl = `https://api-gw.sports.naver.com/schedule/games?category=kbo&date=${todayStr}`;
    const kboHeaders = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Referer": "https://sports.news.naver.com/kbaseball/schedule/index",
      "Accept": "application/json, text/plain, */*",
      "Origin": "https://sports.news.naver.com"
    };

    const kboRes = await axios.get(kboUrl, { headers: kboHeaders, timeout: 5000 });
    const kboGames = kboRes.data?.result?.games?.map((g: any) => {
      const isBefore = g.gameState === 'BEFORE';
      return {
        league: "KBO",
        time: g.startTime || '미정',
        teams: `${g.awayTeamName} vs ${g.homeTeamName}`,
        score: isBefore ? "경기 전" : `${g.awayTeamScore} : ${g.homeTeamScore}`,
        status: g.gameState // BEFORE, RUNNING, AFTER 등
      };
    }) || [];

    // 2. ⚽ K리그 데이터 수집 (RapidAPI - 사용자 제공 키 사용)
    const FOOTBALL_API_KEY = "18d3e84e0351d299a100acfae51ad8e3";
    
    async function getKLeagueFixtures(leagueId: number, name: string) {
      try {
        const res = await axios.get("https://api-football-v1.p.rapidapi.com/v3/fixtures", {
          params: { 
            league: leagueId, 
            season: 2024,
            next: 5 // 다음 5경기 정보
          },
          headers: {
            "x-rapidapi-key": FOOTBALL_API_KEY,
            "x-rapidapi-host": "api-football-v1.p.rapidapi.com"
          },
          timeout: 5000
        });
        
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
          status: g.fixture.status.short // LIVE, FT, NS 등
        }));
      } catch (e) {
        console.error(`RapidAPI Error (${name}):`, e);
        return [];
      }
    }

    // 병렬 데이터 수집
    const [k1, k2] = await Promise.all([
      getKLeagueFixtures(292, "K리그1"),
      getKLeagueFixtures(293, "K리그2")
    ]);

    return NextResponse.json({
      kbo: kboGames,
      kleague1: k1,
      kleague2: k2
    });

  } catch (error: any) {
    console.error("Sports API Global Error:", error.message);
    return NextResponse.json({
      kbo: [],
      kleague1: [],
      kleague2: [],
      error: "데이터를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요."
    });
  }
}
