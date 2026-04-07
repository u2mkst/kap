
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-primary leading-tight">
            {userData?.nickname || "학생"}님, <br className="sm:hidden" /> 반가워요!
          </h1>
          <Badge variant="secondary" className="mt-3 px-3 py-1 text-xs font-bold rounded-full">
            {userData?.schoolName || "학교 정보 없음"} {userData?.grade || '0'}학년 {userData?.classNum || '0'}반
          </Badge>
        </div>
        <Card className="bg-primary text-white p-5 rounded-3xl flex items-center gap-4 shadow-xl border-none w-full sm:w-auto">
          <div className="p-3 bg-white/20 rounded-2xl">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-[10px] opacity-80 uppercase font-black tracking-widest">Available Points</p>
            <p className="text-2xl font-black tabular-nums">{userData?.points?.toLocaleString() || 0} P</p>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black flex items-center gap-2 text-foreground/80"><School className="h-6 w-6 text-primary" /> 학교 소식</h2>
            <Dialog>
              <DialogTrigger asChild><Button variant="outline" size="sm" className="rounded-full font-bold" onClick={fetchWeeklyData}><Maximize2 className="h-3 w-3 mr-1" /> 자세히 보기</Button></DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col rounded-3xl p-0">
                <div className="p-6 border-b">
                  <DialogTitle className="text-xl font-black">주간 정보 가이드</DialogTitle>
                  <DialogDescription className="text-xs font-medium">이번 주 우리 학교의 급식과 시간표를 확인하세요.</DialogDescription>
                </div>
                <div className="p-4 bg-muted/20 flex justify-between items-center gap-4">
                  <Button variant="ghost" size="sm" onClick={() => setWeekOffset(w => w - 1)} className="rounded-full h-10 w-10 p-0"><ChevronLeft /></Button>
                  <span className="text-sm font-black text-primary">{format(weekDates[0], "yyyy.MM.dd")} ~ {format(weekDates[4], "MM.dd")}</span>
                  <Button variant="ghost" size="sm" onClick={() => setWeekOffset(w => w + 1)} className="rounded-full h-10 w-10 p-0"><ChevronRight /></Button>
                </div>
                <div className="flex-grow overflow-y-auto p-6 pt-2">
                  <Tabs defaultValue="meals">
                    <TabsList className="w-full grid grid-cols-2 p-1 bg-muted/50 rounded-2xl mb-6">
                      <TabsTrigger value="meals" className="rounded-xl font-black py-2">🍱 주간 급식</TabsTrigger>
                      <TabsTrigger value="timetable" className="rounded-xl font-black py-2">📚 주간 시간표</TabsTrigger>
                    </TabsList>
                    <TabsContent value="meals" className="space-y-4">
                      {weekDates.map((d, i) => {
                        const dStr = format(d, "yyyyMMdd");
                        const meal = weeklyMeals.find(m => m.date === dStr);
                        return (
                          <div key={i} className="p-5 bg-card border rounded-3xl flex justify-between items-start gap-4 transition-all hover:border-primary/30 group">
                            <div className="flex-grow">
                              <p className="text-xs font-black text-primary mb-3 bg-primary/5 w-fit px-3 py-1 rounded-full">{format(d, "MM/dd (E)", { locale: ko })}</p>
                              <div className="flex flex-wrap gap-2">
                                {meal ? meal.menu.split(',').map((m, idx) => (
                                  <div key={idx} className="text-xs font-bold px-3 py-1.5 bg-muted/30 rounded-xl border border-transparent group-hover:border-primary/10 transition-colors">{m.trim()}</div>
                                )) : <span className="text-sm font-bold opacity-30 italic py-2 px-1">등록된 급식 정보가 없습니다.</span>}
                              </div>
                            </div>
                            {meal && <Button variant="ghost" size="icon" className="rounded-full mt-1 shrink-0" onClick={() => handleShareMeal(dStr, meal.menu)}><Share2 className="h-4 w-4" /></Button>}
                          </div>
                        )
                      })}
                    </TabsContent>
                    <TabsContent value="timetable" className="space-y-4">
                      {weekDates.map((d, i) => {
                        const dStr = format(d, "yyyyMMdd");
                        const table = weeklyTimetable.find(t => t.date === dStr);
                        const sorted = table ? getSortedTable(table.timetable) : [];
                        return (
                          <div key={i} className="p-5 bg-card border rounded-3xl transition-all hover:border-primary/30">
                            <div className="flex justify-between items-center mb-4">
                              <p className="text-xs font-black text-primary bg-primary/5 px-3 py-1 rounded-full">{format(d, "MM/dd (E)", { locale: ko })}</p>
                              {table && <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={() => handleShareTimetable(dStr, table.timetable)}><Share2 className="h-4 w-4" /></Button>}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                              {sorted.length > 0 ? sorted.map((t, idx) => {
                                const [p, c] = t.split(':');
                                return (
                                  <div key={idx} className="bg-muted/20 p-2 rounded-2xl border border-transparent flex flex-col items-center gap-1 group-hover:bg-muted/40 transition-colors">
                                    <span className="text-[9px] font-black text-primary/50">{p}</span>
                                    <span className="text-xs font-black text-center truncate w-full">{c}</span>
                                  </div>
                                )
                              }) : <p className="col-span-full text-xs text-center py-6 font-bold opacity-30 italic">시간표 정보가 없습니다.</p>}
                            </div>
                          </div>
                        )
                      })}
                    </TabsContent>
                  </Tabs>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-card transition-all hover:shadow-md">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-black flex items-center gap-2"><Utensils className="h-4 w-4 text-primary" /> 오늘 급식</CardTitle>
                {todayMeal && <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleShareMeal(todayStr.replace(/-/g, ""), todayMeal)}><Share2 className="h-4 w-4 text-foreground" /></Button>}
              </CardHeader>
              <CardContent className="min-h-[140px]">
                {isLoadingWeekly ? (
                  <div className="flex flex-col justify-center items-center h-24 gap-2">
                    <Loader2 className="animate-spin text-primary h-6 w-6" />
                    <span className="text-[10px] font-bold text-muted-foreground">정보를 가져오는 중...</span>
                  </div>
                ) : todayMeal ? (
                  <div className="grid gap-2">
                    {todayMeal.split(',').map((m, i) => (
                      <div key={i} className="px-4 py-2.5 bg-primary/5 rounded-2xl border border-primary/10 text-xs font-bold text-primary transition-all hover:bg-primary/10">{m.trim()}</div>
                    ))}
                  </div>
                ) : <div className="flex flex-col items-center justify-center h-24 opacity-30"><Utensils className="h-8 w-8 mb-2" /><p className="text-xs font-bold italic">급식 정보가 없습니다.</p></div>}
              </CardContent>
            </Card>
            <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-card transition-all hover:shadow-md">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-black flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> 오늘 시간표</CardTitle>
                {todayTable && <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleShareTimetable(todayStr.replace(/-/g, ""), todayTable)}><Share2 className="h-4 w-4 text-foreground" /></Button>}
              </CardHeader>
              <CardContent>
                {isLoadingWeekly ? (
                  <div className="flex flex-col justify-center items-center h-24 gap-2">
                    <Loader2 className="animate-spin text-primary h-6 w-6" />
                    <span className="text-[10px] font-bold text-muted-foreground">정보를 가져오는 중...</span>
                  </div>
                ) : todayTable ? (
                  <div className="space-y-2">
                    {getSortedTable(todayTable).map((t, i) => {
                      const [perio, content] = t.split(':');
                      return (
                        <div key={i} className="flex items-center gap-4 text-xs font-bold p-3 bg-muted/30 rounded-2xl border border-transparent hover:border-primary/20 transition-all">
                          <span className="text-primary w-10 text-[10px] font-black">{perio}</span>
                          <span className="text-foreground tracking-tight">{content}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : <div className="flex flex-col items-center justify-center h-24 opacity-30"><Clock className="h-8 w-8 mb-2" /><p className="text-xs font-bold italic">시간표 정보가 없습니다.</p></div>}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="rounded-[2rem] border-none shadow-sm bg-card overflow-hidden">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-black flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-primary" /> 출석 체크</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center bg-muted/30 p-3 rounded-2xl">
                  <span className="text-xs font-bold text-muted-foreground">연속 <span className="text-primary font-black text-base">{userData?.attendanceStreak || 0}일째</span> 출석 중 🔥</span>
                  {hasCheckedInToday && <CheckCircle2 className="h-6 w-6 text-primary animate-in zoom-in" />}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAttendance} disabled={hasCheckedInToday || isCheckingIn} className="flex-grow rounded-2xl font-black h-12 shadow-md">
                    {hasCheckedInToday ? "오늘 출석 완료 ✨" : "오늘의 출석 체크"}
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild><Button variant="outline" size="icon" className="rounded-2xl h-12 w-12 border-muted hover:bg-muted/50"><History className="h-5 w-5" /></Button></DialogTrigger>
                    <DialogContent className="rounded-[2rem] max-w-[90vw] sm:max-w-sm p-0 overflow-hidden border-none shadow-2xl">
                      <div className="p-6 border-b bg-card">
                        <DialogTitle className="text-lg font-black flex items-center gap-2"><History className="h-5 w-5 text-primary" /> 출석 히스토리</DialogTitle>
                        <DialogDescription className="text-xs font-medium">성실함이 쌓여가는 멋진 기록입니다.</DialogDescription>
                      </div>
                      <div className="p-4 flex flex-col items-center bg-muted/10">
                        <div className="bg-white p-2 rounded-3xl shadow-sm border w-full max-w-full overflow-hidden flex justify-center">
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
                                    <span className={cn("text-xs z-10", isAttended && "font-black text-primary")}>{date.getDate()}</span>
                                    {isAttended && (
                                      <div className="absolute inset-0 m-auto h-7 w-7 rounded-full bg-primary/10 border border-primary/20 animate-in fade-in" />
                                    )}
                                  </div>
                                )
                              }
                            }} 
                          />
                        </div>
                        <div className="flex gap-4 mt-4 text-[10px] font-black opacity-60">
                          <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-primary/20 border border-primary/30" /> 출석 완료</div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-[2rem] border-none shadow-sm bg-card overflow-hidden">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-black flex items-center gap-2"><Quote className="h-4 w-4 text-primary" /> 오늘의 명언</CardTitle></CardHeader>
              <CardContent className="text-center py-6 flex flex-col items-center justify-center h-full min-h-[140px] px-6">
                <div className="relative">
                  <Quote className="absolute -top-4 -left-4 h-8 w-8 text-primary/5 rotate-180" />
                  <p className="text-sm italic font-black text-foreground/80 leading-relaxed z-10 relative">"{fortuneData?.fortuneText || "꿈을 향해 한 걸음 더 나아가는 하루 되세요!"}"</p>
                  <Quote className="absolute -bottom-4 -right-4 h-8 w-8 text-primary/5" />
                </div>
                {fortuneData?.author && <p className="text-[10px] font-black mt-5 text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">- {fortuneData.author}</p>}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="md:col-span-4 space-y-6">
          <Card className="rounded-[2rem] border-none shadow-xl bg-card overflow-hidden transition-all hover:-translate-y-1">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-black flex items-center gap-2"><Clover className="h-5 w-5 text-green-500" /> 오늘의 행운 점수</CardTitle></CardHeader>
            <CardContent className="p-6">
              {personalFortuneData ? (
                <div className="space-y-5">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-4xl font-black text-primary tracking-tighter">{displayScore}</span>
                      <span className="text-sm font-black text-primary/60 ml-1">점</span>
                    </div>
                    <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/5 text-primary text-[10px] font-black py-1 px-3 mb-1">
                      {personalFortuneData.score >= 90 ? "최고의 하루! ✨" : personalFortuneData.score >= 75 ? "좋은 느낌! 👍" : "보통이에요 🙂"}
                    </Badge>
                  </div>
                  <div className="relative">
                    <Progress value={displayScore} className="h-3 bg-muted rounded-full" />
                    <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
                </div>
              ) : (
                <Button onClick={handleGenerateLuckyScore} disabled={isGeneratingLuck} className="w-full rounded-2xl h-12 font-black bg-accent text-accent-foreground hover:bg-accent/90 shadow-md">
                  {isGeneratingLuck ? <Loader2 className="h-5 w-5 animate-spin" /> : "내 행운 점수 확인하기 🍀"}
                </Button>
              )}
            </CardContent>
          </Card>
          <Card className="rounded-[2rem] border-none shadow-sm bg-card overflow-hidden">
            <CardHeader className="border-b bg-muted/10 py-4"><CardTitle className="text-sm font-black flex items-center gap-2"><Trophy className="h-5 w-5 text-yellow-500" /> 랭킹 TOP 10</CardTitle></CardHeader>
            <CardContent className="p-4 space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
              {topUsers?.map((u, i) => (
                <div key={i} className={cn(
                  "flex justify-between items-center p-3.5 rounded-2xl text-xs font-bold transition-all", 
                  u.id === user?.uid ? "bg-primary text-white shadow-lg scale-[1.02]" : "bg-muted/30 hover:bg-muted/50"
                )}>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-black", 
                      i === 0 ? "bg-yellow-400 text-yellow-900" : 
                      i === 1 ? "bg-slate-300 text-slate-700" : 
                      i === 2 ? "bg-orange-300 text-orange-800" : "bg-muted-foreground/20 text-muted-foreground"
                    )}>{i+1}</span>
                    <span className="tracking-tight">{u.nickname}</span>
                  </div>
                  <span className={cn("font-black tabular-nums", u.id === user?.uid ? "text-white" : "text-primary")}>{u.points.toLocaleString()} P</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
