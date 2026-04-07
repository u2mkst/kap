
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
  Sprout, 
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
import { searchSchool, getWeeklyMeals, getWeeklyTimetable } from "@/lib/neis-api"
import { format, startOfWeek, addDays, isSameDay, addWeeks, subDays, parseISO } from "date-fns"
import { ko } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { initKakao, shareMealToKakao, shareTimetableToKakao } from "@/lib/kakao-share"

export default function DashboardPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()

  const [todayStr, setTodayStr] = useState<string>("")
  const [userAnswer, setUserAnswer] = useState("")
  const [isSolving, setIsSolving] = useState(false)
  const [isSolved, setIsSolved] = useState(false)
  const [isGeneratingLuck, setIsGeneratingLuck] = useState(false)
  const [displayScore, setDisplayScore] = useState(0)
  const [isCheckingIn, setIsCheckingIn] = useState(false)

  const [weeklyMeals, setWeeklyMeals] = useState<{date: string, menu: string}[]>([])
  const [weeklyTimetable, setWeeklyTimetable] = useState<{date: string, timetable: string}[]>([])
  const [isLoadingWeekly, setIsLoadingWeekly] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)
  const [weekDates, setWeekDates] = useState<Date[]>([])

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null
    return doc(db, "users", user.uid)
  }, [user, db])

  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef)

  const configRef = useMemoFirebase(() => doc(db, "metadata", "config"), [db])
  const { data: configData } = useDoc(configRef)

  useEffect(() => {
    if (configData?.kakaoApiKey) {
      initKakao(configData.kakaoApiKey);
    }
  }, [configData])

  useEffect(() => {
    const targetDate = addWeeks(new Date(), weekOffset)
    const start = startOfWeek(targetDate, { weekStartsOn: 1 })
    const dates = Array.from({ length: 5 }).map((_, i) => addDays(start, i))
    setWeekDates(dates)
  }, [weekOffset])

  const fetchWeeklyData = async () => {
    if (!userData?.schoolName || !userData?.grade || !userData?.classNum || weekDates.length === 0) return;
    
    setIsLoadingWeekly(true)
    try {
      const schoolInfo = await searchSchool(userData.schoolName)
      if (schoolInfo) {
        const officeCode = schoolInfo.ATPT_OFCDC_SC_CODE
        const schoolCode = schoolInfo.SD_SCHUL_CODE
        const schoolKind = userData.schoolType || schoolInfo.SCHUL_KND_NM
        
        const fromDate = format(weekDates[0], "yyyyMMdd")
        const toDate = format(weekDates[4], "yyyyMMdd")

        const [meals, table] = await Promise.all([
          getWeeklyMeals(officeCode, schoolCode, fromDate, toDate),
          getWeeklyTimetable(officeCode, schoolCode, fromDate, toDate, userData.grade, userData.classNum, schoolKind)
        ])
        
        setWeeklyMeals(meals || [])
        setWeeklyTimetable(table || [])
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoadingWeekly(false)
    }
  }

  useEffect(() => {
    const now = new Date()
    setTodayStr(format(now, "yyyy-MM-dd"))
  }, [])

  useEffect(() => {
    if (userData?.schoolName && weekDates.length > 0) {
      fetchWeeklyData()
    }
  }, [userData?.schoolName, weekDates])

  const todayMeal = useMemo(() => {
    if (!todayStr) return ""
    const today = todayStr.replace(/-/g, "")
    return weeklyMeals.find(m => m.date === today)?.menu || ""
  }, [weeklyMeals, todayStr])

  const todayTable = useMemo(() => {
    if (!todayStr) return ""
    const today = todayStr.replace(/-/g, "")
    return weeklyTimetable.find(t => t.date === today)?.timetable || ""
  }, [weeklyTimetable, todayStr])

  const leaderboardQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "users"), orderBy("points", "desc"), limit(10))
  }, [db, user])
  const { data: topUsers } = useCollection(leaderboardQuery)

  const fortuneRef = useMemoFirebase(() => {
    if (!db || !todayStr) return null
    return doc(db, "daily_fortunes", todayStr)
  }, [db, todayStr])

  const personalFortuneRef = useMemoFirebase(() => {
    if (!db || !user || !todayStr) return null
    return doc(db, "users", user.uid, "personal_fortunes", todayStr)
  }, [db, user, todayStr])

  const attendanceHistoryQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return collection(db, "users", user.uid, "attendance_logs")
  }, [db, user])
  const { data: attendanceHistory } = useCollection(attendanceHistoryQuery)

  const problemRef = useMemoFirebase(() => {
    if (!db || !userData?.grade || !todayStr) return null
    return doc(db, "daily_problems", `${todayStr}_${userData.grade}`)
  }, [db, userData?.grade, todayStr])

  const { data: fortuneData } = useDoc(fortuneRef)
  const { data: personalFortuneData } = useDoc(personalFortuneRef)
  const { data: problemData } = useDoc(problemRef)

  useEffect(() => {
    if (personalFortuneData?.score) {
      let start = 0;
      const end = personalFortuneData.score;
      const duration = 1000;
      const stepTime = 20;
      const totalSteps = duration / stepTime;
      const incrementValue = end / totalSteps;
      
      const timer = setInterval(() => {
        start += incrementValue;
        if (start >= end) {
          setDisplayScore(end);
          clearInterval(timer);
        } else {
          setDisplayScore(Math.floor(start));
        }
      }, stepTime);
      
      return () => clearInterval(timer);
    } else {
      setDisplayScore(0);
    }
  }, [personalFortuneData?.score]);

  const handleSolveProblem = async () => {
    if (!problemData || !userAnswer.trim() || isSolved || !userDocRef) return
    
    if (userAnswer.trim() === problemData.answer) {
      setIsSolving(true)
      try {
        await updateDoc(userDocRef, {
          points: increment(problemData.rewardPoints || 100),
          updatedAt: serverTimestamp()
        })
        setIsSolved(true)
        toast({ title: "정답입니다!" })
      } catch (error) {
        console.error(error)
      } finally {
        setIsSolving(false)
      }
    } else {
      toast({ variant: "destructive", title: "틀렸습니다." })
    }
  }

  const handleGenerateLuckyScore = async () => {
    if (!user || !personalFortuneRef || personalFortuneData || isGeneratingLuck || !todayStr) return
    
    setIsGeneratingLuck(true)
    const randomScore = Math.floor(Math.random() * 41) + 60; 
    
    try {
      await setDoc(personalFortuneRef, {
        score: randomScore,
        date: todayStr,
        createdAt: serverTimestamp()
      })
      toast({ title: "행운 점수 확인 완료!" })
    } catch (error) {
      console.error(error)
    } finally {
      setIsGeneratingLuck(false)
    }
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
      let newStreak = 1
      if (userData.lastAttendanceDate === yesterdayStr) {
        newStreak = (userData.attendanceStreak || 0) + 1
      }

      let bonusPoints = 100 
      let bonusMsg = "기본 출석 보상 100P 지급!"

      if (newStreak === 7) {
        bonusPoints += 1000
        bonusMsg = "7일 연속 출석 보너스! 1,100P 지급! 🎉"
      } else if (newStreak === 30) {
        bonusPoints += 5000
        bonusMsg = "30일 연속 출석 보너스! 5,100P 지급! 🏆"
      }

      const logRef = doc(db, "users", user.uid, "attendance_logs", todayStr)
      await setDoc(logRef, { date: todayStr, timestamp: serverTimestamp() })

      await updateDoc(userDocRef, {
        points: increment(bonusPoints),
        lastAttendanceDate: todayStr,
        attendanceStreak: newStreak,
        updatedAt: serverTimestamp()
      })

      toast({ title: "출석 체크 완료!", description: bonusMsg })
    } catch (e) {
      console.error(e)
    } finally {
      setIsCheckingIn(false)
    }
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
    if (!isUserLoading && !user) {
      router.push("/login")
    }
  }, [user, isUserLoading, router])

  if (isUserLoading || isUserDataLoading || !user) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const hasCheckedInToday = userData?.lastAttendanceDate === todayStr

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 animate-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-headline tracking-tight text-foreground">반가워요, {userData?.firstName}님!</h1>
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
        <Card className="w-full md:w-auto bg-primary text-primary-foreground border-none shadow-md px-6 py-3 flex items-center justify-between md:justify-start gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] opacity-80 leading-none mb-1">나의 보유 포인트</p>
              <p className="text-xl font-black">{userData?.points?.toLocaleString() || 0} P</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold flex items-center gap-2 text-primary">
              <School className="h-5 w-5" /> 우리 학교 소식
            </h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-[10px] font-bold rounded-full border-primary/20 hover:bg-primary/5 text-primary"
                  onClick={fetchWeeklyData}
                >
                  <Maximize2 className="h-3 w-3 mr-1" /> 이번 주 전체 보기
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-none">
                <DialogHeader>
                  <div className="flex items-center justify-between w-full pr-8">
                    <DialogTitle className="flex items-center gap-2 text-foreground font-black">
                      <CalendarDays className="h-5 w-5 text-primary" /> 주간 정보
                    </DialogTitle>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => setWeekOffset(prev => prev - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => setWeekOffset(prev => prev + 1)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </DialogHeader>
                <Tabs defaultValue="meals" className="w-full mt-4">
                  <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/50 p-1">
                    <TabsTrigger value="meals" className="text-xs font-bold">주간 급식</TabsTrigger>
                    <TabsTrigger value="timetable" className="text-xs font-bold">주간 시간표</TabsTrigger>
                  </TabsList>
                  <TabsContent value="meals" className="space-y-4">
                    {weekDates.map((date, idx) => {
                      const dStr = format(date, "yyyyMMdd")
                      const meal = weeklyMeals.find(m => m.date === dStr)
                      return (
                        <div key={idx} className="p-4 rounded-2xl border bg-muted/30">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-black text-muted-foreground">{format(date, "MM.dd (EEEE)", { locale: ko })}</span>
                            {meal?.menu && (
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={() => handleShareMeal(dStr, meal.menu)}>
                                <Share2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            {isLoadingWeekly ? (
                              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                            ) : meal?.menu ? (
                              meal.menu.split(',').map((item, i) => (
                                <div key={i} className="text-xs font-bold bg-card p-2 rounded-xl border shadow-sm">
                                  {item.trim()}
                                </div>
                              ))
                            ) : (
                              <p className="text-xs font-medium text-muted-foreground italic">정보가 없습니다.</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </TabsContent>
                  <TabsContent value="timetable" className="space-y-4">
                    {weekDates.map((date, idx) => {
                      const dStr = format(date, "yyyyMMdd")
                      const table = weeklyTimetable.find(t => t.date === dStr)
                      return (
                        <div key={idx} className="p-4 rounded-2xl border bg-muted/30">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-black text-muted-foreground">{format(date, "MM.dd (EEEE)", { locale: ko })}</span>
                            {table?.timetable && (
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-accent-foreground" onClick={() => handleShareTimetable(dStr, table.timetable)}>
                                <Share2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            {isLoadingWeekly ? <div className="flex justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div> : table ? table.timetable.split(',').map((t, i) => (
                              <div key={i} className="text-xs font-bold flex gap-2">
                                <span className="text-primary w-10">{t.split(':')[0]}</span>
                                <span>{t.split(':')[1]}</span>
                              </div>
                            )) : "정보가 없습니다."}
                          </div>
                        </div>
                      )
                    })}
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-none shadow-sm bg-card overflow-hidden rounded-3xl">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm flex items-center gap-2 text-foreground font-black">
                  <Utensils className="h-4 w-4 text-foreground" /> 오늘의 급식
                </CardTitle>
                {todayMeal && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground" onClick={() => handleShareMeal(todayStr.replace(/-/g, ""), todayMeal)}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="min-h-[100px] py-4">
                {isLoadingWeekly ? (
                  <div className="flex justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>
                ) : todayMeal ? (
                  <div className="grid gap-2">
                    {todayMeal.split(',').map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-2xl border border-transparent hover:border-primary/10 transition-all">
                        <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        <span className="text-sm font-bold leading-tight">{item.trim()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-bold text-center text-muted-foreground italic py-8">급식 정보가 없습니다.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-card overflow-hidden rounded-3xl">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm flex items-center gap-2 text-foreground font-black">
                  <Clock className="h-4 w-4 text-foreground" /> 오늘의 시간표
                </CardTitle>
                {todayTable && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground" onClick={() => handleShareTimetable(todayStr.replace(/-/g, ""), todayTable)}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="min-h-[100px] flex flex-col gap-2">
                {isLoadingWeekly ? <div className="flex justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div> : (
                  todayTable ? todayTable.split(',').map((t, i) => (
                    <div key={i} className="flex gap-4 p-2 bg-muted/30 rounded-xl">
                      <span className="text-xs font-black text-primary w-10">{t.split(':')[0]}</span>
                      <span className="text-xs font-bold">{t.split(':')[1]}</span>
                    </div>
                  )) : <p className="text-sm font-bold text-center py-4">시간표 정보가 없습니다.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden relative">
              <CardHeader className="p-5">
                <CardTitle className="text-sm flex items-center gap-2 font-black text-primary">
                  <CalendarCheck className="h-4 w-4" /> 일일 출석 체크
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-muted-foreground">연속 출석 {userData?.attendanceStreak || 0}일째</p>
                    <p className="text-[10px] text-muted-foreground/60 italic">7일 달성 시 보너스 1,000P!</p>
                  </div>
                  {hasCheckedInToday && <CheckCircle2 className="h-6 w-6 text-primary animate-in zoom-in" />}
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleAttendance} 
                    disabled={hasCheckedInToday || isCheckingIn} 
                    className={cn("flex-grow rounded-full font-black text-xs h-10 transition-all", hasCheckedInToday && "bg-muted text-muted-foreground")}
                  >
                    {isCheckingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : hasCheckedInToday ? "출석 완료" : "오늘의 출석 체크"}
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" className="h-10 w-10 rounded-full shrink-0 border-primary/20 text-primary hover:bg-primary/5">
                        <History className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md rounded-[2rem] bg-card border-none">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-primary font-black">
                          <History className="h-5 w-5" /> 나의 출석 내역
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                          파란색 점으로 표시된 날짜가 출석한 날입니다.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex justify-center py-4">
                        <Calendar
                          mode="single"
                          className="rounded-xl border-none"
                          locale={ko}
                          components={{
                            DayContent: (props) => {
                              const { date } = props
                              const dStr = format(date, "yyyy-MM-dd")
                              const isAttended = attendanceHistory?.some(log => log.date === dStr)
                              return (
                                <div className="relative w-full h-full flex items-center justify-center">
                                  <span>{date.getDate()}</span>
                                  {isAttended && (
                                    <div className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />
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

            <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden">
              <CardHeader className="p-5">
                <CardTitle className="text-sm flex items-center gap-2 font-black text-foreground">
                  <Quote className="h-4 w-4 text-primary fill-primary/10" /> 오늘의 명언
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <div className="text-center space-y-1">
                  <p className="text-xs italic font-medium leading-relaxed">"{fortuneData?.fortuneText || "멋진 하루 되세요!"}"</p>
                  {fortuneData?.author && (
                    <p className="text-[10px] text-muted-foreground font-bold">- {fortuneData.author}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-sm bg-card overflow-hidden rounded-3xl">
            <CardHeader className="p-5">
              <CardTitle className="text-sm flex items-center gap-2 font-black text-foreground">
                <Clover className="h-4 w-4 text-green-500" /> 오늘의 나의 행운점수🍀
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              {personalFortuneData ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-primary">{displayScore}점</span>
                    <Badge className="bg-primary text-white border-none">
                      {personalFortuneData.score >= 90 ? "최고의 행운! ✨" : "좋은 하루! 😊"}
                    </Badge>
                  </div>
                  <Progress value={displayScore} className="h-2 bg-muted" />
                </div>
              ) : (
                <div className="text-center py-4">
                  <Button onClick={handleGenerateLuckyScore} disabled={isGeneratingLuck} className="rounded-full bg-primary font-black text-xs px-8">
                    {isGeneratingLuck ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Sparkles className="h-3 w-3 mr-2" />}
                    행운 점수 확인
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-4 space-y-6">
           <Card className="border-none shadow-sm bg-card overflow-hidden rounded-3xl">
            <CardHeader className="p-5 border-b bg-muted/10">
              <CardTitle className="text-md flex items-center gap-2 font-black text-foreground">
                <Sparkles className="h-4 w-4 text-primary" /> 오늘의 도전 문제
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {problemData ? (
                <div className="space-y-4">
                  <p className="text-xs font-bold leading-relaxed">{problemData.problemText}</p>
                  <div className="flex gap-2">
                    <input 
                      disabled={isSolved}
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="정답" 
                      className="h-9 w-full px-3 text-xs bg-card border rounded-xl"
                    />
                    <Button onClick={handleSolveProblem} disabled={isSolved || isSolving} size="sm" className="font-black text-[10px]">제출</Button>
                  </div>
                </div>
              ) : <p className="text-xs text-center py-8">문제가 준비 중입니다.</p>}
            </CardContent>

            <CardHeader className="p-5 border-t border-b bg-muted/10">
              <CardTitle className="text-md flex items-center gap-2 font-black text-foreground">
                <Trophy className="h-4 w-4 text-yellow-500 fill-yellow-500" /> 포인트 랭킹
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-5">
              {topUsers?.map((u, index) => (
                <div key={index} className={cn("flex items-center justify-between p-2 rounded-xl text-[11px]", u.id === user?.uid && "bg-primary/10")}>
                  <div className="flex items-center gap-2">
                    <span className="w-4 font-black text-muted-foreground">{index + 1}</span>
                    <span className="font-bold">{u.nickname}</span>
                  </div>
                  <span className="font-black text-primary">{u.points.toLocaleString()}P</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
