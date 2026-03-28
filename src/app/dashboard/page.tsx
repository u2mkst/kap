
"use client"

import { useMemo, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Trophy, 
  Utensils, 
  Zap, 
  ExternalLink,
  Flame,
  Sprout,
  Star,
  Sparkles,
  Calendar,
  School,
  Settings,
  CircleUser
} from "lucide-react"
import Link from "next/link"
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"

// NEIS API KEY - 사용자가 직접 입력해야 함
const NEIS_KEY = "여기에_NEIS_API_KEY";

export default function DashboardPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()

  const [mealData, setMealData] = useState<string>("")
  const [scheduleData, setScheduleData] = useState<string>("")
  const [isSearching, setIsSearching] = useState(false)
  const [todayStr, setTodayStr] = useState<string | null>(null)

  useEffect(() => {
    setTodayStr(new Date().toISOString().split('T')[0])
  }, [])

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null
    return doc(db, "users", user.uid)
  }, [user, db])

  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef)

  const todayCompact = useMemo(() => todayStr?.replace(/-/g, "") || "", [todayStr])

  const fortuneRef = useMemoFirebase(() => {
    if (!db || !todayStr) return null
    return doc(db, "daily_fortunes", todayStr)
  }, [db, todayStr])

  const problemRef = useMemoFirebase(() => {
    if (!db || !todayStr) return null
    return doc(db, "daily_problems", todayStr)
  }, [db, todayStr])

  const { data: fortuneData } = useDoc(fortuneRef)
  const { data: problemData } = useDoc(problemRef)

  const loadSchoolInfo = useCallback(async (sName: string) => {
    if (!sName || NEIS_KEY === "여기에_NEIS_API_KEY" || !todayCompact) {
      if (NEIS_KEY === "여기에_NEIS_API_KEY") {
        setMealData("NEIS API 키가 설정되지 않았습니다.");
      }
      return;
    }
    setIsSearching(true)
    try {
      const schoolRes = await fetch(
        `https://open.neis.go.kr/hub/schoolInfo?Type=json&KEY=${NEIS_KEY}&SCHUL_NM=${sName}`
      );
      const sData = await schoolRes.json();
      if (!sData.schoolInfo) {
        setMealData("학교를 찾을 수 없습니다.");
        return;
      }
      const school = sData.schoolInfo[1].row[0];
      const EDU = school.ATPT_OFCDC_SC_CODE;
      const CODE = school.SD_SCHUL_CODE;

      const mealRes = await fetch(
        `https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&KEY=${NEIS_KEY}&ATPT_OFCDC_SC_CODE=${EDU}&SD_SCHUL_CODE=${CODE}&MLSV_YMD=${todayCompact}`
      );
      const mealJson = await mealRes.json();
      if (mealJson.mealServiceDietInfo) {
        const mealRaw = mealJson.mealServiceDietInfo[1].row[0].DDISH_NM;
        setMealData(mealRaw.split("<br/>").join(", "));
      } else {
        setMealData("오늘의 급식 정보가 없습니다.");
      }

      const scheduleRes = await fetch(
        `https://open.neis.go.kr/hub/SchoolSchedule?Type=json&KEY=${NEIS_KEY}&ATPT_OFCDC_SC_CODE=${EDU}&SD_SCHUL_CODE=${CODE}&AA_YMD=${todayCompact}`
      );
      const scheduleJson = await scheduleRes.json();
      if (scheduleJson.SchoolSchedule) {
        setScheduleData(scheduleJson.SchoolSchedule[1].row[0].EVENT_NM);
      } else {
        setScheduleData("오늘 예정된 일정이 없습니다.");
      }
    } catch (error) {
      console.error(error);
      setMealData("정보를 가져오는 중 오류가 발생했습니다.");
    } finally {
      setIsSearching(false)
    }
  }, [todayCompact])

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login")
    }
  }, [user, isUserLoading, router])

  useEffect(() => {
    if (userData?.schoolName && todayCompact) {
      loadSchoolInfo(userData.schoolName)
    }
  }, [userData, todayCompact, loadSchoolInfo])

  if (isUserLoading || isUserDataLoading || !user || !todayStr) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-14 w-14 border-4 border-white shadow-md">
            <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/100/100`} />
            <AvatarFallback>{userData?.firstName?.charAt(0) || "H"}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-headline">반가워요, {userData?.firstName}님!</h1>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px]">
                {userData?.schoolName} {userData?.grade}학년 {userData?.classNum}반
              </Badge>
              <Badge variant="secondary" className="bg-accent/10 text-accent-foreground border-none text-[10px]">
                Lv.{(Math.floor((userData?.points || 0) / 1000)) + 1}
              </Badge>
            </div>
          </div>
        </div>
        <Card className="w-full md:w-auto bg-primary text-primary-foreground border-none shadow-md px-4 py-3 flex items-center justify-between md:justify-start gap-4">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white/20 rounded-full">
              <Sprout className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] opacity-80 leading-none">포인트</p>
              <p className="text-lg font-black">{userData?.points?.toLocaleString() || 0} P</p>
            </div>
          </div>
          <Link href="/plants">
            <Button size="sm" variant="secondary" className="font-bold text-xs bg-white text-primary hover:bg-white/90">
              성장 시키기
            </Button>
          </Link>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-8 space-y-6">
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2 text-primary">
                  <School className="h-5 w-5" /> 우리 학교 소식
                </CardTitle>
                <CardDescription className="text-xs">오늘의 급식과 일정을 확인하세요.</CardDescription>
              </div>
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <Settings className="h-4 w-4 mr-1" /> 정보 수정
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {!userData?.schoolName && (
                <div className="text-center py-6 bg-muted/20 rounded-xl mb-4">
                  <p className="text-sm text-muted-foreground mb-3">회원 정보에 학교명이 설정되어 있지 않습니다.</p>
                  <Link href="/profile"><Button size="sm">학교 정보 설정하기</Button></Link>
                </div>
              )}
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
                  <h3 className="font-bold text-orange-700 flex items-center gap-2 mb-2 text-sm">
                    <Utensils className="h-4 w-4" /> 오늘 급식
                  </h3>
                  <div className="text-xs text-orange-900 leading-relaxed min-h-[40px]">
                    {mealData || (isSearching ? "로딩 중..." : "정보가 없습니다.")}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <h3 className="font-bold text-blue-700 flex items-center gap-2 mb-2 text-sm">
                    <Calendar className="h-4 w-4" /> 오늘 학사일정
                  </h3>
                  <div className="text-xs text-blue-900 leading-relaxed min-h-[40px]">
                    {scheduleData || (isSearching ? "로딩 중..." : "일정이 없습니다.")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <Card className="border-none shadow-sm bg-gradient-to-br from-green-50 to-emerald-50 group hover:shadow-md transition-all">
              <CardHeader className="p-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sprout className="h-4 w-4 text-green-600" /> 나의 식물 키우기
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-center">
                  <p className="text-xs mb-3">포인트를 투자해 식물을 성장시키세요!</p>
                  <Link href="/plants">
                    <Button variant="outline" size="sm" className="rounded-full w-full border-green-200 text-green-700 hover:bg-green-100 text-xs">
                      식물 정원 가기
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white hover:bg-accent/5 transition-colors">
              <CardHeader className="p-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /> 오늘의 한마디
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="bg-muted/20 p-3 rounded-lg italic text-[11px] text-center">
                  "{fortuneData?.fortuneText || "오늘도 당신의 성장을 응원합니다!"}"
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="p-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500 fill-yellow-500" /> 외부 학습 사이트
              </CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-3 p-4 pt-0">
              <a href="https://www.u2math.co.kr/Login/Index" target="_blank" rel="noopener noreferrer" className="group p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs group-hover:text-primary">유투엠 (U2M)</p>
                  <p className="text-[10px] text-muted-foreground">말하는 수학</p>
                </div>
                <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
              </a>
              <a href="https://student.mathflat.com/#/history?_si=2" target="_blank" rel="noopener noreferrer" className="group p-3 rounded-lg border hover:border-accent hover:bg-accent/5 transition-all flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs group-hover:text-accent">매쓰플랫</p>
                  <p className="text-[10px] text-muted-foreground">맞춤형 수학 학습</p>
                </div>
                <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-accent" />
              </a>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-4 space-y-6">
           <Card className="border-none shadow-sm bg-white">
            <CardHeader className="p-4">
              <CardTitle className="text-md flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> 오늘의 도전 문제
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {problemData ? (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Badge className="bg-primary text-[9px] h-4">{problemData.topic}</Badge>
                    <Badge variant="outline" className="text-[9px] h-4">{problemData.difficulty}</Badge>
                  </div>
                  <h3 className="font-bold text-sm mb-2">{problemData.title}</h3>
                  <p className="text-[11px] text-muted-foreground mb-4 line-clamp-2">
                    {problemData.problemText}
                  </p>
                  <Button size="sm" className="w-full rounded-full bg-primary text-xs font-bold">문제 풀러 가기</Button>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  오늘의 문제가 준비 중입니다.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="p-4">
              <CardTitle className="text-md flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500 fill-yellow-500" /> 오늘의 포인트 TOP 10
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0">
              {[
                { name: "김현우", points: "15,400P", rank: 1 },
                { name: "이지아", points: "12,850P", rank: 2 },
                { name: "최민준", points: "11,200P", rank: 3 },
                { name: "박서연", points: "9,800P", rank: 4 },
                { name: "정하늘", points: "8,500P", rank: 5 },
                { name: userData?.nickname || userData?.firstName || "나", points: `${userData?.points?.toLocaleString() || 0}P`, rank: 6 },
                { name: "윤도현", points: "7,200P", rank: 7 },
                { name: "한소희", points: "6,900P", rank: 8 },
                { name: "강동원", points: "5,400P", rank: 9 },
                { name: "임윤아", points: "4,200P", rank: 10 },
              ].map((u) => (
                <div key={u.name} className={`flex items-center justify-between p-2 rounded-lg ${u.rank === 6 ? 'bg-primary/5 border border-primary/10' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span className={`font-black text-xs w-5 ${u.rank === 1 ? 'text-yellow-600' : u.rank <= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                      {u.rank}
                    </span>
                    <span className="text-[11px] font-bold">{u.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground">{u.points}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
