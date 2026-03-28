
"use client"

import { useMemo, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { 
  Trophy, 
  Utensils, 
  Zap, 
  ExternalLink,
  Flame,
  Sprout,
  Star,
  Sparkles,
  Search,
  Calendar,
  Clock,
  School
} from "lucide-react"
import Link from "next/link"
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"

// NEIS API KEY - 실제 키로 교체 필요
const NEIS_KEY = "여기에_NEIS_API_KEY";

export default function DashboardPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()

  // School Info State
  const [schoolName, setSchoolName] = useState("")
  const [grade, setGrade] = useState("")
  const [classNum, setClassNum] = useState("")
  const [mealData, setMealData] = useState<string>("")
  const [weekMealData, setWeekMealData] = useState<string[]>([])
  const [scheduleData, setScheduleData] = useState<string>("")
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login")
    }
  }, [user, isUserLoading, router])

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null
    return doc(db, "users", user.uid)
  }, [user, db])

  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef)

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])
  const todayCompact = useMemo(() => todayStr.replace(/-/g, ""), [todayStr])

  const fortuneRef = useMemoFirebase(() => doc(db, "daily_fortunes", todayStr), [db, todayStr])
  const problemRef = useMemoFirebase(() => doc(db, "daily_problems", todayStr), [db, todayStr])

  const { data: fortuneData } = useDoc(fortuneRef)
  const { data: problemData } = useDoc(problemRef)

  const loadSchoolInfo = async () => {
    if (!schoolName) return
    setIsSearching(true)
    try {
      // 1. 학교 정보 조회
      const schoolRes = await fetch(
        `https://open.neis.go.kr/hub/schoolInfo?Type=json&KEY=${NEIS_KEY}&SCHUL_NM=${schoolName}`
      );
      const schoolData = await schoolRes.json();
      if (!schoolData.schoolInfo) {
        setMealData("학교를 찾을 수 없습니다.");
        return;
      }
      const school = schoolData.schoolInfo[1].row[0];
      const EDU = school.ATPT_OFCDC_SC_CODE;
      const CODE = school.SD_SCHUL_CODE;

      // 2. 오늘 급식 조회
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

      // 3. 학사 일정 조회
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
  }

  if (isUserLoading || isUserDataLoading || !user) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
            <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/100/100`} />
            <AvatarFallback>{userData?.firstName || "학생"}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold font-headline">반가워요, {userData?.firstName}님! 👋</h1>
            <div className="flex gap-2 mt-1">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                <Flame className="h-3 w-3 mr-1 text-orange-500 fill-orange-500" /> {userData?.username}
              </Badge>
              <Badge variant="secondary" className="bg-accent/10 text-accent-foreground border-none">
                Lv.{(Math.floor((userData?.points || 0) / 1000)) + 1} 열혈학생
              </Badge>
            </div>
          </div>
        </div>
        <Card className="bg-primary text-primary-foreground border-none shadow-lg px-6 py-3 flex items-center gap-4">
          <div className="p-2 bg-white/20 rounded-full">
            <Sprout className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs opacity-80">보유 포인트</p>
            <p className="text-xl font-black">{userData?.points?.toLocaleString() || 0} P</p>
          </div>
          <Link href="/plants">
            <Button size="sm" variant="secondary" className="ml-2 font-bold text-xs bg-white text-primary hover:bg-white/90">
              식물 키우기
            </Button>
          </Link>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-8 space-y-6">
          {/* 학교 정보 조회 섹션 */}
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-primary">
                <School className="h-5 w-5" /> 우리 학교 정보 조회
              </CardTitle>
              <CardDescription>학교 이름을 입력하여 급식과 일정을 확인하세요.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <Input 
                  placeholder="학교 이름 (예: 서울고등학교)" 
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="flex-grow"
                />
                <div className="flex gap-2">
                  <Input placeholder="학년" className="w-16" value={grade} onChange={(e) => setGrade(e.target.value)} />
                  <Input placeholder="반" className="w-16" value={classNum} onChange={(e) => setClassNum(e.target.value)} />
                </div>
                <Button onClick={loadSchoolInfo} disabled={isSearching} className="bg-primary">
                  <Search className="h-4 w-4 mr-2" /> {isSearching ? "조회 중..." : "조회"}
                </Button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
                  <h3 className="font-bold text-orange-700 flex items-center gap-2 mb-2">
                    <Utensils className="h-4 w-4" /> 오늘 급식
                  </h3>
                  <p className="text-sm text-orange-900 leading-relaxed">
                    {mealData || "학교를 조회해주세요."}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <h3 className="font-bold text-blue-700 flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4" /> 오늘 학사일정
                  </h3>
                  <p className="text-sm text-blue-900 leading-relaxed">
                    {scheduleData || "학교를 조회해주세요."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500 fill-yellow-500" /> 외부 학습 사이트 바로가기
              </CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <a 
                href="https://www.u2math.co.kr/Login/Index" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group p-4 rounded-xl border hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-between"
              >
                <div>
                  <p className="font-bold group-hover:text-primary transition-colors">유투엠 (U2M)</p>
                  <p className="text-xs text-muted-foreground">말하는 수학, 질문하는 교실</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
              </a>
              <a 
                href="https://student.mathflat.com/#/history?_si=2" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group p-4 rounded-xl border hover:border-accent hover:bg-accent/5 transition-all flex items-center justify-between"
              >
                <div>
                  <p className="font-bold group-hover:text-accent transition-colors">매쓰플랫 (MathFlat)</p>
                  <p className="text-xs text-muted-foreground">맞춤형 수학 학습 서비스</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-accent" />
              </a>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <Card className="border-none shadow-sm bg-gradient-to-br from-green-50 to-emerald-50 group hover:shadow-md transition-all cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="text-md flex items-center gap-2">
                  <Sprout className="h-5 w-5 text-green-600" /> 나의 식물 키우기
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-sm font-medium mb-3">포인트를 투자해 식물을 성장시키세요!</p>
                  <Link href="/plants">
                    <Button variant="outline" size="sm" className="rounded-full w-full border-green-200 text-green-700 hover:bg-green-100">
                      식물 정원 가기
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white group hover:bg-accent/5 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="text-md flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" /> 오늘의 한마디
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/20 p-4 rounded-xl italic text-sm text-center">
                  "{fortuneData?.fortuneText || "오늘도 최고의 하루가 될 거예요. 당신의 성장을 응원합니다!"}"
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="md:col-span-4 space-y-6">
           <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> 오늘의 도전 문제
              </CardTitle>
              <CardDescription>문제를 풀고 포인트를 획득하세요!</CardDescription>
            </CardHeader>
            <CardContent>
              {problemData ? (
                <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-primary">{problemData.topic}</Badge>
                    <Badge variant="outline">{problemData.difficulty}</Badge>
                  </div>
                  <h3 className="font-bold text-lg mb-4">{problemData.title}</h3>
                  <p className="text-sm text-muted-foreground mb-6 line-clamp-3">
                    {problemData.problemText}
                  </p>
                  <Button className="w-full rounded-full bg-primary font-bold">문제 풀러 가기</Button>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  오늘의 문제가 준비 중입니다. 잠시만 기다려주세요!
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-primary">
                <Clock className="h-5 w-5" /> 오늘의 시간표
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-3 bg-muted/20 p-4 rounded-xl text-center">
                <p className="text-muted-foreground">학교를 조회하고 학년/반을 입력하면 시간표를 불러올 수 있습니다. (준비 중)</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500 fill-yellow-500" /> 이달의 학습왕
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "박지성", points: "4,250P", rank: 1 },
                { name: userData?.firstName || "나", points: `${userData?.points?.toLocaleString() || 0}P`, rank: 2 },
                { name: "이강인", points: "3,120P", rank: 3 },
              ].map((user) => (
                <div key={user.name} className={`flex items-center justify-between p-3 rounded-xl ${user.rank === 2 ? 'bg-primary/5 border border-primary/10' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className={`font-black text-sm w-4 ${user.rank === 1 ? 'text-yellow-600' : user.rank === 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                      {user.rank}
                    </span>
                    <span className="text-sm font-bold">{user.name}</span>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">{user.points}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
