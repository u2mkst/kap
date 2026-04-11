
"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Trophy, RefreshCw, Loader2, Radio, CalendarDays, ExternalLink, Activity, AlertCircle, Info, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser } from "@/firebase"
import { cn } from "@/lib/utils"

interface Game {
  league: string;
  time: string;
  teams: string;
  score: string;
  status: string;
}

export default function SportsPage() {
  const { user, isUserLoading } = useUser()
  const router = useRouter()
  
  const [sportsData, setSportsData] = useState<{
    kbo: Game[], 
    kleague1: Game[], 
    kleague2: Game[],
    error?: string
  }>({ kbo: [], kleague1: [], kleague2: [] })
  
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login")
    }
  }, [user, isUserLoading, router])

  const loadSports = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/sports");
      const data = await res.json();
      
      setSportsData({
        kbo: data.kbo || [],
        kleague1: data.kleague1 || [],
        kleague2: data.kleague2 || [],
        error: data.error
      });
      setLastUpdated(new Date())
    } catch (e) {
      console.error("Data fetch error:", e)
      setSportsData(prev => ({ ...prev, error: "데이터를 불러오는 중 오류가 발생했습니다." }))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      loadSports()
      const interval = setInterval(loadSports, 60000) // 1분마다 갱신
      return () => clearInterval(interval)
    }
  }, [loadSports, user])

  const GameCard = ({ game }: { game: Game }) => {
    const isLive = game.status === 'LIVE' || game.status === '1H' || game.status === '2H' || game.status === 'HT' || game.status === 'LIVE/END';
    
    return (
      <Card className={cn(
        "relative overflow-hidden transition-all border-none shadow-md group hover:shadow-xl bg-card",
        isLive && "ring-2 ring-destructive/50"
      )}>
        {isLive && <div className="absolute top-0 left-0 w-full h-1 bg-destructive animate-pulse" />}
        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black opacity-40 uppercase tracking-widest flex items-center gap-1">
                <CalendarDays className="h-3 w-3" /> {game.time}
              </span>
              {isLive && (
                <Badge variant="destructive" className="w-fit h-5 text-[9px] font-black rounded-full animate-bounce">
                  <Radio className="h-3 w-3 mr-1" /> LIVE
                </Badge>
              )}
            </div>
            <Badge variant="outline" className="text-[9px] font-bold h-5 border-primary/20 text-primary">{game.league}</Badge>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-black text-center tracking-tight leading-tight px-2 h-10 flex items-center justify-center">{game.teams}</h3>
            <div className={cn(
              "p-3 rounded-2xl text-center font-black text-xl tracking-tighter tabular-nums shadow-sm",
              isLive ? "bg-destructive text-white" : "bg-muted/50 text-muted-foreground"
            )}>
              {game.score}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const LeagueSection = ({ title, games, leagueType }: { title: string, games: Game[], leagueType: string }) => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black flex items-center gap-2 text-primary">
          <ChevronRight className="h-5 w-5" /> {title}
        </h2>
        <Badge variant="secondary" className="font-bold">{games.length}개 경기</Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {games.length > 0 ? (
          games.map((game, idx) => <GameCard key={idx} game={game} />)
        ) : (
          <div className="col-span-full py-12 text-center bg-muted/20 rounded-[2.5rem] border-2 border-dashed border-muted flex flex-col items-center gap-3">
            <CalendarDays className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm font-black text-muted-foreground italic">예정된 {title} 경기가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  )

  if (isUserLoading || !user) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter leading-tight text-primary flex items-center gap-3">
            <Trophy className="h-10 w-10 text-yellow-500" /> 실시간 스포츠
          </h1>
          <p className="text-muted-foreground text-sm font-bold">KST HUB 학생들을 위한 KBO & K리그 실시간 통합 중계</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {lastUpdated && (
            <div className="hidden sm:block text-right">
              <p className="text-[10px] font-black text-muted-foreground uppercase opacity-50">마지막 업데이트</p>
              <p className="text-xs font-bold">{lastUpdated.toLocaleTimeString()}</p>
            </div>
          )}
          <Button onClick={loadSports} disabled={isLoading} className="rounded-2xl h-12 px-6 font-black bg-primary hover:bg-primary/90 text-white shadow-md transition-all flex-grow sm:flex-grow-0 group">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <RefreshCw className="h-5 w-5 mr-2 group-active:rotate-180 transition-transform" />}
            {isLoading ? "동기화 중..." : "실시간 새로고침"}
          </Button>
        </div>
      </div>

      {sportsData.error && (
        <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center gap-3 text-destructive text-sm font-bold">
          <AlertCircle className="h-5 w-5" />
          {sportsData.error}
        </div>
      )}

      <div className="space-y-16">
        <LeagueSection title="⚾ KBO 프로야구" games={sportsData.kbo} leagueType="KBO" />
        <LeagueSection title="⚽ K리그1" games={sportsData.kleague1} leagueType="K1" />
        <LeagueSection title="⚽ K리그2" games={sportsData.kleague2} leagueType="K2" />
      </div>

      {isLoading && (
        <div className="fixed inset-0 bg-background/40 backdrop-blur-[2px] z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-card p-8 rounded-[3rem] shadow-2xl flex flex-col items-center gap-5 border animate-in zoom-in-95">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary animate-pulse" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-black text-primary uppercase tracking-widest">데이터 동기화 중</p>
              <p className="text-[10px] font-bold text-muted-foreground">KBO 및 K리그 정보 수집 중...</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
        <div className="flex items-center gap-4 p-6 bg-muted/30 rounded-3xl border border-dashed border-border/50">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <Info className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-black text-primary uppercase tracking-tighter">데이터 출처</p>
            <p className="text-[10px] font-bold text-muted-foreground leading-relaxed">
              본 서비스는 네이버 스포츠 크롤링 및 RapidAPI(Football-API) 데이터를 실시간으로 가공하여 제공합니다.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-6 bg-muted/30 rounded-3xl border border-dashed border-border/50">
          <div className="p-3 bg-accent/10 rounded-2xl">
            <ExternalLink className="h-6 w-6 text-accent" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-black text-accent uppercase tracking-tighter">상세 정보</p>
            <p className="text-[10px] font-bold text-muted-foreground leading-relaxed">
              더 자세한 중계 정보 및 선수 기록은 각 리그 공식 홈페이지 또는 네이버 스포츠를 통해 확인 가능합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
