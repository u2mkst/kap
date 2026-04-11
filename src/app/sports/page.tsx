
"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Trophy, RefreshCw, Loader2, Radio, CalendarDays, ExternalLink, Activity, ListOrdered, LayoutGrid, AlertCircle, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  
  const [kboData, setKboData] = useState<{games: Game[], rankings: Ranking[], error?: string}>({ games: [], rankings: [] })
  const [kleagueData, setKleagueData] = useState<{games: Game[], rankings: Ranking[], error?: string}>({ games: [], rankings: [] })
  
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
      // API Route에서 에러를 내부적으로 처리하므로 status 200을 기대함
      const [kboRes, kleagueRes] = await Promise.all([
        fetch("/api/sports/kbo").then(r => r.json()).catch(() => ({ error: "KBO API 통신 실패", games: [], rankings: [] })),
        fetch("/api/sports/kleague").then(r => r.json()).catch(() => ({ error: "K-League API 통신 실패", games: [], rankings: [] }))
      ])
      
      setKboData(kboRes)
      setKleagueData(kleagueRes)
      setLastUpdated(new Date())
    } catch (e) {
      console.error("Data fetch error:", e)
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

  const isLive = (status: string) => status === 'ONGOING' || status === 'STARTED' || status === 'PLAYING'

  const GameCard = ({ game }: { game: Game }) => {
    const live = isLive(game.status)
    return (
      <Card className={cn(
        "relative overflow-hidden transition-all border-none shadow-md group hover:shadow-xl bg-card",
        live && "ring-2 ring-destructive/50"
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
            {game.leagueName && <Badge variant="outline" className="text-[9px] font-bold h-5 border-primary/20 text-primary">{game.leagueName}</Badge>}
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-black text-center tracking-tight leading-tight px-2">{game.teams}</h3>
            <div className={cn(
              "p-3 rounded-2xl text-center font-black text-xl tracking-tighter tabular-nums",
              live ? "bg-destructive text-white shadow-inner" : "bg-muted/50 text-muted-foreground"
            )}>
              {game.score || "경기 전"}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const ErrorDisplay = ({ message }: { message?: string }) => (
    <div className="col-span-full py-12 text-center bg-destructive/5 rounded-[2.5rem] border-2 border-dashed border-destructive/20 flex flex-col items-center gap-3">
      <AlertCircle className="h-10 w-10 text-destructive/50" />
      <div className="space-y-1">
        <p className="text-sm font-black text-destructive">{message || "데이터를 일시적으로 불러올 수 없습니다."}</p>
        <p className="text-[10px] font-bold text-muted-foreground">네이버 스포츠 API 응답 지연일 수 있습니다.</p>
      </div>
      <Button variant="outline" size="sm" onClick={loadAll} className="mt-2 rounded-full h-8 px-4 text-[10px] font-black hover:bg-destructive/10 border-destructive/30 text-destructive">
        새로고침 하여 다시 시도
      </Button>
    </div>
  )

  if (isUserLoading || !user) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-xs font-black text-primary animate-pulse">스포츠 채널 연결 중...</p>
        </div>
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
          <p className="text-muted-foreground text-sm font-bold">KST HUB 학생들을 위한 실시간 경기 정보 및 리그 순위 서비스</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {lastUpdated && (
            <div className="hidden sm:block text-right">
              <p className="text-[10px] font-black text-muted-foreground uppercase opacity-50">마지막 업데이트</p>
              <p className="text-xs font-bold">{lastUpdated.toLocaleTimeString()}</p>
            </div>
          )}
          <Button onClick={loadAll} disabled={isLoading} className="rounded-2xl h-12 px-6 font-black bg-primary hover:bg-primary/90 text-white shadow-md transition-all flex-grow sm:flex-grow-0 group">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <RefreshCw className="h-5 w-5 mr-2 group-active:rotate-180 transition-transform" />}
            {isLoading ? "동기화 중..." : "실시간 새로고침"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="kbo" className="space-y-8">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-3xl h-14">
          <TabsTrigger value="kbo" className="rounded-2xl font-black text-sm data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-lg transition-all">⚾ KBO 프로야구</TabsTrigger>
          <TabsTrigger value="kleague" className="rounded-2xl font-black text-sm data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-lg transition-all">⚽ K리그 축구</TabsTrigger>
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
                {kboData.error ? (
                  <ErrorDisplay message={kboData.error} />
                ) : kboData.games.length > 0 ? (
                  kboData.games.map((game, idx) => <GameCard key={idx} game={game} />)
                ) : !isLoading && (
                  <div className="col-span-full py-24 text-center bg-muted/20 rounded-[2.5rem] border-2 border-dashed border-muted flex flex-col items-center gap-3">
                    <div className="p-4 bg-muted/30 rounded-full">
                      <CalendarDays className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                    <p className="text-sm font-black text-muted-foreground italic">오늘 예정된 KBO 경기가 없습니다.</p>
                    <p className="text-[10px] font-bold opacity-40">월요일은 정기 휴식일이거나 비시즌일 수 있습니다.</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="rankings">
              {kboData.error ? (
                <ErrorDisplay message={kboData.error} />
              ) : (
                <Card className="rounded-[2.5rem] overflow-hidden border-none shadow-xl bg-card">
                  <div className="overflow-x-auto">
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
                        {kboData.rankings.length > 0 ? kboData.rankings.map((r) => (
                          <TableRow key={r.teamName} className="hover:bg-primary/5 transition-colors border-border/50">
                            <TableCell className="text-center font-black text-primary">{r.rank}</TableCell>
                            <TableCell className="font-bold">{r.teamName}</TableCell>
                            <TableCell className="text-center font-medium opacity-60 tabular-nums">{r.gameCount}</TableCell>
                            <TableCell className="text-center font-bold text-blue-600 tabular-nums">{r.won}</TableCell>
                            <TableCell className="text-center font-bold text-red-600 tabular-nums">{r.lost}</TableCell>
                            <TableCell className="text-center font-medium tabular-nums">{r.drawn}</TableCell>
                            <TableCell className="text-right font-black tabular-nums">{r.winRate}</TableCell>
                          </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-12 text-muted-foreground italic font-bold">순위 데이터를 불러오는 중이거나 데이터가 없습니다.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              )}
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
                {kleagueData.error ? (
                  <ErrorDisplay message={kleagueData.error} />
                ) : kleagueData.games.length > 0 ? (
                  kleagueData.games.map((game, idx) => <GameCard key={idx} game={game} />)
                ) : !isLoading && (
                  <div className="col-span-full py-24 text-center bg-muted/20 rounded-[2.5rem] border-2 border-dashed border-muted flex flex-col items-center gap-3">
                    <div className="p-4 bg-muted/30 rounded-full">
                      <CalendarDays className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                    <p className="text-sm font-black text-muted-foreground italic">오늘 예정된 K리그 경기가 없습니다.</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="rankings">
              {kleagueData.error ? (
                <ErrorDisplay message={kleagueData.error} />
              ) : (
                <Card className="rounded-[2.5rem] overflow-hidden border-none shadow-xl bg-card">
                  <div className="overflow-x-auto">
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
                        {kleagueData.rankings.length > 0 ? kleagueData.rankings.map((r) => (
                          <TableRow key={r.teamName} className="hover:bg-primary/5 transition-colors border-border/50">
                            <TableCell className="text-center font-black text-primary">{r.rank}</TableCell>
                            <TableCell className="font-bold">{r.teamName}</TableCell>
                            <TableCell className="text-center font-medium opacity-60 tabular-nums">{r.gameCount}</TableCell>
                            <TableCell className="text-center font-bold text-blue-600 tabular-nums">{r.won}</TableCell>
                            <TableCell className="text-center font-bold text-green-600 tabular-nums">{r.drawn}</TableCell>
                            <TableCell className="text-center font-bold text-red-600 tabular-nums">{r.lost}</TableCell>
                            <TableCell className="text-right font-black tabular-nums text-primary text-lg">{r.point}</TableCell>
                          </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-12 text-muted-foreground italic font-bold">순위 데이터를 불러오는 중이거나 비시즌입니다.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      {isLoading && (
        <div className="fixed inset-0 bg-background/40 backdrop-blur-[2px] z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-card p-8 rounded-[3rem] shadow-2xl flex flex-col items-center gap-5 border animate-in zoom-in-95">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary animate-pulse" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-black text-primary uppercase tracking-widest">실시간 동기화 중</p>
              <p className="text-[10px] font-bold text-muted-foreground">네이버 스포츠 데이터 소스 연결 중...</p>
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
            <p className="text-xs font-black text-primary uppercase tracking-tighter">실시간 데이터 출처</p>
            <p className="text-[10px] font-bold text-muted-foreground leading-relaxed">
              본 서비스는 네이버 스포츠(NAVER Sports)의 공개된 데이터 API를 사용하여 학생들에게 실시간 경기 현황을 제공합니다.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-6 bg-muted/30 rounded-3xl border border-dashed border-border/50">
          <div className="p-3 bg-accent/10 rounded-2xl">
            <ExternalLink className="h-6 w-6 text-accent" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-black text-accent uppercase tracking-tighter">상세 정보 더보기</p>
            <p className="text-[10px] font-bold text-muted-foreground leading-relaxed">
              중계 영상이나 문자 중계 등 더 자세한 정보는 네이버 스포츠 공식 홈페이지를 통해 확인하실 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
