
import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * @fileOverview 실시간 스포츠 데이터 수집 API (KBO 크롤링 + K리그 RapidAPI)
 */

export async function GET() {
  try {
    // =========================
    // ⚾ KBO (네이버 크롤링)
    // =========================
    const kboRes = await axios.get(
      "https://sports.news.naver.com/kbaseball/schedule/index",
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept-Language": "ko-KR,ko;q=0.9"
        },
        timeout: 5000
      }
    );

    const $ = cheerio.load(kboRes.data);
    let kboGames: any[] = [];

    $(".sch_tb tbody tr").each((i, el) => {
      const time = $(el).find(".td_date").text().trim();
      const teams = $(el).find(".td_vs").text().trim();
      const score = $(el).find(".td_score").text().trim();

      if (teams) {
        kboGames.push({
          league: "KBO",
          time,
          teams,
          score: score || "경기 전",
          status: score ? "LIVE/END" : "READY"
        });
      }
    });

    // =========================
    // ⚽ K리그1 + K리그2 (RapidAPI)
    // =========================
    const API_KEY = "18d3e84e0351d299a100acfae51ad8e3";

    async function getKLeague(leagueId: number, name: string) {
      try {
        const res = await axios.get(
          "https://api-football-v1.p.rapidapi.com/v3/fixtures",
          {
            params: {
              league: leagueId,
              season: 2024,
              next: 5 // 다음 5경기
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
        console.error(`Error fetching ${name}:`, e);
        return [];
      }
    }

    // 병렬로 데이터 수집
    const [k1, k2] = await Promise.all([
      getKLeague(292, "K리그1"),
      getKLeague(293, "K리그2")
    ]);

    // =========================
    // 최종 통합 응답
    // =========================
    return NextResponse.json({
      kbo: kboGames.slice(0, 10),
      kleague1: k1,
      kleague2: k2
    });

  } catch (err: any) {
    console.error("Sports API Error:", err);
    return NextResponse.json({
      error: "일시적으로 스포츠 데이터를 불러올 수 없습니다.",
      kbo: [],
      kleague1: [],
      kleague2: []
    }, { status: 200 }); // 500 에러 대신 빈 데이터 반환
  }
}
