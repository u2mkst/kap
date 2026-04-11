
"use client"

import { useState, useEffect, useCallback } from "react"
import { Trophy, RefreshCw, Loader2, Radio, CalendarDays, ExternalLink, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface Game {
  time: string;
  teams: string;
  score: string;
}

export default function SportsPage() {
  const [kboGames, setKboGames] = useState<Game[]>([])
  const [kleagueGames, setKleagueGames] = useState<Game[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchKBO = useCallback(async () => {
    try {
      const res = await fetch("/api/sports/kbo")
      const data = await res.json()
      if (!data.error) setKboGames(data)
    } catch (e) {
      console.error(e)
    }
  }, [])

  const fetchKLeague = useCallback(async () => {
    try {
      const [k1, k2] = await Promise.all([
        fetch("/api/sports/kleague?league=kleague1").then(r => r.json()),
        fetch("/api/sports/kleague?league=kleague2").then(r => r.json())
      ])
      const combined = []
      if (!k1.error) combined.push(...k1)
      if (!k2.error) combined.push(...k2)
      setKleagueGames(combined)
    } catch (e) {
      console.error(e)
    }
  }, [])

  const loadAll = useCallback(async () => {
    setIsLoading(true)
    await Promise.all([fetchKBO(), fetchKLeague()])
    setLastUpdated(new Date())
    setIsLoading(false)
  }, [fetchKBO, fetchKLeague])

  useEffect(() => {
    loadAll()
    const interval = setInterval(loadAll, 30000) // 30초마다 자동 갱신
    return () => clearInterval(interval)
  }, [loadAll])

  const isLive = (score: string) => score && score.includes(":")

  const GameCard = ({ game, type }: { game: Game, type: 'kbo' | 'kleague' }) => {
    const live = isLive(game.score)
    return (
      <Card className={cn(
        "relative overflow-hidden transition-all border-none shadow-md group hover:shadow-xl",
        live ? "bg-destructive/5 border-2 border-destructive/20" : "bg-card"
      )}>
        {live && (
          <div className="absolute top-0 left-0 w-full h-1 bg-destructive animate-pulse" />
        )}
        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black opacity-40 uppercase tracking-widest flex items-center gap-1">
                <CalendarDays className="h-3 w-3" /> {game.time}
              </span>
              {live && (
                <Badge variant="destructive" className="w-fit h-5 text-[9px] font-black rounded-full animate-bounce">
                  <Radio className="h-3 w-3 mr-1" /> LIVE
                </Badge>
              )}
            </div>
            <div className="p-2 bg-muted/30 rounded-xl">
              <Activity className={cn("h-4 w-4", live ? "text-destructive" : "text-muted-foreground")} />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-black text-center tracking-tight leading-tight px-2">
              {game.teams}
            </h3>
            <div className={cn(
              "p-3 rounded-2xl text-center font-black text-xl tracking-tighter tabular-nums",
              live ? "bg-destructive text-white shadow-lg" : "bg-muted/50 text-muted-foreground"
            )}>
              {game.score || "경기 전"}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tighter leading-tight text-primary flex items-center gap-3">
            <Trophy className="h-10 w-10" /> 실시간 스포츠
          </h1>
          <p className="text-muted-foreground text-sm font-bold mt-1">KBO와 K리그 경기 현황을 실시간으로 확인하세요.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="hidden sm:block text-right">
            <p className="text-[10px] font-black text-muted-foreground uppercase opacity-50">Last Update</p>
            <p className="text-xs font-bold">{lastUpdated ? lastUpdated.toLocaleTimeString() : "로딩 중..."}</p>
          </div>
          <Button 
            onClick={loadAll} 
            disabled={isLoading}
            className="rounded-2xl h-12 px-6 font-black bg-primary hover:bg-primary/90 text-white shadow-md active:scale-95 transition-all flex-grow sm:flex-grow-0"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <RefreshCw className="h-5 w-5 mr-2" />}
            새로고침
          </Button>
        </div>
      </div>

      <Tabs defaultValue="kbo" className="space-y-8">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-3xl h-14">
          <TabsTrigger value="kbo" className="rounded-2xl font-black text-sm data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
            ⚾ KBO 리그
          </TabsTrigger>
          <TabsTrigger value="kleague" className="rounded-2xl font-black text-sm data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
            ⚽ K리그 1/2
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kbo" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {kboGames.length > 0 ? (
              kboGames.map((game, idx) => <GameCard key={idx} game={game} type="kbo" />)
            ) : !isLoading ? (
              <div className="col-span-full py-20 text-center bg-muted/20 rounded-[2.5rem] border-2 border-dashed border-muted flex flex-col items-center gap-3">
                <CalendarDays className="h-12 w-12 text-muted-foreground/30" />
                <p className="text-sm font-bold text-muted-foreground italic">오늘 예정된 KBO 경기가 없습니다.</p>
              </div>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="kleague" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {kleagueGames.length > 0 ? (
              kleagueGames.map((game, idx) => <GameCard key={idx} game={game} type="kleague" />)
            ) : !isLoading ? (
              <div className="col-span-full py-20 text-center bg-muted/20 rounded-[2.5rem] border-2 border-dashed border-muted flex flex-col items-center gap-3">
                <CalendarDays className="h-12 w-12 text-muted-foreground/30" />
                <p className="text-sm font-bold text-muted-foreground italic">오늘 예정된 K리그 경기가 없습니다.</p>
              </div>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>

      {isLoading && (
        <div className="fixed inset-0 bg-background/20 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-card p-6 rounded-[2rem] shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-xs font-black text-primary uppercase tracking-widest">데이터 수집 중...</p>
          </div>
        </div>
      )}

      <div className="mt-12 flex flex-col items-center gap-2 pb-12 opacity-50">
        <div className="flex items-center gap-2 px-4 py-1.5 bg-muted rounded-full text-[10px] font-black uppercase tracking-tighter">
          <ExternalLink className="h-3 w-3" /> Data provided by NAVER Sports
        </div>
        <p className="text-[9px] font-bold text-muted-foreground">KST HUB Live Sports Monitoring System</p>
      </div>
    </div>
  )
}
