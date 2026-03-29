/**
 * @fileOverview 나이스(NEIS) 오픈 API 연동 서비스
 */

const BASE_URL = 'https://open.neis.go.kr/hub';
const API_KEY = process.env.NEXT_PUBLIC_NEIS_API_KEY; // .env 파일에 추가 필요

async function fetchNeis(endpoint: string, params: Record<string, string>) {
  const urlParams = new URLSearchParams({
    Type: 'json',
    pIndex: '1',
    pSize: '10',
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
  return data.schoolInfo[1].row[0]; // 첫 번째 검색 결과 반환
}

/** 오늘의 급식 정보 가져오기 */
export async function getTodayMeals(officeCode: string, schoolCode: string, date: string) {
  const data = await fetchNeis('mealServiceDietInfo', {
    ATPT_OFCDC_SC_CODE: officeCode,
    SD_SCHUL_CODE: schoolCode,
    MLSV_YMD: date,
  });
  if (!data?.mealServiceDietInfo) return null;
  
  // 급식 메뉴 텍스트 정제 (특수문자 및 알레르기 번호 제거)
  const rawMenu = data.mealServiceDietInfo[1].row[0].DDISH_NM;
  return rawMenu.replace(/\([^)]*\)/g, '').replace(/[0-9.]/g, '').split('<br/>').join(', ');
}

/** 오늘의 학사 일정 가져오기 */
export async function getTodaySchedule(officeCode: string, schoolCode: string, date: string) {
  const data = await fetchNeis('SchoolSchedule', {
    ATPT_OFCDC_SC_CODE: officeCode,
    SD_SCHUL_CODE: schoolCode,
    AA_YMD: date,
  });
  if (!data?.SchoolSchedule) return "특별한 일정이 없습니다.";
  return data.SchoolSchedule[1].row[0].EVENT_NM;
}
