/**
 * @fileOverview 나이스(NEIS) 오픈 API 연동 서비스
 */

const BASE_URL = 'https://open.neis.go.kr/hub';
const API_KEY = process.env.NEXT_PUBLIC_NEIS_API_KEY;

async function fetchNeis(endpoint: string, params: Record<string, string>) {
  const urlParams = new URLSearchParams({
    Type: 'json',
    pIndex: '1',
    pSize: '20',
    ...(API_KEY ? { KEY: API_KEY } : {}),
    ...params,
  });

  try {
    const response = await fetch(`${BASE_URL}/${endpoint}?${urlParams.toString()}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`NEIS API Error (${endpoint}):`, error);
    return null;
  }
}

/** 학교 정보 검색 (학교 코드를 찾기 위함) */
export async function searchSchool(schoolName: string) {
  const data = await fetchNeis('schoolInfo', { SCHUL_NM: schoolName });
  if (!data?.schoolInfo) return null;
  return data.schoolInfo[1].row[0];
}

/** 오늘의 급식 정보 가져오기 */
export async function getTodayMeals(officeCode: string, schoolCode: string, date: string) {
  const data = await fetchNeis('mealServiceDietInfo', {
    ATPT_OFCDC_SC_CODE: officeCode,
    SD_SCHUL_CODE: schoolCode,
    MLSV_YMD: date,
  });
  if (!data?.mealServiceDietInfo) return null;
  
  const rawMenu = data.mealServiceDietInfo[1].row[0].DDISH_NM;
  return rawMenu.replace(/\([^)]*\)/g, '').replace(/[0-9.]/g, '').split('<br/>').join(', ');
}

/** 오늘의 시간표 가져오기 */
export async function getTodayTimetable(
  officeCode: string, 
  schoolCode: string, 
  date: string, 
  grade: string, 
  classNum: string, 
  schoolKind: string
) {
  // 학교 종류에 따른 엔드포인트 결정
  let endpoint = 'misTimetable'; // 기본 중학교
  if (schoolKind.includes('초등')) endpoint = 'elsTimetable';
  else if (schoolKind.includes('고등')) endpoint = 'hisTimetable';
  
  const data = await fetchNeis(endpoint, {
    ATPT_OFCDC_SC_CODE: officeCode,
    SD_SCHUL_CODE: schoolCode,
    ALL_TI_YMD: date,
    GRADE: grade,
    CLASS_NM: classNum
  });

  if (!data || !data[endpoint]) return "오늘의 시간표 정보가 없습니다.";
  
  const rows = data[endpoint][1].row;
  // 교시순으로 정렬하여 과목명 나열
  return rows
    .sort((a: any, b: any) => parseInt(a.PERIO) - parseInt(b.PERIO))
    .map((r: any) => `${r.PERIO}교시:${r.ITRT_CNTNT}`)
    .join(', ');
}
