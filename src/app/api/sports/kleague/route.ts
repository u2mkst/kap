
import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const league = searchParams.get('league') || 'kleague1';

  try {
    const url = `https://sports.news.naver.com/kfootball/schedule/index?competition=${league}`;
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://sports.news.naver.com/'
      },
      timeout: 5000
    });
    const $ = cheerio.load(data);

    let games: any[] = [];

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
    return NextResponse.json({ error: "Failed to fetch K-League data" }, { status: 500 });
  }
}
