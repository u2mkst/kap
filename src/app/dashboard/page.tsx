
"use client"

import { useMemo, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
} from "@/components/ui/dialog"
import { 
  Trophy, 
  Utensils, 
  Zap, 
  ExternalLink,
  Sprout,
  Star,
  Sparkles,
  Clock,
  School,
  Medal,
  CheckCircle2,
  Loader2,
  GraduationCap,
  Maximize2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clover
} from "lucide-react"
import Link from "next/link"
import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from "@/firebase"
import { doc, updateDoc, increment, serverTimestamp, query, collection, orderBy, limit, setDoc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { searchSchool, getWeeklyMeals, getWeeklyTimetable } from "@/lib/neis-api"
import { format, startOfWeek, addDays, isSameDay, addWeeks } from "date-fns"
import { ko } from "date-fns/locale"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()

  const [todayStr, setTodayStr] = useState<string>("")
  const [userAnswer, setUserAnswer] = useState("")
  const [isSolving, setIsSolving] = useState(false)
  const [isSolved, setIsSolved] = useState(false)
  const [isGeneratingLuck, setIsGeneratingLuck] = useState(false)

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

  useEffect(() => {
    const targetDate = addWeeks(new Date(), weekOffset)
    const start = startOfWeek(targetDate, { weekStartsOn: 1 })
    const dates = Array.from({ length: 5 }).map((_, i) => addDays(start, i))
    setWeekDates(dates)
  }, [weekOffset])

  useEffect(() => {
    const now = new Date()
    setTodayStr(format(now, "yyyy-MM-dd"))

    if (userData?.schoolName && userData?.grade && userData?.classNum && weekDates.length > 0) {
      setIsLoadingWeekly(true)
      searchSchool(userData.schoolName).then(schoolInfo => {
        if (schoolInfo) {
          const officeCode = schoolInfo.ATPT_OFCDC_SC_CODE
          const schoolCode = schoolInfo.SD_SCHUL_CODE
          const schoolKind = userData.schoolType || schoolInfo.SCHUL_KND_NM
          
          const fromDate = format(weekDates[0], "yyyyMMdd")
          const toDate = format(weekDates[4], "yyyyMMdd")

          Promise.all([
            getWeeklyMeals(officeCode, schoolCode, fromDate, toDate),
            getWeeklyTimetable(officeCode, schoolCode, fromDate, toDate, userData.grade, userData.classNum, schoolKind)
          ]).then(([meals, table]) => {
            setWeeklyMeals(meals)
            setWeeklyTimetable(table)
          }).finally(() => {
            setIsLoadingWeekly(false)
          })
        }
      })
    }
  }, [userData, weekDates])

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
  const { data: topUsers, isLoading: isLeaderboardLoading } = useCollection(leaderboardQuery)

  const fortuneRef = useMemoFirebase(() => {
    if (!db || !todayStr) return null
    return doc(db, "daily_fortunes", todayStr)
  }, [db, todayStr])

  const personalFortuneRef = useMemoFirebase(() => {
    if (!db || !user || !todayStr) return null
    return doc(db, "users", user.uid, "personal_fortunes", todayStr)
  }, [db, user, todayStr])

  const problemRef = useMemoFirebase(() => {
    if (!db || !userData?.grade || !todayStr) return null
    return doc(db, "daily_problems", `${todayStr}_${userData.grade}`)
  }, [db, userData?.grade, todayStr])

  const { data: fortuneData } = useDoc(fortuneRef)
  const { data: personalFortuneData } = useDoc(personalFortuneRef)
  const { data: problemData } = useDoc(problemRef)

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
        toast({ title: "정답입니다!", description: `${problemData.rewardPoints || 100}포인트를 획득했습니다! 🎉` })
      } catch (error) {
        console.error(error)
      } finally {
        setIsSolving(false)
      }
    } else {
      toast({ variant: "destructive", title: "틀렸습니다.", description: "다시 한번 생각해보세요!" })
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
      toast({ title: "행운 점수 확인 완료!", description: `오늘 당신의 행운은 ${randomScore}점입니다! 🍀` })
    } catch (error) {
      console.error(error)
    } finally {
      setIsGeneratingLuck(false)
    }
  }

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

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 animate-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-headline tracking-tight">반가워요, {userData?.firstName}님!</h1>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px]">
                {userData?.schoolName || "학교 미설정"} {userData?.grade}학년 {userData?.classNum}반
              </Badge>
              {userData?.schoolType && (
                <Badge variant="outline" className="text-[10px] h-5 px-2 bg-card flex items-center gap-1">
                  <GraduationCap className="h-3 w-3" /> {userData.schoolType}
                </Badge>
              )}
              <Badge variant="secondary" className="bg-accent/10 text-accent-foreground border-none text-[10px]">
                Lv.{(Math.floor((userData?.points || 0) / 1000)) + 1}
              </Badge>
            </div>
          </div>
        </div>
        <Card className="w-full md:w-auto bg-primary text-primary-foreground border-none shadow-md px-6 py-3 flex items-center justify-between md:justify-start gap-6 hover:scale-[1.02] transition-transform">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full">
              <Sprout className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] opacity-80 leading-none mb-1">나의 보유 포인트</p>
              <p className="text-xl font-black">{userData?.points?.toLocaleString() || 0} P</p>
            </div>
          </div>
          <Link href="/plants">
            <Button size="sm" variant="secondary" className="font-bold text-xs bg-card text-primary hover:bg-card/90 rounded-full px-4 border-none">
              성장시키기
            </Button>
          </Link>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-8 space-y-6">
          <div className="flex justify-between items-center animate-in slide-in-from-left-4 duration-500">
            <h2 className="text-lg font-bold flex items-center gap-2 text-primary">
              <School className="h-5 w-5" /> 우리 학교 소식
            </h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold rounded-full border-primary/20 hover:bg-primary/5 text-primary shadow-sm bg-card">
                  <Maximize2 className="h-3 w-3 mr-1" /> 이번 주 전체 보기
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-none">
                <DialogHeader>
                  <div className="flex items-center justify-between w-full pr-8">
                    <DialogTitle className="flex items-center gap-2">
                      <CalendarDays className="h-5 w-5 text-primary" /> {userData?.schoolName} 주간 정보
                    </DialogTitle>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => setWeekOffset(prev => prev - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={() => setWeekOffset(0)}>오늘</Button>
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
                    <div className="grid gap-4">
                      {weekDates.map((date, idx) => {
                        const dStr = format(date, "yyyyMMdd")
                        const meal = weeklyMeals.find(m => m.date === dStr)
                        const isToday = todayStr && isSameDay(date, new Date(todayStr))
                        return (
                          <div key={idx} className={cn(
                            "p-4 rounded-2xl border transition-all animate-in slide-in-from-bottom-2",
                            isToday ? 'bg-primary/5 border-primary shadow-sm' : 'bg-muted/30 border-muted hover:bg-muted/50'
                          )}>
                            <div className="flex justify-between items-center mb-3">
                              <span className={`text-xs font-black ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>{format(date, "MM.dd (EEEE)", { locale: ko })}</span>
                              {isToday && <Badge className="bg-primary text-[10px] hover:bg-primary/90 border-none animate-pulse">TODAY</Badge>}
                            </div>
                            <div className="text-[13px] leading-relaxed font-medium">
                              {meal?.menu ? (
                                <div className="flex flex-wrap gap-x-2 gap-y-1">
                                  {meal.menu.split(',').map((item, i) => (
                                    <span key={i} className="bg-card/50 px-2 py-0.5 rounded-md border border-border/50 text-foreground">{item.trim()}</span>
                                  ))}
                                </div>
                              ) : "급식 정보가 없습니다."}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </TabsContent>
                  <TabsContent value="timetable" className="space-y-4">
                     <div className="grid gap-4">
                      {weekDates.map((date, idx) => {
                        const dStr = format(date, "yyyyMMdd")
                        const table = weeklyTimetable.find(t => t.date === dStr)
                        const isToday = todayStr && isSameDay(date, new Date(todayStr))
                        return (
                          <div key={idx} className={cn(
                            "p-4 rounded-2xl border transition-all animate-in slide-in-from-bottom-2",
                            isToday ? 'bg-accent/5 border-accent shadow-sm' : 'bg-muted/30 border-muted hover:bg-muted/50'
                          )}>
                            <div className="flex justify-between items-center mb-3">
                              <span className={`text-xs font-black ${isToday ? 'text-accent' : 'text-muted-foreground'}`}>{format(date, "MM.dd (EEEE)", { locale: ko })}</span>
                              {isToday && <Badge className="bg-accent text-accent-foreground text-[10px] hover:bg-accent/90 border-none animate-pulse">TODAY</Badge>}
                            </div>
                            <div className="flex flex-col gap-2">
                              {table ? table.timetable.split(',').map((t, i) => (
                                <div key={i} className="flex items-center gap-3 p-2 bg-card/60 border border-border/50 rounded-xl">
                                  <span className="w-10 text-[10px] text-primary font-bold text-center">{t.split(':')[0]}</span>
                                  <div className="h-4 w-px bg-border" />
                                  <span className="text-xs font-black text-foreground">{t.split(':')[1]}</span>
                                </div>
                              )) : <p className="text-xs text-muted-foreground py-2 text-center">시간표 정보가 없습니다.</p>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6 animate-in slide-in-from-bottom-4 duration-500">
            <Card className="border-none shadow-sm bg-card overflow-hidden rounded-3xl hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-foreground font-black">
                  <Utensils className="h-4 w-4 text-primary" /> 오늘의 급식
                </CardTitle>
              </CardHeader>
              <CardContent className="min-h-[120px]">
                {!userData?.schoolName ? (
                   <p className="text-xs text-muted-foreground/40 italic py-8 text-center">학교 정보를 설정해 주세요.</p>
                ) : isLoadingWeekly ? (
                  <div className="flex items-center justify-center h-full py-8 gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> <span className="text-xs">급식 정보를 불러오는 중...</span>
                  </div>
                ) : todayMeal ? (
                  <div className="flex flex-col gap-2">
                    {todayMeal.split(',').map((item, i) => (
                      <div key={i} className="bg-muted/30 p-3 rounded-xl border border-border/50 flex items-center gap-3 shadow-sm hover:translate-x-1 transition-transform">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span className="text-sm font-bold text-foreground">{item.trim()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground/50 italic py-8 text-center font-medium">급식 정보가 없습니다.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-card overflow-hidden rounded-3xl hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-foreground font-black">
                  <Clock className="h-4 w-4 text-accent-foreground" /> 오늘의 시간표
                </CardTitle>
              </CardHeader>
              <CardContent className="min-h-[120px]">
                {!userData?.schoolName ? (
                   <p className="text-xs text-muted-foreground/40 italic py-8 text-center">학교 정보를 설정해 주세요.</p>
                ) : isLoadingWeekly ? (
                  <div className="flex items-center justify-center h-full py-8 gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> <span className="text-xs">시간표를 불러오는 중...</span>
                  </div>
                ) : todayTable ? (
                  <div className="flex flex-col gap-2">
                    {todayTable.split(',').map((t, i) => (
                      <div key={i} className="bg-muted/30 p-3 rounded-xl border border-border/50 flex items-center gap-4 shadow-sm hover:translate-x-1 transition-transform">
                        <span className="text-xs font-black text-primary w-10 text-center">{t.split(':')[0]}</span>
                        <div className="h-4 w-px bg-border" />
                        <span className="text-sm font-black text-foreground">{t.split(':')[1]}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground/50 italic py-8 text-center font-medium">시간표 정보가 없습니다.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <Card className="border-none shadow-sm bg-card group hover:shadow-md transition-all rounded-3xl overflow-hidden animate-in zoom-in-95 duration-500">
              <CardHeader className="p-5">
                <CardTitle className="text-sm flex items-center gap-2 font-black text-primary">
                  <Sprout className="h-4 w-4 group-hover:animate-bounce" /> 나의 식물 키우기
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <div className="text-center">
                  <p className="text-xs mb-4 text-muted-foreground font-medium">학습 포인트로 식물을 무럭무럭 성장시키세요!</p>
                  <Link href="/plants">
                    <Button variant="outline" size="sm" className="rounded-full w-full border-primary/20 bg-card text-primary hover:bg-primary/5 text-xs font-black shadow-sm">
                      내 식물 정원 가기
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-card hover:bg-accent/5 transition-colors rounded-3xl overflow-hidden animate-in zoom-in-95 duration-500 delay-100">
              <CardHeader className="p-5">
                <CardTitle className="text-sm flex items-center gap-2 font-black">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 animate-spin-slow" /> 오늘의 한마디
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <div className="bg-muted/30 p-5 rounded-2xl italic text-[11px] text-center text-muted-foreground border border-border/50 leading-relaxed font-medium">
                  "{fortuneData?.fortuneText || "오늘도 당신의 멋진 성장을 응원합니다!"}"
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-sm bg-card overflow-hidden rounded-3xl animate-in slide-in-from-bottom-4 duration-500 delay-200">
            <CardHeader className="p-5">
              <CardTitle className="text-sm flex items-center gap-2 font-black">
                <Clover className="h-4 w-4 text-green-500" /> 오늘의 나의 행운점수🍀
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              {personalFortuneData ? (
                <div className="space-y-4 animate-in fade-in duration-700">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-primary">{personalFortuneData.score} <span className="text-sm font-bold opacity-40">/ 100</span></span>
                    <Badge className="bg-primary text-white border-none font-bold animate-bounce">
                      {personalFortuneData.score >= 90 ? "최고의 행운! ✨" : personalFortuneData.score >= 80 ? "운이 좋네요! 😊" : "무난한 하루! 👍"}
                    </Badge>
                  </div>
                  <Progress value={personalFortuneData.score} className="h-3 bg-muted" />
                  <p className="text-[11px] text-muted-foreground font-medium text-center italic">
                    행운은 기록되었습니다. 오늘 하루 동안 당신과 함께할 거예요!
                  </p>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-muted-foreground mb-4 font-medium">오늘 나의 행운은 몇 점일까요? 지금 확인해 보세요!</p>
                  <Button 
                    onClick={handleGenerateLuckyScore} 
                    disabled={isGeneratingLuck}
                    className="rounded-full bg-primary hover:bg-primary/90 text-white font-black text-xs px-8 shadow-sm active:scale-95 transition-transform"
                  >
                    {isGeneratingLuck ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Sparkles className="h-3 w-3 mr-2" />}
                    행운 점수 확인하기
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card overflow-hidden rounded-3xl animate-in slide-in-from-bottom-4 duration-500 delay-300">
            <CardHeader className="p-5">
              <CardTitle className="text-sm flex items-center gap-2 font-black">
                <Zap className="h-4 w-4 text-yellow-500 fill-yellow-500" /> 외부 학습 사이트
              </CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-3 p-5 pt-0">
              <a href="https://www.u2math.co.kr/Login/Index" target="_blank" rel="noopener noreferrer" className="group p-4 rounded-2xl border bg-card hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-between shadow-sm">
                <div>
                  <p className="font-black text-xs group-hover:text-primary transition-colors">유투엠 (U2M)</p>
                  <p className="text-[10px] text-muted-foreground font-medium">말하는 수학</p>
                </div>
                <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
              <a href="https://student.mathflat.com/#/history?_si=2" target="_blank" rel="noopener noreferrer" className="group p-4 rounded-2xl border bg-card hover:border-accent hover:bg-accent/5 transition-all flex items-center justify-between shadow-sm">
                <div>
                  <p className="font-black text-xs group-hover:text-accent-foreground transition-colors">매쓰플랫</p>
                  <p className="text-[10px] text-muted-foreground font-medium">맞춤형 수학 학습</p>
                </div>
                <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-accent-foreground transition-colors" />
              </a>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-4 space-y-6">
           <Card className="border-none shadow-sm bg-card overflow-hidden h-full rounded-3xl animate-in slide-in-from-right-4 duration-700">
            <CardHeader className="p-5 border-b mb-4 bg-muted/10">
              <CardTitle className="text-md flex items-center gap-2 font-black text-foreground">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" /> 오늘의 도전 문제
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              {problemData ? (
                <div className="p-5 rounded-3xl bg-primary/5 border border-primary/10 space-y-4 shadow-sm hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-1.5">
                    <Badge className="bg-primary text-white text-[9px] h-4 rounded-full border-none px-2">{problemData.topic}</Badge>
                    <Badge variant="outline" className="text-[9px] h-4 rounded-full bg-card border-primary/20 text-foreground">{problemData.difficulty}</Badge>
                    <Badge variant="secondary" className="text-[9px] h-4 rounded-full bg-accent/20 border-none font-bold text-foreground">{userData?.grade}학년</Badge>
                  </div>
                  <div>
                    <h3 className="font-black text-sm mb-2 text-primary">{problemData.title}</h3>
                    <p className="text-[11px] text-foreground leading-relaxed whitespace-pre-wrap font-medium">
                      {problemData.problemText}
                    </p>
                  </div>
                  <div className="space-y-2 pt-4 border-t border-border">
                    <Label className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">정답 입력</Label>
                    <div className="flex gap-2">
                      <input 
                        disabled={isSolved}
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="정답" 
                        className="h-9 w-full px-3 text-xs bg-card border rounded-xl focus:ring-1 focus:ring-primary outline-none transition-all text-foreground"
                        onKeyDown={(e) => e.key === 'Enter' && handleSolveProblem()}
                      />
                      <Button 
                        disabled={isSolved || isSolving || !userAnswer.trim()}
                        onClick={handleSolveProblem}
                        size="sm" 
                        className="h-9 px-5 rounded-xl bg-primary text-white text-[10px] font-black shadow-sm active:scale-95 border-none"
                      >
                        {isSolving ? <Loader2 className="h-3 w-3 animate-spin" /> : isSolved ? <CheckCircle2 className="h-3 w-3" /> : "제출"}
                      </Button>
                    </div>
                    {isSolved && <p className="text-[10px] text-primary font-black animate-bounce mt-2 text-center">정답입니다! +{problemData.rewardPoints}P ✨</p>}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-xs text-muted-foreground bg-muted/10 rounded-2xl border border-dashed font-medium italic border-border">
                  오늘의 문제가 준비 중입니다.
                </div>
              )}
            </CardContent>

            <CardHeader className="p-5 border-t border-b mt-4 bg-muted/10 border-border">
              <CardTitle className="text-md flex items-center gap-2 font-black text-foreground">
                <Trophy className="h-4 w-4 text-yellow-500 fill-yellow-500" /> 오늘의 포인트 TOP 10
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 p-5 pt-4">
              {isLeaderboardLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : (
                Array.from({ length: 10 }).map((_, index) => {
                  const rank = index + 1;
                  const u = topUsers?.[index];
                  const isMe = u?.id === user?.uid;
                  
                  return (
                    <div key={index} className={cn(
                      "flex items-center justify-between p-3 rounded-2xl transition-all animate-in slide-in-from-right-4",
                      `duration-${300 + (index * 100)}`,
                      isMe ? 'bg-primary/10 border border-primary/20 scale-[1.02] shadow-sm' : 'hover:bg-muted/30 border border-transparent'
                    )}>
                      <div className="flex items-center gap-3">
                        <div className="w-6 flex justify-center">
                          {rank === 1 ? (
                            <Medal className="h-5 w-5 text-yellow-500 animate-bounce-slow" />
                          ) : rank === 2 ? (
                            <Medal className="h-5 w-5 text-gray-400" />
                          ) : rank === 3 ? (
                            <Medal className="h-5 w-5 text-orange-400" />
                          ) : (
                            <span className="font-black text-xs text-muted-foreground/50">{rank}</span>
                          )}
                        </div>
                        <span className={`text-[11px] font-black tracking-tight ${isMe ? 'text-primary' : 'text-foreground'}`}>
                          {u ? (u.nickname || u.firstName || "-") : "-"}
                          {isMe && <span className="ml-1.5 text-[9px] font-bold opacity-60">(나)</span>}
                        </span>
                      </div>
                      <span className={`text-[11px] font-black ${isMe ? 'text-primary' : 'text-foreground'}`}>
                        {u ? u.points.toLocaleString() : "0"} <span className="text-[9px] font-bold opacity-50">P</span>
                      </span>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
