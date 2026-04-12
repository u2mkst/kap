
"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Script from "next/script"
import { Trophy, RefreshCw, Loader2, Radio, CalendarDays, Info, ChevronRight, LayoutGrid, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
      
      if (data.error) {
        setSportsData(prev => ({ ...prev, error: data.error }));
      } else {
        setSportsData({
          kbo: data.kbo || [],
          kleague1: data.kleague1 || [],
          kleague2: data.kleague2 || [],
        });
      }
      setLastUpdated(new Date())
    } catch (e) {
      console.error("Data fetch error:", e)
      setSportsData(prev => ({ ...prev, error: "서버와 통신할 수 없습니다." }))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      loadSports()
      const interval = setInterval(loadSports, 60000)
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
              "p-3 rounded-2xl text-center font-black text-xl tracking-tighter tabular-nums shadow-sm transition-colors",
              isLive ? "bg-destructive text-white" : "bg-muted/50 text-muted-foreground"
            )}>
              {game.score}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isUserLoading || !user) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="flex flex-col items-center gap-4 relative z-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-xs font-black animate-pulse text-primary">스포츠 데이터 동기화 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-in fade-in duration-700">
      <Script 
        src="https://widgets.api-sports.io/2.0.0/widgets.js" 
        strategy="afterInteractive"
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter leading-tight text-primary flex items-center gap-3">
            <Trophy className="h-10 w-10 text-yellow-500" /> KST HUB 스포츠
          </h1>
          <p className="text-muted-foreground text-sm font-bold">실시간 공식 데이터 센터</p>
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
        <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center gap-3 text-destructive animate-in slide-in-from-top-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-xs font-black">{sportsData.error}</p>
        </div>
      )}

      <div className="space-y-16">
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black flex items-center gap-2 text-primary">
              <ChevronRight className="h-5 w-5" /> ⚾ KBO 프로야구
            </h2>
            <Badge variant="secondary" className="font-bold">LIVE & Schedule</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sportsData.kbo.length > 0 ? (
              sportsData.kbo.map((game, idx) => <GameCard key={idx} game={game} />)
            ) : (
              <div className="col-span-full py-12 text-center bg-muted/20 rounded-[2.5rem] border-2 border-dashed border-muted flex flex-col items-center gap-3">
                <CalendarDays className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm font-black text-muted-foreground italic">현재 불러올 수 있는 KBO 경기가 없습니다.</p>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black flex items-center gap-2 text-primary">
              <ChevronRight className="h-5 w-5" /> ⚽ K리그 공식 데이터 (Widget)
            </h2>
            <Badge className="bg-accent text-accent-foreground font-black">Official API-Sports</Badge>
          </div>
          
          <div className="bg-card rounded-[2.5rem] border shadow-xl overflow-hidden p-1 sm:p-6 min-h-[600px] relative transition-all hover:shadow-2xl">
            <div className="flex items-center gap-2 mb-4 px-4">
              <LayoutGrid className="h-4 w-4 text-primary" />
              <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">K-League Official Widget</span>
            </div>
            
            <div className="w-full">
              {/* @ts-ignore */}
              <api-sports-widget 
                data-type="leagues"
                data-target-league="#8031"
              ></api-sports-widget>

              {/* @ts-ignore */}
              <api-sports-widget 
                data-type="config"
                data-key="18d3e84e0351d299a100acfae51ad8e3"
                data-sport="football"
                data-lang="en"
                data-theme="white"
              ></api-sports-widget>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-16 p-6 bg-muted/30 rounded-3xl border border-dashed border-border/50 flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-2xl">
          <Info className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-black text-primary uppercase tracking-tighter">데이터 안내</p>
          <p className="text-[10px] font-bold text-muted-foreground leading-relaxed">
            스포츠 데이터는 네이버 스포츠 크롤링 및 API-Sports 공식 데이터를 통해 실시간으로 동기화됩니다.
            KBO 데이터는 우리 사이트에서 직접 가공하며, K리그 데이터는 공식 위젯을 통해 제공됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}
