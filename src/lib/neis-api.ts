
/**
 * @fileOverview 나이스(NEIS) 오픈 API 연동 서비스
 */

const BASE_URL = 'https://open.neis.go.kr/hub';
const API_KEY = '19f78fd07bfb4243a6333e7bf4641bfc';

async function fetchNeis(endpoint: string, params: Record<string, string>) {
  const urlParams = new URLSearchParams({
    Type: 'json',
    pIndex: '1',
    pSize: '1000',
    KEY: API_KEY,
    ...params,
  });

  try {
    const response = await fetch(`${BASE_URL}/${endpoint}?${urlParams.toString()}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`NEIS API Error (${endpoint}):`, error);
    return null;
  }
}

/** 급식 메뉴 클리닝 (레거시 로직 반영) */
function cleanMeal(menu: string) {
  if (!menu) return "";
  return menu
    .replace(/<br\/>/g, ', ')
    .replace(/\([^)]*\)/g, '')
    .replace(/[0-9.]/g, '')
    .trim();
}

/** 학교 정보 검색 */
export async function searchSchool(schoolName: string) {
  const data = await fetchNeis('schoolInfo', { SCHUL_NM: schoolName });
  if (!data?.schoolInfo) return null;
  return data.schoolInfo[1].row;
}

/** 주간 급식 정보 가져오기 */
export async function getWeeklyMeals(officeCode: string, schoolCode: string, fromDate: string, toDate: string) {
  const data = await fetchNeis('mealServiceDietInfo', {
    ATPT_OFCDC_SC_CODE: officeCode,
    SD_SCHUL_CODE: schoolCode,
    MLSV_FROM_YMD: fromDate,
    MLSV_TO_YMD: toDate,
  });
  
  if (!data?.mealServiceDietInfo) return [];
  
  return data.mealServiceDietInfo[1].row.map((r: any) => ({
    date: r.MLSV_YMD,
    menu: cleanMeal(r.DDISH_NM)
  }));
}

/** 주간 시간표 가져오기 */
export async function getWeeklyTimetable(
  officeCode: string, 
  schoolCode: string, 
  fromDate: string, 
  toDate: string,
  grade: string, 
  classNum: string, 
  schoolType: string
) {
  let endpoint = 'misTimetable'; 
  if (schoolType?.includes('초등')) endpoint = 'elsTimetable';
  else if (schoolType?.includes('고등')) endpoint = 'hisTimetable';
  
  // 학년과 반 정보는 입력된 값 그대로 사용 (패딩 없이)
  const g = grade?.toString().replace(/[^0-9]/g, '') || "1";
  const c = classNum?.toString().replace(/[^0-9]/g, '') || "1";

  const data = await fetchNeis(endpoint, {
    ATPT_OFCDC_SC_CODE: officeCode,
    SD_SCHUL_CODE: schoolCode,
    TI_FROM_YMD: fromDate,
    TI_TO_YMD: toDate,
    GRADE: g,
    CLASS_NM: c
  });

  if (!data || !data[endpoint]) return [];
  
  const rows = data[endpoint][1].row;
  if (!rows) return [];
  
  const grouped = rows.reduce((acc: any, curr: any) => {
    const date = curr.ALL_TI_YMD || curr.TI_FROM_YMD || curr.MLSV_YMD;
    if (!date) return acc;
    if (!acc[date]) acc[date] = [];
    acc[date].push({ perio: curr.PERIO, content: curr.ITRT_CNTNT });
    return acc;
  }, {});

  return Object.keys(grouped).map(date => ({
    date,
    timetable: grouped[date]
      .sort((a: any, b: any) => parseInt(a.perio) - parseInt(b.perio))
      .map((t: any) => `${t.perio}교시:${t.content}`)
      .join(',')
  }));
}
