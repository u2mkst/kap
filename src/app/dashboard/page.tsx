
"use client"

import { useMemo, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Settings,
  Medal,
  CheckCircle2,
  Loader2,
  GraduationCap,
  Maximize2
} from "lucide-react"
import Link from "next/link"
import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from "@/firebase"
import { doc, updateDoc, increment, serverTimestamp, query, collection, orderBy, limit } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { searchSchool, getTodayMeals, getTodayTimetable } from "@/lib/neis-api"

export default function DashboardPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()

  const [todayStr, setTodayStr] = useState<string | null>(null)
  const [userAnswer, setUserAnswer] = useState("")
  const [isSolving, setIsSolving] = useState(false)
  const [isSolved, setIsSolved] = useState(false)

  const [meals, setMeals] = useState<string>("불러오는 중...")
  const [timetable, setTimetable] = useState<string>("불러오는 중...")

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null
    return doc(db, "users", user.uid)
  }, [user, db])

  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef)

  useEffect(() => {
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    setTodayStr(`${yyyy}-${mm}-${dd}`)
    const neisDate = `${yyyy}${mm}${dd}`

    if (userData?.schoolName && userData?.grade && userData?.classNum) {
      searchSchool(userData.schoolName).then(schoolInfo => {
        if (schoolInfo) {
          const officeCode = schoolInfo.ATPT_OFCDC_SC_CODE
          const schoolCode = schoolInfo.SD_SCHUL_CODE
          const schoolKind = userData.schoolType || schoolInfo.SCHUL_KND_NM
          
          getTodayMeals(officeCode, schoolCode, neisDate).then(menu => {
            setMeals(menu || "급식 정보가 없습니다.")
          })
          
          getTodayTimetable(
            officeCode, 
            schoolCode, 
            neisDate, 
            userData.grade, 
            userData.classNum, 
            schoolKind
          ).then(table => {
            setTimetable(table || "오늘의 시간표 정보가 없습니다.")
          })
        } else {
          setMeals("학교 정보를 찾을 수 없습니다.")
          setTimetable("학교 정보를 찾을 수 없습니다.")
        }
      })
    }
  }, [userData, todayStr])

  const leaderboardQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "users"), orderBy("points", "desc"), limit(10))
  }, [db, user])
  const { data: topUsers, isLoading: isLeaderboardLoading } = useCollection(leaderboardQuery)

  const fortuneRef = useMemoFirebase(() => {
    if (!db || !todayStr || !user) return null
    return doc(db, "daily_fortunes", todayStr)
  }, [db, todayStr, user])

  const problemRef = useMemoFirebase(() => {
    if (!db || !todayStr || !userData?.grade || !user) return null
    return doc(db, "daily_problems", `${todayStr}_${userData.grade}`)
  }, [db, todayStr, userData?.grade, user])

  const { data: fortuneData } = useDoc(fortuneRef)
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

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login")
    }
  }, [user, isUserLoading, router])

  if (isUserLoading || isUserDataLoading || !user || !todayStr) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                {userData?.schoolName || "학교 미설정"} {userData?.grade}학년 {userData?.classNum}반
              </Badge>
              {userData?.schoolType && (
                <Badge variant="outline" className="text-[10px] h-5 px-2 bg-white flex items-center gap-1">
                  <GraduationCap className="h-3 w-3" /> {userData.schoolType}
                </Badge>
              )}
              <Badge variant="secondary" className="bg-accent/10 text-accent-foreground border-none text-[10px]">
                Lv.{(Math.floor((userData?.points || 0) / 1000)) + 1}
              </Badge>
            </div>
          </div>
        </div>
        <Card className="w-full md:w-auto bg-primary text-primary-foreground border-none shadow-md px-6 py-3 flex items-center justify-between md:justify-start gap-6">
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
            <Button size="sm" variant="secondary" className="font-bold text-xs bg-white text-primary hover:bg-white/90 rounded-full px-4">
              성장시키기
            </Button>
          </Link>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-8 space-y-6">
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2 text-primary font-bold">
                  <School className="h-5 w-5" /> 우리 학교 소식
                </CardTitle>
                <CardDescription className="text-xs">오늘의 일정을 실시간으로 확인하세요.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold rounded-full border-primary/20 hover:bg-primary/5 text-primary">
                      <Maximize2 className="h-3 w-3 mr-1" /> 자세히 보기
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2"><School className="h-5 w-5 text-primary" /> {userData?.schoolName} 소식 상세</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      <div className="space-y-3">
                        <h3 className="font-bold text-sm flex items-center gap-2 text-orange-600"><Utensils className="h-4 w-4" /> 오늘 급식 메뉴</h3>
                        <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                          <ul className="grid grid-cols-2 gap-2">
                            {meals.split(',').map((item, idx) => (
                              <li key={idx} className="text-xs text-orange-900 flex items-center gap-1.5">
                                <span className="h-1 w-1 rounded-full bg-orange-400" /> {item.trim()}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h3 className="font-bold text-sm flex items-center gap-2 text-blue-600"><Clock className="h-4 w-4" /> 오늘의 시간표</h3>
                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                          <div className="space-y-2">
                            {timetable.split(',').map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-blue-100/50 last:border-0">
                                <span className="font-bold text-blue-800">{item.split(':')[0]}</span>
                                <span className="text-blue-900">{item.split(':')[1]}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Link href="/profile">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary transition-colors h-8">
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {!userData?.schoolName && (
                <div className="text-center py-10 bg-muted/20 rounded-2xl mb-4 border-2 border-dashed">
                  <p className="text-sm text-muted-foreground mb-4">회원 정보에 학교 정보가 설정되어 있지 않습니다.</p>
                  <Link href="/profile"><Button size="sm" className="rounded-full px-6">학교 정보 설정하기</Button></Link>
                </div>
              )}
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-orange-50 border border-orange-100 flex flex-col h-full">
                  <h3 className="font-bold text-orange-700 flex items-center gap-2 mb-3 text-sm">
                    <Utensils className="h-4 w-4" /> 오늘 급식
                  </h3>
                  <div className="text-xs text-orange-900 leading-relaxed flex-grow line-clamp-3">
                    {meals || "급식 정보를 불러올 수 없습니다."}
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100 flex flex-col h-full">
                  <h3 className="font-bold text-blue-700 flex items-center gap-2 mb-3 text-sm">
                    <Clock className="h-4 w-4" /> 오늘의 시간표
                  </h3>
                  <div className="text-xs text-blue-900 leading-relaxed flex-grow line-clamp-3">
                    {timetable || "시간표 정보를 불러올 수 없습니다."}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <Card className="border-none shadow-sm bg-gradient-to-br from-green-50 to-emerald-50 group hover:shadow-md transition-all">
              <CardHeader className="p-5">
                <CardTitle className="text-sm flex items-center gap-2 font-bold text-green-800">
                  <Sprout className="h-4 w-4 text-green-600" /> 나의 식물 키우기
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <div className="text-center">
                  <p className="text-xs mb-4 text-green-700">포인트를 투자해 식물을 성장시키세요!</p>
                  <Link href="/plants">
                    <Button variant="outline" size="sm" className="rounded-full w-full border-green-200 bg-white text-green-700 hover:bg-green-100 text-xs font-bold">
                      식물 정원 가기
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white hover:bg-accent/5 transition-colors">
              <CardHeader className="p-5">
                <CardTitle className="text-sm flex items-center gap-2 font-bold">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /> 오늘의 한마디
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <div className="bg-muted/30 p-4 rounded-2xl italic text-[11px] text-center text-muted-foreground border border-muted">
                  "{fortuneData?.fortuneText || "오늘도 당신의 성장을 응원합니다!"}"
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="p-5">
              <CardTitle className="text-sm flex items-center gap-2 font-bold">
                <Zap className="h-4 w-4 text-yellow-500 fill-yellow-500" /> 외부 학습 사이트
              </CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-3 p-5 pt-0">
              <a href="https://www.u2math.co.kr/Login/Index" target="_blank" rel="noopener noreferrer" className="group p-4 rounded-2xl border bg-white hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs group-hover:text-primary">유투엠 (U2M)</p>
                  <p className="text-[10px] text-muted-foreground">말하는 수학</p>
                </div>
                <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
              </a>
              <a href="https://student.mathflat.com/#/history?_si=2" target="_blank" rel="noopener noreferrer" className="group p-4 rounded-2xl border bg-white hover:border-accent hover:bg-accent/5 transition-all flex items-center justify-between">
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
           <Card className="border-none shadow-sm bg-white overflow-hidden h-full">
            <CardHeader className="p-5 border-b mb-4">
              <CardTitle className="text-md flex items-center gap-2 font-bold">
                <Sparkles className="h-4 w-4 text-primary" /> 오늘의 도전 문제
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              {problemData ? (
                <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
                  <div className="flex items-center gap-1.5">
                    <Badge className="bg-primary text-[9px] h-4 rounded-full">{problemData.topic}</Badge>
                    <Badge variant="outline" className="text-[9px] h-4 rounded-full bg-white">{problemData.difficulty}</Badge>
                    <Badge variant="secondary" className="text-[9px] h-4 rounded-full bg-accent/20">{userData?.grade}학년 전용</Badge>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm mb-2">{problemData.title}</h3>
                    <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {problemData.problemText}
                    </p>
                  </div>
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-[10px] text-muted-foreground font-bold">정답 입력</Label>
                    <div className="flex gap-2">
                      <input 
                        disabled={isSolved}
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="정답" 
                        className="h-8 w-full px-3 text-xs bg-white border rounded-md"
                        onKeyDown={(e) => e.key === 'Enter' && handleSolveProblem()}
                      />
                      <Button 
                        disabled={isSolved || isSolving || !userAnswer.trim()}
                        onClick={handleSolveProblem}
                        size="sm" 
                        className="h-8 px-4 rounded-full bg-primary text-[10px] font-bold"
                      >
                        {isSolving ? <Loader2 className="h-3 w-3 animate-spin" /> : isSolved ? <CheckCircle2 className="h-3 w-3" /> : "제출"}
                      </Button>
                    </div>
                    {isSolved && <p className="text-[10px] text-primary font-bold">정답입니다! ✨</p>}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-xs text-muted-foreground bg-muted/10 rounded-2xl border border-dashed">
                  오늘의 문제가 준비 중입니다.
                </div>
              )}
            </CardContent>

            <CardHeader className="p-5 border-t border-b mt-4">
              <CardTitle className="text-md flex items-center gap-2 font-bold">
                <Trophy className="h-4 w-4 text-yellow-500 fill-yellow-500" /> 오늘의 포인트 TOP 10
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-5 pt-4">
              {isLeaderboardLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-4 w-4 animate-spin" /></div>
              ) : (
                Array.from({ length: 10 }).map((_, index) => {
                  const rank = index + 1;
                  const u = topUsers?.[index];
                  const isMe = u?.id === user?.uid;
                  
                  return (
                    <div key={index} className={`flex items-center justify-between p-3 rounded-xl transition-colors ${isMe ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-6 flex justify-center">
                          {rank === 1 ? (
                            <Medal className="h-4 w-4 text-yellow-500" />
                          ) : rank === 2 ? (
                            <Medal className="h-4 w-4 text-gray-400" />
                          ) : rank === 3 ? (
                            <Medal className="h-4 w-4 text-orange-400" />
                          ) : (
                            <span className="font-black text-xs text-muted-foreground">{rank}</span>
                          )}
                        </div>
                        <span className={`text-[11px] font-bold ${isMe ? 'text-primary' : 'text-foreground'}`}>
                          {u ? (u.nickname || u.firstName || "-") : "-"}
                          {isMe && <span className="ml-1 text-[9px] font-normal opacity-70">(나)</span>}
                        </span>
                      </div>
                      <span className={`text-[10px] font-black ${isMe ? 'text-primary' : 'text-muted-foreground'}`}>
                        {u ? u.points.toLocaleString() : "0"} P
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
