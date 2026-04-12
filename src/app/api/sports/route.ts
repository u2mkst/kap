
import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * @fileOverview KST HUB 실시간 스포츠 데이터 API (KBO 크롤링 + K리그 RapidAPI 통합)
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
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept-Language": "ko-KR,ko;q=0.9",
          "Referer": "https://sports.news.naver.com/kbaseball/index"
        },
        timeout: 8000
      }
    );

    const $ = cheerio.load(kboRes.data);
    let kboGames: any[] = [];

    $(".sch_tb tbody tr").each((i, el) => {
      const time = $(el).find(".td_date").text().trim();
      const teams = $(el).find(".td_vs").text().trim();
      const score = $(el).find(".td_score").text().trim();

      if (teams && teams !== "VS") {
        kboGames.push({
          league: "KBO",
          time: time || "진행중",
          teams,
          score: score || "경기 전",
          status: score ? "LIVE/END" : "READY"
        });
      }
    });

    // =========================
    // ⚽ K리그1 + K리그2 (RapidAPI)
    // =========================
    // API KEY에서 불필요한 공백/줄바꿈 제거
    const API_KEY = "18d3e84e0351d299a100acfae51ad8e3";

    async function getKLeague(leagueId: number, name: string) {
      try {
        const res = await axios.get(
          "https://api-football-v1.p.rapidapi.com/v3/fixtures",
          {
            params: {
              league: leagueId,
              season: 2024,
              next: 5 
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

    // 데이터 병렬 수집
    const [k1, k2] = await Promise.all([
      getKLeague(292, "K리그1"),
      getKLeague(293, "K리그2")
    ]);

    // =========================
    // 최종 통합 응답 반환
    // =========================
    return NextResponse.json({
      kbo: kboGames.slice(0, 10),
      kleague1: k1,
      kleague2: k2
    });

  } catch (err: any) {
    console.error("Sports API Error:", err);
    return NextResponse.json({
      error: "데이터 수집 중 오류가 발생했습니다.",
      kbo: [],
      kleague1: [],
      kleague2: []
    }, { status: 200 }); // 클라이언트 크래시 방지를 위해 200 OK와 빈 데이터 반환
  }
}
