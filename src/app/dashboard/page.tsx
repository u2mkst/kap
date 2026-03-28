
"use client"

import { useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Trophy, 
  Utensils, 
  Gift, 
  Zap, 
  Gamepad2, 
  ExternalLink,
  Flame,
  Sprout,
  Star,
  Sparkles
} from "lucide-react"
import Link from "next/link"
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"

export default function DashboardPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()

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

  const fortuneRef = useMemoFirebase(() => doc(db, "daily_fortunes", todayStr), [db, todayStr])
  const problemRef = useMemoFirebase(() => doc(db, "daily_problems", todayStr), [db, todayStr])

  const { data: fortuneData } = useDoc(fortuneRef)
  const { data: problemData } = useDoc(problemRef)

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
            <Gift className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs opacity-80">보유 포인트</p>
            <p className="text-xl font-black">{userData?.points?.toLocaleString() || 0} P</p>
          </div>
          <Link href="/shop">
            <Button size="sm" variant="secondary" className="ml-2 font-bold text-xs bg-white text-primary hover:bg-white/90">
              상점가기
            </Button>
          </Link>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-8 space-y-6">
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
        </div>

        <div className="md:col-span-4 space-y-6">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Utensils className="h-5 w-5 text-primary" /> 오늘의 급식/간식
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-3 bg-muted/20 p-4 rounded-xl">
                <div>
                  <p className="font-bold text-primary mb-1">🍱 점심 (12:30)</p>
                  <p className="text-muted-foreground">불고기 덮밥, 콩나물국, 계란말이, 김치</p>
                </div>
                <div className="border-t border-muted pt-3">
                  <p className="font-bold text-accent mb-1">🍰 간식 (16:00)</p>
                  <p className="text-muted-foreground">초코 츄러스 & 유기농 우유</p>
                </div>
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
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground text-xs">전체 순위 보기</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
