
"use client"

import { useMemo, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"
import { 
  Utensils, 
  Zap, 
  Clock, 
  Loader2,
  Share2,
  Clover,
  Quote,
  CalendarCheck,
  BrainCircuit,
  Send,
  PartyPopper,
  Edit3,
  BookOpen
} from "lucide-react"
import { useUser, useDoc, useFirestore, useMemoFirebase, useAuth } from "@/firebase"
import { doc, updateDoc, increment, serverTimestamp, setDoc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { getWeeklyMeals, getWeeklyTimetable } from "@/lib/neis-api"
import { format, startOfWeek, addDays, addWeeks, subDays } from "date-fns"
import { initKakao, shareMealToKakao, shareTimetableToKakao, shareFortuneToKakao, shareQuoteToKakao } from "@/lib/kakao-share"

export default function DashboardPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()

  const [todayStr, setTodayStr] = useState<string>("")
  const [isGeneratingLuck, setIsGeneratingLuck] = useState(false)
  const [displayScore, setDisplayScore] = useState(0)
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [isUpdatingComment, setIsUpdatingComment] = useState(false)
  const [tempComment, setTempComment] = useState("")

  const [weeklyMeals, setWeeklyMeals] = useState<{date: string, menu: string}[]>([])
  const [weeklyTimetable, setWeeklyTimetable] = useState<{date: string, timetable: string}[]>([])
  const [isLoadingWeekly, setIsLoadingWeekly] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)
  const [weekDates, setWeekDates] = useState<Date[]>([])

  const [showTutorial, setShowTutorial] = useState(false)
  const [showNotice, setShowNotice] = useState(false)
  
  // 오늘의 문제 관련 상태
  const [userAnswer, setUserAnswer] = useState("")
  const [isSolving, setIsSolving] = useState(false)

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null
    return doc(db, "users", user.uid)
  }, [user, db])

  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef)

  const configRef = useMemoFirebase(() => doc(db, "metadata", "config"), [db])
  const { data: configData } = useDoc(configRef)

  useEffect(() => {
    if (configData?.kakaoApiKey) initKakao(configData.kakaoApiKey);
    if (configData?.notice) {
      const hasSeenNotice = sessionStorage.getItem(`notice_${configData.notice.substring(0, 10)}`)
      if (!hasSeenNotice) setShowNotice(true)
    }
  }, [configData])

  useEffect(() => {
    if (userData && userData.hasCompletedTutorial === false) {
      setShowTutorial(true)
    }
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

  const dailyProblemRef = useMemoFirebase(() => {
    if (!todayStr || !userData?.grade) return null
    return doc(db, "daily_problems", `${todayStr}_${userData.grade}`)
  }, [db, todayStr, userData?.grade])
  const { data: problemData } = useDoc(dailyProblemRef)

  const solvedProblemRef = useMemoFirebase(() => {
    if (!user || !todayStr) return null
    return doc(db, "users", user.uid, "solved_problems", todayStr)
  }, [db, user, todayStr])
  const { data: solvedData } = useDoc(solvedProblemRef)
  const isProblemSolved = !!solvedData

  const fortuneRef = useMemoFirebase(() => todayStr ? doc(db, "daily_fortunes", todayStr) : null, [db, todayStr])
  const personalFortuneRef = useMemoFirebase(() => (db && user && todayStr) ? doc(db, "users", user.uid, "personal_fortunes", todayStr) : null, [db, user, todayStr])
  const { data: fortuneData } = useDoc(fortuneRef)
  const { data: personalFortuneData } = useDoc(personalFortuneRef)

  useEffect(() => {
    if (personalFortuneData?.score) {
      let start = 0;
      const end = personalFortuneData.score;
      const timer = setInterval(() => {
        start += (end / 50);
        if (start >= end) { setDisplayScore(end); clearInterval(timer); }
        else { setDisplayScore(Math.floor(start)); }
      }, 20);
      setTempComment(personalFortuneData.comment || "")
      return () => clearInterval(timer);
    }
  }, [personalFortuneData?.score]);

  const handleGenerateLuckyScore = async () => {
    if (!user || !personalFortuneRef || personalFortuneData || isGeneratingLuck || !todayStr) return
    setIsGeneratingLuck(true)
    const randomScore = Math.floor(Math.random() * 41) + 60; 
    try {
      await setDoc(personalFortuneRef, { score: randomScore, date: todayStr, createdAt: serverTimestamp(), comment: "" })
    } finally { setIsGeneratingLuck(false) }
  }

  const handleAttendance = async () => {
    if (!user || !userData || !userDocRef || !todayStr) return
    if (userData.lastAttendanceDate === todayStr) return
    setIsCheckingIn(true)
    try {
      const yesterdayStr = format(subDays(new Date(), 1), "yyyy-MM-dd")
      let newStreak = (userData.lastAttendanceDate === yesterdayStr) ? (userData.attendanceStreak || 0) + 1 : 1
      const points = configData?.pointConfig?.dailyAttendance || 100
      await updateDoc(userDocRef, {
        points: increment(points),
        lastAttendanceDate: todayStr,
        attendanceStreak: newStreak,
        updatedAt: serverTimestamp()
      })
      toast({ title: "출석 완료!" })
    } finally { setIsCheckingIn(false) }
  }

  const handleSolveProblem = async () => {
    if (!problemData || !userAnswer.trim() || !userDocRef || !solvedProblemRef) return
    setIsSolving(true)
    try {
      if (userAnswer.trim() === problemData.answer) {
        const reward = problemData.rewardPoints || 100
        await setDoc(solvedProblemRef, { solved: true, solvedAt: serverTimestamp() })
        await updateDoc(userDocRef, { points: increment(reward), updatedAt: serverTimestamp() })
        toast({ title: "정답입니다! 🎉" })
      } else {
        toast({ variant: "destructive", title: "틀렸습니다. 😢" })
      }
    } finally { setIsSolving(false) }
  }

  const handleShareMeal = (date: string, menu: string) => {
    if (userData?.schoolName) shareMealToKakao(date, userData.schoolName, menu, configData?.kakaoApiKey);
  }

  const handleShareTimetable = (date: string, timetable: string) => {
    if (userData?.schoolName) shareTimetableToKakao(date, userData.schoolName, userData.grade, userData.classNum, timetable, configData?.kakaoApiKey);
  }

  useEffect(() => {
    if (!isUserLoading && !user) router.push("/login")
  }, [user, isUserLoading, router])

  if (isUserLoading || isUserDataLoading || !user) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-primary">
            {userData?.nickname || "학생"}님, 반갑습니다!
          </h1>
          <Badge variant="secondary" className="mt-2 px-4 py-1.5 rounded-full shadow-sm bg-card">
            {userData?.schoolName || "학교 정보 없음"} {userData?.grade || '0'}학년 {userData?.classNum || '0'}반
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {userData?.lastAttendanceDate !== todayStr && (
             <Button onClick={handleAttendance} disabled={isCheckingIn} className="h-12 rounded-3xl px-6 font-black bg-accent text-accent-foreground shadow-lg active:scale-95 transition-all">
               {isCheckingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CalendarCheck className="h-5 w-5 mr-2" /> 출석하기</>}
             </Button>
          )}
          <Link href="/plants">
            <Card className="bg-primary text-primary-foreground p-4 rounded-3xl flex items-center gap-4 shadow-xl border-none transform hover:scale-105 transition-transform">
              <Zap className="h-6 w-6" />
              <div>
                <p className="text-[10px] font-black opacity-80">보유 포인트</p>
                <p className="text-xl font-black tracking-tight">{userData?.points?.toLocaleString() || 0} P</p>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-8 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="rounded-[2.5rem] border-none shadow-sm bg-card">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-black flex items-center gap-2"><Utensils className="h-4 w-4 text-primary" /> 오늘 급식</CardTitle>
                {todayMeal && <Button variant="ghost" size="icon" onClick={() => handleShareMeal(todayStr.replace(/-/g, ""), todayMeal)}><Share2 className="h-4 w-4" /></Button>}
              </CardHeader>
              <CardContent>
                {todayMeal ? (
                  <div className="grid gap-2">
                    {todayMeal.split(',').map((m, i) => (
                      <div key={i} className="px-4 py-2 bg-primary/5 rounded-2xl border border-primary/10 text-xs font-bold">{m.trim()}</div>
                    ))}
                  </div>
                ) : <p className="text-xs font-bold opacity-30 italic text-center py-6">급식 정보가 없습니다.</p>}
              </CardContent>
            </Card>
            
            <Card className="rounded-[2.5rem] border-none shadow-sm bg-card">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-black flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> 오늘 시간표</CardTitle>
                {todayTable && <Button variant="ghost" size="icon" onClick={() => handleShareTimetable(todayStr.replace(/-/g, ""), todayTable)}><Share2 className="h-4 w-4" /></Button>}
              </CardHeader>
              <CardContent>
                {todayTable ? (
                  <div className="space-y-2">
                    {todayTable.split(',').map((t, i) => {
                      const [p, c] = t.split(':');
                      return (
                        <div key={i} className="flex items-center gap-4 text-xs font-bold p-3 bg-muted/30 rounded-2xl">
                          <span className="text-primary w-10 text-[10px] font-black">{p}</span>
                          <span className="text-foreground">{c}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : <p className="text-xs font-bold opacity-30 italic text-center py-6">시간표 정보가 없습니다.</p>}
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-[2.5rem] border-none shadow-xl bg-card">
            <CardHeader className="bg-primary/5 flex flex-row items-center justify-between border-b">
              <div className="flex items-center gap-3">
                <BrainCircuit className="h-6 w-6 text-primary" />
                <CardTitle className="text-base font-black">오늘의 도전 문제</CardTitle>
              </div>
              <Badge className="bg-primary text-white h-7 px-4 rounded-full font-black">
                {problemData?.rewardPoints || 0} P 보상
              </Badge>
            </CardHeader>
            <CardContent className="pt-6">
              {problemData ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-accent text-accent-foreground font-black">{problemData.topic}</Badge>
                    <Badge variant="outline" className="font-bold border-primary/20">난이도: {problemData.difficulty}</Badge>
                  </div>
                  <h3 className="text-lg font-black">{problemData.title}</h3>
                  <p className="text-sm font-bold text-muted-foreground bg-muted/20 p-5 rounded-3xl">{problemData.problemText}</p>
                  {isProblemSolved ? (
                    <div className="bg-primary/10 p-6 rounded-3xl flex flex-col items-center gap-2 border border-primary/20 animate-in zoom-in-95 duration-500">
                      <PartyPopper className="h-10 w-10 text-primary" />
                      <p className="text-base font-black text-primary">오늘의 문제 해결! 🎉</p>
                      <p className="text-xs font-bold opacity-50">내일 또 새로운 문제에 도전하세요.</p>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input 
                        placeholder="정답 입력" 
                        value={userAnswer} 
                        onChange={(e) => setUserAnswer(e.target.value)}
                        className="rounded-2xl h-12 bg-muted/30 border-none font-bold"
                      />
                      <Button onClick={handleSolveProblem} disabled={isSolving} className="h-12 rounded-2xl px-6 font-black bg-primary">
                        {isSolving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-2" /> 제출</>}
                      </Button>
                    </div>
                  )}
                </div>
              ) : <p className="text-center py-10 opacity-30 italic font-black">등록된 문제가 없습니다.</p>}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-4 space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-xl bg-card">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black flex items-center gap-2"><Clover className="h-5 w-5 text-green-500" /> 행운 점수</CardTitle>
              {personalFortuneData && <Button variant="ghost" size="icon" onClick={() => shareFortuneToKakao(personalFortuneData.score, userData.nickname, configData?.kakaoApiKey)}><Share2 className="h-4 w-4" /></Button>}
            </CardHeader>
            <CardContent className="p-6">
              {personalFortuneData ? (
                <div className="space-y-4 text-center">
                  <span className="text-5xl font-black text-primary">{displayScore}</span>
                  <Progress value={displayScore} className="h-3 rounded-full" />
                  <div className="pt-2">
                    {isUpdatingComment ? (
                      <div className="flex gap-1">
                        <Input 
                          placeholder="한마디..." 
                          value={tempComment} 
                          onChange={(e) => setTempComment(e.target.value)} 
                          className="h-8 text-xs rounded-xl"
                        />
                        <Button size="sm" className="h-8 rounded-xl px-3" onClick={async () => {
                           setIsUpdatingComment(false)
                           if (personalFortuneRef) await updateDoc(personalFortuneRef, { comment: tempComment })
                        }}>저장</Button>
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-muted-foreground flex items-center justify-center gap-2">
                        {personalFortuneData.comment || "오늘의 한마디를 남겨보세요!"}
                        <Edit3 className="h-3 w-3 cursor-pointer" onClick={() => setIsUpdatingComment(true)} />
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <Button onClick={handleGenerateLuckyScore} disabled={isGeneratingLuck} className="w-full h-12 rounded-2xl font-black bg-accent text-accent-foreground shadow-lg hover:shadow-accent/20 active:scale-95 transition-all">
                  {isGeneratingLuck ? <Loader2 className="h-5 w-5 animate-spin" /> : "행운 확인 🍀"}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-none shadow-sm bg-card overflow-hidden">
             <CardHeader className="border-b bg-muted/10 py-4 flex flex-row items-center justify-between">
               <CardTitle className="text-sm font-black flex items-center gap-2"><Quote className="h-5 w-5 text-accent" /> 오늘의 명언</CardTitle>
               {fortuneData && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => shareQuoteToKakao(fortuneData.fortuneText, fortuneData.author, configData?.kakaoApiKey)}><Share2 className="h-3.5 w-3.5" /></Button>}
             </CardHeader>
             <CardContent className="p-6">
                {fortuneData ? (
                  <div className="space-y-4">
                    <p className="text-sm font-black text-primary leading-relaxed italic">"{fortuneData.fortuneText}"</p>
                    <p className="text-[10px] font-bold text-muted-foreground text-right">- {fortuneData.author}</p>
                  </div>
                ) : <p className="text-[10px] font-bold opacity-30 italic text-center">오늘의 명언이 아직 없습니다.</p>}
                <Link href="/support" className="block mt-4">
                  <Button variant="outline" className="w-full text-[10px] h-8 rounded-xl font-bold border-accent/20 text-accent hover:bg-accent/5">
                    나도 명언 추천하기 <Sparkles className="h-3 w-3 ml-1.5" />
                  </Button>
                </Link>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
