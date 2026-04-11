
import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function GET() {
  try {
    const url = "https://sports.news.naver.com/kbaseball/schedule/index";
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://sports.news.naver.com/'
      },
      timeout: 5000
    });
    const $ = cheerio.load(data);

    let games: any[] = [];

    // 네이버 스포츠 일정 테이블의 tr 요소를 순회
    $(".sch_tb tbody tr").each((i, el) => {
      const time = $(el).find(".td_date").text().trim();
      const teams = $(el).find(".td_vs").text().trim();
      const score = $(el).find(".td_score").text().trim();

      if (teams) {
        games.push({ time, teams, score });
      }
    });

    return NextResponse.json(games);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch KBO data" }, { status: 500 });
  }
}
