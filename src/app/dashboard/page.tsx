
"use client"

import { useMemo, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { 
  Trophy, 
  Utensils, 
  Zap, 
  Sparkles,
  Clock,
  School,
  CheckCircle2,
  Loader2,
  Maximize2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clover,
  Share2,
  Quote,
  CalendarCheck,
  History
} from "lucide-react"
import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from "@/firebase"
import { doc, updateDoc, increment, serverTimestamp, query, collection, orderBy, limit, setDoc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { getWeeklyMeals, getWeeklyTimetable } from "@/lib/neis-api"
import { format, startOfWeek, addDays, addWeeks, subDays } from "date-fns"
import { ko } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { initKakao, shareMealToKakao, shareTimetableToKakao } from "@/lib/kakao-share"

export default function DashboardPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()

  const [todayStr, setTodayStr] = useState<string>("")
  const [isGeneratingLuck, setIsGeneratingLuck] = useState(false)
  const [displayScore, setDisplayScore] = useState(0)
  const [isCheckingIn, setIsCheckingIn] = useState(false)

  const [weeklyMeals, setWeeklyMeals] = useState<{date: string, menu: string}[]>([])
  const [weeklyTimetable, setWeeklyTimetable] = useState<{date: string, timetable: string}[]>([])
  const [isLoadingWeekly, setIsLoadingWeekly] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)
  const [weekDates, setWeekDates] = useState<Date[]>([])

  const [showTutorial, setShowTutorial] = useState(false)
  const [tutorialStep, setTutorialStep] = useState(0)

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null
    return doc(db, "users", user.uid)
  }, [user, db])

  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef)

  const configRef = useMemoFirebase(() => doc(db, "metadata", "config"), [db])
  const { data: configData } = useDoc(configRef)

  useEffect(() => {
    if (configData?.kakaoApiKey) initKakao(configData.kakaoApiKey);
  }, [configData])

  useEffect(() => {
    if (userData && userData.hasCompletedTutorial === false) setShowTutorial(true)
  }, [userData])

  useEffect(() => {
    const targetDate = addWeeks(new Date(), weekOffset)
    const start = startOfWeek(targetDate, { weekStartsOn: 1 })
    const dates = Array.from({ length: 5 }).map((_, i) => addDays(start, i))
    setWeekDates(dates)
  }, [weekOffset])

  const fetchWeeklyData = async () => {
    if (!userData?.officeCode || !userData?.schoolCode || weekDates.length === 0) return;
    
    setIsLoadingWeekly(true)
    try {
      const fromDate = format(weekDates[0], "yyyyMMdd")
      const toDate = format(weekDates[4], "yyyyMMdd")

      const [meals, table] = await Promise.all([
        getWeeklyMeals(userData.officeCode, userData.schoolCode, fromDate, toDate),
        getWeeklyTimetable(userData.officeCode, userData.schoolCode, fromDate, toDate, userData.grade, userData.classNum, userData.schoolType)
      ])
      
      setWeeklyMeals(meals || [])
      setWeeklyTimetable(table || [])
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoadingWeekly(false)
    }
  }

  useEffect(() => {
    setTodayStr(format(new Date(), "yyyy-MM-dd"))
  }, [])

  useEffect(() => {
    if (userData?.officeCode && weekDates.length > 0) fetchWeeklyData()
  }, [userData?.officeCode, weekDates])

  const todayMeal = useMemo(() => {
    const today = todayStr.replace(/-/g, "")
    return weeklyMeals.find(m => m.date === today)?.menu || ""
  }, [weeklyMeals, todayStr])

  const todayTable = useMemo(() => {
    const today = todayStr.replace(/-/g, "")
    return weeklyTimetable.find(t => t.date === today)?.timetable || ""
  }, [weeklyTimetable, todayStr])

  const leaderboardQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "users"), orderBy("points", "desc"), limit(10))
  }, [db, user])
  const { data: topUsers } = useCollection(leaderboardQuery)

  const fortuneRef = useMemoFirebase(() => todayStr ? doc(db, "daily_fortunes", todayStr) : null, [db, todayStr])
  const personalFortuneRef = useMemoFirebase(() => (db && user && todayStr) ? doc(db, "users", user.uid, "personal_fortunes", todayStr) : null, [db, user, todayStr])
  const attendanceHistoryQuery = useMemoFirebase(() => (db && user) ? query(collection(db, "users", user.uid, "attendance_logs"), orderBy("date", "desc")) : null, [db, user])

  const { data: fortuneData } = useDoc(fortuneRef)
  const { data: personalFortuneData } = useDoc(personalFortuneRef)
  const { data: attendanceHistory } = useCollection(attendanceHistoryQuery)

  useEffect(() => {
    if (personalFortuneData?.score) {
      let start = 0;
      const end = personalFortuneData.score;
      const timer = setInterval(() => {
        start += (end / 50);
        if (start >= end) { setDisplayScore(end); clearInterval(timer); }
        else { setDisplayScore(Math.floor(start)); }
      }, 20);
      return () => clearInterval(timer);
    }
  }, [personalFortuneData?.score]);

  const handleGenerateLuckyScore = async () => {
    if (!user || !personalFortuneRef || personalFortuneData || isGeneratingLuck || !todayStr) return
    setIsGeneratingLuck(true)
    const randomScore = Math.floor(Math.random() * 41) + 60; 
    try {
      await setDoc(personalFortuneRef, { score: randomScore, date: todayStr, createdAt: serverTimestamp() })
    } finally { setIsGeneratingLuck(false) }
  }

  const handleAttendance = async () => {
    if (!user || !userData || !userDocRef || !todayStr) return
    if (userData.lastAttendanceDate === todayStr) {
      toast({ title: "이미 오늘 출석하셨습니다!" })
      return
    }

    setIsCheckingIn(true)
    try {
      const yesterdayStr = format(subDays(new Date(), 1), "yyyy-MM-dd")
      let newStreak = (userData.lastAttendanceDate === yesterdayStr) ? (userData.attendanceStreak || 0) + 1 : 1
      const points = configData?.pointConfig?.dailyAttendance || 100
      let bonus = 0
      if (newStreak === 7) bonus = configData?.pointConfig?.streak7 || 1000
      else if (newStreak === 30) bonus = configData?.pointConfig?.streak30 || 5000

      await setDoc(doc(db, "users", user.uid, "attendance_logs", todayStr), { date: todayStr, timestamp: serverTimestamp() })
      await updateDoc(userDocRef, {
        points: increment(points + bonus),
        lastAttendanceDate: todayStr,
        attendanceStreak: newStreak,
        updatedAt: serverTimestamp()
      })
      toast({ title: "출석 완료!", description: bonus > 0 ? `보너스 포함 ${points + bonus}P 지급!` : `${points}P 지급!` })
    } finally { setIsCheckingIn(false) }
  }

  const completeTutorial = async () => {
    if (!userDocRef) return
    await updateDoc(userDocRef, { hasCompletedTutorial: true, updatedAt: serverTimestamp() })
    setShowTutorial(false)
  }

  const handleShareMeal = (date: string, menu: string) => {
    if (!userData?.schoolName) return;
    shareMealToKakao(date, userData.schoolName, menu, configData?.kakaoApiKey);
  };

  const handleShareTimetable = (date: string, timetable: string) => {
    if (!userData?.schoolName || !userData?.grade || !userData?.classNum) return;
    shareTimetableToKakao(date, userData.schoolName, userData.grade, userData.classNum, timetable, configData?.kakaoApiKey);
  };

  useEffect(() => {
    if (!isUserLoading && !user) router.push("/login")
  }, [user, isUserLoading, router])

  if (isUserLoading || isUserDataLoading || !user) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 animate-pulse" />
            <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-primary animate-bounce-slow" />
          </div>
          <p className="text-sm font-black text-primary/60 animate-pulse">KST HUB 로딩 중...</p>
        </div>
      </div>
    )
  }

  const tutorialSteps = [
    { title: "환영합니다! 👋", description: "KST HUB에 오신 것을 환영해요.", icon: <Sparkles className="h-12 w-12 text-primary" /> },
    { title: "출석 보상", description: "매일 출석하고 보너스 포인트를 받으세요.", icon: <CalendarDays className="h-12 w-12 text-primary" /> },
    { title: "학교 정보", description: "오늘의 급식과 시간표를 한눈에!", icon: <Utensils className="h-12 w-12 text-primary" /> },
    { title: "랭킹 도전", description: "포인트를 모아 1위에 도전하세요.", icon: <Trophy className="h-12 w-12 text-yellow-500" /> }
  ]

  const hasCheckedInToday = userData?.lastAttendanceDate === todayStr

  // 시간표 정렬 유틸리티
  const getSortedTable = (timetableStr: string) => {
    if (!timetableStr) return [];
    return timetableStr.split(',')
      .map(t => t.trim())
      .sort((a, b) => {
        const pA = parseInt(a.split('교시')[0]) || 0;
        const pB = parseInt(b.split('교시')[0]) || 0;
        return pA - pB;
      });
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl animate-in fade-in duration-500">
      <Dialog open={showTutorial} onOpenChange={setShowTutorial}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-8">
          <DialogHeader>
            <DialogTitle>KST HUB 시작 가이드</DialogTitle>
            <DialogDescription>앱의 주요 기능을 소개합니다.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="p-4 rounded-[2rem] bg-primary/10">{tutorialSteps[tutorialStep].icon}</div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black">{tutorialSteps[tutorialStep].title}</h2>
              <p className="text-sm font-bold text-muted-foreground">{tutorialSteps[tutorialStep].description}</p>
            </div>
            <div className="flex gap-2 w-full">
              {tutorialStep > 0 && <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setTutorialStep(s => s - 1)}>이전</Button>}
              <Button className="flex-[2] rounded-xl" onClick={() => tutorialStep < 3 ? setTutorialStep(s => s + 1) : completeTutorial()}>
                {tutorialStep < 3 ? "다음" : "시작하기"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">{userData?.nickname || "학생"}님, 반가워요!</h1>
          <Badge variant="secondary" className="mt-1">
            {userData?.schoolName || "학교 정보 없음"} {userData?.grade || '0'}학년 {userData?.classNum || '0'}반
          </Badge>
        </div>
        <Card className="bg-primary text-white p-4 rounded-2xl flex items-center gap-4 shadow-lg">
          <Zap className="h-5 w-5" />
          <div>
            <p className="text-[10px] opacity-80 uppercase font-black">Points</p>
            <p className="text-xl font-black">{userData?.points?.toLocaleString() || 0} P</p>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold flex items-center gap-2"><School className="h-5 w-5 text-primary" /> 학교 소식</h2>
            <Dialog>
              <DialogTrigger asChild><Button variant="outline" size="sm" className="rounded-full" onClick={fetchWeeklyData}><Maximize2 className="h-3 w-3 mr-1" /> 전체 보기</Button></DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-3xl">
                <DialogHeader>
                  <DialogTitle>주간 정보</DialogTitle>
                  <DialogDescription>이번 주 급식과 시간표입니다.</DialogDescription>
                </DialogHeader>
                <div className="flex justify-between mb-4">
                  <Button variant="ghost" onClick={() => setWeekOffset(w => w - 1)} className="rounded-full"><ChevronLeft /></Button>
                  <Button variant="ghost" onClick={() => setWeekOffset(w => w + 1)} className="rounded-full"><ChevronRight /></Button>
                </div>
                <Tabs defaultValue="meals">
                  <TabsList className="w-full grid grid-cols-2 p-1 bg-muted/50 rounded-2xl">
                    <TabsTrigger value="meals" className="rounded-xl">급식</TabsTrigger>
                    <TabsTrigger value="timetable" className="rounded-xl">시간표</TabsTrigger>
                  </TabsList>
                  <TabsContent value="meals" className="space-y-4 pt-4">
                    {weekDates.map((d, i) => {
                      const dStr = format(d, "yyyyMMdd");
                      const meal = weeklyMeals.find(m => m.date === dStr);
                      return (
                        <div key={i} className="p-4 bg-muted/30 rounded-2xl flex justify-between items-center">
                          <div className="flex-grow">
                            <p className="text-xs font-black text-primary">{format(d, "MM/dd (E)", { locale: ko })}</p>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {meal ? meal.menu.split(',').map((m, idx) => (
                                <Badge key={idx} variant="outline" className="text-[10px] bg-white/50 border-primary/10">{m.trim()}</Badge>
                              )) : <span className="text-sm font-bold opacity-40">정보 없음</span>}
                            </div>
                          </div>
                          {meal && <Button variant="ghost" size="icon" className="rounded-full ml-2" onClick={() => handleShareMeal(dStr, meal.menu)}><Share2 className="h-4 w-4" /></Button>}
                        </div>
                      )
                    })}
                  </TabsContent>
                  <TabsContent value="timetable" className="space-y-4 pt-4">
                    {weekDates.map((d, i) => {
                      const dStr = format(d, "yyyyMMdd");
                      const table = weeklyTimetable.find(t => t.date === dStr);
                      const sorted = table ? getSortedTable(table.timetable) : [];
                      return (
                        <div key={i} className="p-4 bg-muted/30 rounded-2xl">
                          <div className="flex justify-between items-center mb-3">
                            <p className="text-xs font-black text-primary">{format(d, "MM/dd (E)", { locale: ko })}</p>
                            {table && <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={() => handleShareTimetable(dStr, table.timetable)}><Share2 className="h-4 w-4" /></Button>}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {sorted.length > 0 ? sorted.map((t, idx) => {
                              const [p, c] = t.split(':');
                              return (
                                <div key={idx} className="bg-background/50 p-2 rounded-xl border border-primary/5 flex flex-col items-center">
                                  <span className="text-[9px] font-black text-primary/60">{p}</span>
                                  <span className="text-xs font-black truncate w-full text-center">{c}</span>
                                </div>
                              )
                            }) : <p className="col-span-full text-xs text-center py-4 font-bold opacity-40 italic">시간표 정보가 없습니다.</p>}
                          </div>
                        </div>
                      )
                    })}
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-card">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-black flex items-center gap-2"><Utensils className="h-4 w-4 text-primary" /> 오늘 급식</CardTitle>
                {todayMeal && <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleShareMeal(todayStr.replace(/-/g, ""), todayMeal)}><Share2 className="h-4 w-4 text-foreground" /></Button>}
              </CardHeader>
              <CardContent className="min-h-[120px]">
                {isLoadingWeekly ? (
                  <div className="flex justify-center items-center h-20"><Loader2 className="animate-spin text-primary" /></div>
                ) : todayMeal ? (
                  <div className="grid gap-2">
                    {todayMeal.split(',').map((m, i) => (
                      <div key={i} className="p-3 bg-primary/5 rounded-2xl border border-primary/10 text-xs font-bold text-primary">{m.trim()}</div>
                    ))}
                  </div>
                ) : <p className="text-sm text-center py-8 text-muted-foreground font-bold italic">급식 정보가 없습니다.</p>}
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-card">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-black flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> 오늘 시간표</CardTitle>
                {todayTable && <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleShareTimetable(todayStr.replace(/-/g, ""), todayTable)}><Share2 className="h-4 w-4 text-foreground" /></Button>}
              </CardHeader>
              <CardContent>
                {isLoadingWeekly ? (
                  <div className="flex justify-center items-center h-20"><Loader2 className="animate-spin text-primary" /></div>
                ) : todayTable ? (
                  <div className="space-y-2">
                    {getSortedTable(todayTable).map((t, i) => {
                      const [perio, content] = t.split(':');
                      return (
                        <div key={i} className="flex items-center gap-4 text-xs font-bold p-3 bg-muted/30 rounded-2xl border border-transparent hover:border-primary/20 transition-all">
                          <span className="text-primary w-10">{perio}</span>
                          <span className="text-foreground">{content}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : <p className="text-sm text-center py-8 text-muted-foreground font-bold italic">시간표 정보가 없습니다.</p>}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="rounded-3xl border-none shadow-sm bg-card">
              <CardHeader><CardTitle className="text-sm font-black flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-primary" /> 출석 체크</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-muted-foreground">연속 <span className="text-primary font-black">{userData?.attendanceStreak || 0}일째</span> 출석 중</span>
                  {hasCheckedInToday && <CheckCircle2 className="h-5 w-5 text-primary" />}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAttendance} disabled={hasCheckedInToday || isCheckingIn} className="flex-grow rounded-2xl font-black h-11">
                    {hasCheckedInToday ? "출석 완료" : "오늘의 출석 체크"}
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild><Button variant="outline" size="icon" className="rounded-2xl h-11 w-11"><History className="h-4 w-4" /></Button></DialogTrigger>
                    <DialogContent className="rounded-3xl max-w-sm">
                      <DialogHeader>
                        <DialogTitle>출석 내역</DialogTitle>
                        <DialogDescription>지금까지의 성실한 기록입니다.</DialogDescription>
                      </DialogHeader>
                      <div className="p-2 bg-muted/20 rounded-2xl">
                        <Calendar 
                          mode="single" 
                          locale={ko} 
                          className="mx-auto"
                          components={{
                            DayContent: ({ date }) => {
                              const dStr = format(date, "yyyy-MM-dd");
                              const isAttended = attendanceHistory?.some(l => l.date === dStr);
                              return (
                                <div className="relative w-full h-full flex items-center justify-center p-0.5">
                                  <span className={cn("text-xs z-10", isAttended && "font-black")}>{date.getDate()}</span>
                                  {isAttended && (
                                    <div className="absolute inset-0 m-auto h-7 w-7 rounded-full bg-primary/10 border border-primary/20" />
                                  )}
                                </div>
                              )
                            }
                          }} 
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-none shadow-sm bg-card">
              <CardHeader><CardTitle className="text-sm font-black flex items-center gap-2"><Quote className="h-4 w-4 text-primary" /> 명언</CardTitle></CardHeader>
              <CardContent className="text-center py-4">
                <p className="text-xs italic font-bold text-foreground/80">"{fortuneData?.fortuneText || "멋진 하루를 만들어보세요!"}"</p>
                {fortuneData?.author && <p className="text-[10px] font-black mt-3 text-muted-foreground">- {fortuneData.author}</p>}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="md:col-span-4 space-y-6">
          <Card className="rounded-3xl border-none shadow-sm bg-card overflow-hidden">
            <CardHeader><CardTitle className="text-sm font-black flex items-center gap-2"><Clover className="h-4 w-4 text-green-500" /> 오늘의 행운 점수</CardTitle></CardHeader>
            <CardContent>
              {personalFortuneData ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-black text-primary">{displayScore}점</span>
                    <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/5 text-primary">
                      {personalFortuneData.score >= 90 ? "최고의 하루!" : personalFortuneData.score >= 75 ? "좋은 느낌!" : "보통이에요"}
                    </Badge>
                  </div>
                  <Progress value={displayScore} className="h-2 bg-muted" />
                </div>
              ) : (
                <Button onClick={handleGenerateLuckyScore} disabled={isGeneratingLuck} className="w-full rounded-2xl h-11 font-black bg-accent text-accent-foreground hover:bg-accent/90">
                  {isGeneratingLuck ? <Loader2 className="h-4 w-4 animate-spin" /> : "내 행운 점수 확인하기"}
                </Button>
              )}
            </CardContent>
          </Card>
          <Card className="rounded-3xl border-none shadow-sm bg-card">
            <CardHeader><CardTitle className="text-sm font-black flex items-center gap-2"><Trophy className="h-4 w-4 text-yellow-500" /> 랭킹 TOP 10</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {topUsers?.map((u, i) => (
                <div key={i} className={cn("flex justify-between items-center p-3 rounded-2xl text-xs font-bold", u.id === user?.uid ? "bg-primary/10 border border-primary/20" : "bg-muted/30")}>
                  <div className="flex items-center gap-3">
                    <span className={cn("w-4 text-center", i < 3 ? "text-primary font-black" : "text-muted-foreground")}>{i+1}</span>
                    <span>{u.nickname}</span>
                  </div>
                  <span className="font-black text-primary">{u.points.toLocaleString()} P</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
