
"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Trophy, RefreshCw, Loader2, Radio, CalendarDays, ExternalLink, Activity, ListOrdered, LayoutGrid } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useUser } from "@/firebase"
import { cn } from "@/lib/utils"

interface Game {
  time: string;
  teams: string;
  score: string;
  status: string;
  leagueName?: string;
}

interface Ranking {
  rank: number;
  teamName: string;
  gameCount: number;
  won: number;
  lost: number;
  drawn: number;
  winRate?: string;
  point?: number;
}

export default function SportsPage() {
  const { user, isUserLoading } = useUser()
  const router = useRouter()
  
  const [kboData, setKboData] = useState<{games: Game[], rankings: Ranking[]}>({ games: [], rankings: [] })
  const [kleagueData, setKleagueData] = useState<{games: Game[], rankings: Ranking[]}>({ games: [], rankings: [] })
  
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login")
    }
  }, [user, isUserLoading, router])

  const loadAll = useCallback(async () => {
    setIsLoading(true)
    try {
      const [kboRes, kleagueRes] = await Promise.all([
        fetch("/api/sports/kbo").then(r => r.json()),
        fetch("/api/sports/kleague").then(r => r.json())
      ])
      
      if (kboRes && !kboRes.error) setKboData(kboRes)
      if (kleagueRes && !kleagueRes.error) setKleagueData(kleagueRes)
      
      setLastUpdated(new Date())
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      loadAll()
      const interval = setInterval(loadAll, 60000) // 1분마다 자동 갱신
      return () => clearInterval(interval)
    }
  }, [loadAll, user])

  const isLive = (status: string) => status === 'ONGOING' || status === 'STARTED'

  const GameCard = ({ game }: { game: Game }) => {
    const live = isLive(game.status)
    return (
      <Card className={cn(
        "relative overflow-hidden transition-all border-none shadow-md group hover:shadow-xl",
        live ? "bg-destructive/5 border-2 border-destructive/20" : "bg-card"
      )}>
        {live && <div className="absolute top-0 left-0 w-full h-1 bg-destructive animate-pulse" />}
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
            {game.leagueName && <Badge variant="outline" className="text-[9px] font-bold h-5">{game.leagueName}</Badge>}
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-black text-center tracking-tight leading-tight px-2">{game.teams}</h3>
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

  if (isUserLoading || !user) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tighter leading-tight text-primary flex items-center gap-3">
            <Trophy className="h-10 w-10" /> 실시간 스포츠
          </h1>
          <p className="text-muted-foreground text-sm font-bold mt-1">오늘의 경기 일정과 리그 순위를 실시간으로 확인하세요.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {lastUpdated && (
            <div className="hidden sm:block text-right">
              <p className="text-[10px] font-black text-muted-foreground uppercase opacity-50">최근 업데이트</p>
              <p className="text-xs font-bold">{lastUpdated.toLocaleTimeString()}</p>
            </div>
          )}
          <Button onClick={loadAll} disabled={isLoading} className="rounded-2xl h-12 px-6 font-black bg-primary hover:bg-primary/90 text-white shadow-md transition-all flex-grow sm:flex-grow-0">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <RefreshCw className="h-5 w-5 mr-2" />}
            새로고침
          </Button>
        </div>
      </div>

      <Tabs defaultValue="kbo" className="space-y-8">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-3xl h-14">
          <TabsTrigger value="kbo" className="rounded-2xl font-black text-sm data-[state=active]:bg-card data-[state=active]:text-primary transition-all">⚾ KBO 리그</TabsTrigger>
          <TabsTrigger value="kleague" className="rounded-2xl font-black text-sm data-[state=active]:bg-card data-[state=active]:text-primary transition-all">⚽ K리그</TabsTrigger>
        </TabsList>

        {/* KBO 콘텐츠 */}
        <TabsContent value="kbo" className="space-y-6">
          <Tabs defaultValue="games">
            <div className="flex justify-center mb-6">
              <TabsList className="bg-muted/30 p-1 rounded-2xl">
                <TabsTrigger value="games" className="rounded-xl font-bold text-xs"><LayoutGrid className="h-3 w-3 mr-1.5" /> 경기 일정</TabsTrigger>
                <TabsTrigger value="rankings" className="rounded-xl font-bold text-xs"><ListOrdered className="h-3 w-3 mr-1.5" /> 리그 순위</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="games">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {kboData.games.length > 0 ? (
                  kboData.games.map((game, idx) => <GameCard key={idx} game={game} />)
                ) : !isLoading && (
                  <div className="col-span-full py-20 text-center bg-muted/20 rounded-[2.5rem] border-2 border-dashed border-muted flex flex-col items-center gap-3">
                    <CalendarDays className="h-12 w-12 text-muted-foreground/30" />
                    <p className="text-sm font-bold text-muted-foreground italic">오늘 예정된 KBO 경기가 없습니다.</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="rankings">
              <Card className="rounded-[2rem] overflow-hidden border-none shadow-lg">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-16 text-center font-black">순위</TableHead>
                      <TableHead className="font-black">팀명</TableHead>
                      <TableHead className="text-center font-black">경기</TableHead>
                      <TableHead className="text-center font-black">승</TableHead>
                      <TableHead className="text-center font-black">패</TableHead>
                      <TableHead className="text-center font-black">무</TableHead>
                      <TableHead className="text-right font-black">승률</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kboData.rankings.map((r) => (
                      <TableRow key={r.teamName} className="hover:bg-primary/5 transition-colors">
                        <TableCell className="text-center font-black text-primary">{r.rank}</TableCell>
                        <TableCell className="font-bold">{r.teamName}</TableCell>
                        <TableCell className="text-center font-medium opacity-60">{r.gameCount}</TableCell>
                        <TableCell className="text-center font-bold text-blue-600">{r.won}</TableCell>
                        <TableCell className="text-center font-bold text-red-600">{r.lost}</TableCell>
                        <TableCell className="text-center font-medium">{r.drawn}</TableCell>
                        <TableCell className="text-right font-black tabular-nums">{r.winRate}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* K리그 콘텐츠 */}
        <TabsContent value="kleague" className="space-y-6">
          <Tabs defaultValue="games">
            <div className="flex justify-center mb-6">
              <TabsList className="bg-muted/30 p-1 rounded-2xl">
                <TabsTrigger value="games" className="rounded-xl font-bold text-xs"><LayoutGrid className="h-3 w-3 mr-1.5" /> 경기 일정</TabsTrigger>
                <TabsTrigger value="rankings" className="rounded-xl font-bold text-xs"><ListOrdered className="h-3 w-3 mr-1.5" /> 리그 순위</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="games">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {kleagueData.games.length > 0 ? (
                  kleagueData.games.map((game, idx) => <GameCard key={idx} game={game} />)
                ) : !isLoading && (
                  <div className="col-span-full py-20 text-center bg-muted/20 rounded-[2.5rem] border-2 border-dashed border-muted flex flex-col items-center gap-3">
                    <CalendarDays className="h-12 w-12 text-muted-foreground/30" />
                    <p className="text-sm font-bold text-muted-foreground italic">오늘 예정된 K리그 경기가 없습니다.</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="rankings">
              <Card className="rounded-[2rem] overflow-hidden border-none shadow-lg">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-16 text-center font-black">순위</TableHead>
                      <TableHead className="font-black">팀명</TableHead>
                      <TableHead className="text-center font-black">경기</TableHead>
                      <TableHead className="text-center font-black">승</TableHead>
                      <TableHead className="text-center font-black">무</TableHead>
                      <TableHead className="text-center font-black">패</TableHead>
                      <TableHead className="text-right font-black">승점</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kleagueData.rankings.map((r) => (
                      <TableRow key={r.teamName} className="hover:bg-primary/5 transition-colors">
                        <TableCell className="text-center font-black text-primary">{r.rank}</TableCell>
                        <TableCell className="font-bold">{r.teamName}</TableCell>
                        <TableCell className="text-center font-medium opacity-60">{r.gameCount}</TableCell>
                        <TableCell className="text-center font-bold text-blue-600">{r.won}</TableCell>
                        <TableCell className="text-center font-bold text-green-600">{r.drawn}</TableCell>
                        <TableCell className="text-center font-bold text-red-600">{r.lost}</TableCell>
                        <TableCell className="text-right font-black tabular-nums text-primary">{r.point}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      {isLoading && (
        <div className="fixed inset-0 bg-background/20 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-card p-6 rounded-[2rem] shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-xs font-black text-primary uppercase tracking-widest text-center">리그 데이터를 불러오는 중...</p>
          </div>
        </div>
      )}

      <div className="mt-12 flex flex-col items-center gap-2 pb-12 opacity-50">
        <div className="flex items-center gap-2 px-4 py-1.5 bg-muted rounded-full text-[10px] font-black uppercase tracking-tighter">
          <ExternalLink className="h-3 w-3" /> Real-time data from NAVER Sports API
        </div>
        <p className="text-[9px] font-bold text-muted-foreground">KST HUB Live Sports Monitoring System</p>
      </div>
    </div>
  )
}
