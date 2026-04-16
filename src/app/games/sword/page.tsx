
"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Sword, 
  Flame, 
  Trophy, 
  Zap, 
  Loader2,
  Coins
} from "lucide-react"
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase"
import { doc, setDoc, serverTimestamp, query, collection, orderBy, limit, increment, updateDoc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

type GameMessage = {
  id: string;
  type: 'system' | 'result';
  status: 'success' | 'fail' | 'destroy';
  nickname: string;
  before: number;
  after: number;
  timestamp: Date;
}

export default function SwordGamePage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [messages, setMessages] = useState<GameMessage[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  // 1. 실제 유저 프로필(닉네임, 포인트) 가져오기
  const userDocRef = useMemoFirebase(() => {
    if (!user) return null
    return doc(db, "users", user.uid)
  }, [user, db])
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef)

  // 2. 사용자 게임 프로필 쿼리
  const profileRef = useMemoFirebase(() => {
    if (!user) return null
    return doc(db, "sword_game_profiles", user.uid)
  }, [user, db])
  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef)

  // 3. 전체 순위 쿼리
  const rankingQuery = useMemoFirebase(() => {
    return query(collection(db, "sword_game_profiles"), orderBy("level", "desc"), limit(10))
  }, [db])
  const { data: rankings } = useCollection(rankingQuery)

  useEffect(() => {
    if (!isUserLoading && !user) router.push("/login")
  }, [user, isUserLoading, router])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const currentLevel = profile?.level || 0
  const userNickname = userData?.nickname || "학생"
  const userPoints = userData?.points || 0
  const ENHANCE_COST = 10

  const handleEnhance = async () => {
    if (!user || !profileRef || !userData || !userDocRef || isEnhancing) return
    
    // 포인트 체크
    if (userPoints < ENHANCE_COST) {
      toast({
        variant: "destructive",
        title: "포인트 부족!",
        description: "강화에는 10포인트가 필요합니다. 학습을 통해 포인트를 모아보세요!"
      })
      return
    }

    setIsEnhancing(true)

    // 포인트 선차감 (비동기)
    updateDoc(userDocRef, {
      points: increment(-ENHANCE_COST),
      updatedAt: serverTimestamp()
    }).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'update',
        requestResourceData: { points: userPoints - ENHANCE_COST }
      }))
    })

    const level = currentLevel
    const roll = Math.random() * 100
    let successRate, failRate, destroyRate
    
    // 변경된 확률 설정 (파괴 확률 대폭 감소, 유지 확률 증가)
    if (level <= 5) { 
      successRate = 70; 
      failRate = 28; 
      destroyRate = 2; // 기존 5% -> 2%
    }
    else if (level <= 10) { 
      successRate = 50; 
      failRate = 45; 
      destroyRate = 5; // 기존 15% -> 5%
    }
    else { 
      successRate = 30; 
      failRate = 60; 
      destroyRate = 10; // 기존 30% -> 10%
    }

    let resultStatus: 'success' | 'fail' | 'destroy'
    let nextLevel = level

    if (roll < successRate) {
      resultStatus = 'success'
      nextLevel = level + 1
    } else if (roll < successRate + failRate) {
      resultStatus = 'fail'
      nextLevel = level
    } else {
      resultStatus = 'destroy'
      nextLevel = 0
    }

    const gameData = {
      userId: user.uid,
      nickname: userNickname,
      level: nextLevel,
      maxLevel: Math.max(profile?.maxLevel || 0, nextLevel),
      totalAttempts: increment(1),
      updatedAt: serverTimestamp()
    }

    // 게임 데이터 업데이트
    setDoc(profileRef, gameData, { merge: true })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: profileRef.path,
          operation: 'write',
          requestResourceData: gameData
        }))
      })

    const newMessage: GameMessage = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'result',
      status: resultStatus,
      nickname: userNickname,
      before: level,
      after: nextLevel,
      timestamp: new Date()
    }

    setMessages(prev => [...prev.slice(-19), newMessage])
    
    if (resultStatus === 'success') {
      toast({ title: "강화 성공!", description: `+${nextLevel} 검이 되었습니다! (+1)` })
    } else if (resultStatus === 'fail') {
      toast({ title: "강화 실패 (유지)", description: "강화 수치가 변하지 않았습니다. (현상 유지)" })
    } else if (resultStatus === 'destroy') {
      toast({ variant: "destructive", title: "파괴됨!", description: "검이 가루가 되었습니다... (+0 초기화)" })
    }

    setIsEnhancing(false)
  }

  if (isUserLoading || isProfileLoading || isUserDataLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-6">
        {/* 메인 게임 화면 */}
        <div className="flex-grow space-y-6">
          <Card className="border-none shadow-2xl bg-card rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-primary/5 p-6 border-b border-primary/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary rounded-2xl shadow-lg">
                    <Sword className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black">검 강화 게임</CardTitle>
                    <CardDescription className="text-xs font-bold text-primary/60">{userNickname}님의 도전을 응원합니다! (회당 10P)</CardDescription>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className="h-7 px-3 rounded-full border-primary/20 bg-background font-black text-primary">
                    현재: +{currentLevel}
                  </Badge>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                    <Coins className="h-3 w-3" /> {userPoints.toLocaleString()}P 보유
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[400px] flex flex-col bg-muted/20">
                <ScrollArea className="flex-grow p-6" ref={scrollRef}>
                  <div className="space-y-4">
                    <div className="bg-primary/10 p-4 rounded-2xl border border-primary/10 text-xs font-bold text-primary leading-relaxed">
                      📢 [시스템] {userNickname}님, 검 강화 게임에 오신 것을 환영합니다!<br/>
                      - 시도 시 <span className="underline">10포인트</span>가 소모됩니다.<br/>
                      - 파괴 확률이 대폭 낮아졌습니다! 전설의 검을 노려보세요.<br/>
                      - 실패 시 강화 수치가 유지됩니다.
                    </div>

                    {messages.map((msg) => (
                      <div key={msg.id} className="animate-in slide-in-from-bottom-2 duration-300">
                        {msg.status === 'success' && (
                          <div className="bg-green-500/10 p-4 rounded-2xl border border-green-500/20">
                            <p className="text-xs font-black text-green-600 mb-1">🔥 [강화 결과]</p>
                            <p className="text-[11px] font-bold">닉네임: {msg.nickname}</p>
                            <p className="text-[11px] font-bold">현재 강화: +{msg.before} → +{msg.after}</p>
                            <p className="text-[11px] font-black text-green-600">결과: ✅ 성공!</p>
                          </div>
                        )}
                        {msg.status === 'fail' && (
                          <div className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20">
                            <p className="text-xs font-black text-blue-600 mb-1">🛡️ [강화 결과]</p>
                            <p className="text-[11px] font-bold">닉네임: {msg.nickname}</p>
                            <p className="text-[11px] font-bold">현재 강화: +{msg.before} → +{msg.after}</p>
                            <p className="text-[11px] font-black text-blue-600">결과: 💠 현상 유지 (실패)</p>
                          </div>
                        )}
                        {msg.status === 'destroy' && (
                          <div className="bg-destructive/10 p-4 rounded-2xl border border-destructive/20">
                            <p className="text-xs font-black text-destructive mb-1">💥 [강화 결과]</p>
                            <p className="text-[11px] font-bold">닉네임: {msg.nickname}</p>
                            <p className="text-[11px] font-bold">현재 강화: +{msg.before} → +0</p>
                            <p className="text-[11px] font-black text-destructive">결과: 💀 파괴됨 (초기화)!</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="p-6 bg-card border-t flex flex-col gap-3">
                  <Button 
                    onClick={handleEnhance} 
                    disabled={isEnhancing || userPoints < ENHANCE_COST}
                    className="w-full h-14 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90 text-white shadow-xl active:scale-95 transition-all"
                  >
                    {isEnhancing ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Flame className="mr-2 h-5 w-5" /> 강화 시도 (10P)</>}
                  </Button>
                  {userPoints < ENHANCE_COST && (
                    <p className="text-[10px] text-center text-destructive font-bold">포인트가 부족합니다.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-4">
             <Card className="rounded-3xl border-none bg-green-500/5 p-4 text-center">
               <p className="text-[10px] font-black text-green-600 uppercase mb-1">0 ~ 5단계</p>
               <p className="text-[11px] font-bold">성공 70% | 파괴 2%</p>
             </Card>
             <Card className="rounded-3xl border-none bg-blue-500/5 p-4 text-center">
               <p className="text-[10px] font-black text-blue-600 uppercase mb-1">6 ~ 10단계</p>
               <p className="text-[11px] font-bold">성공 50% | 파괴 5%</p>
             </Card>
             <Card className="rounded-3xl border-none bg-destructive/5 p-4 text-center">
               <p className="text-[10px] font-black text-destructive uppercase mb-1">11단계 +</p>
               <p className="text-[11px] font-bold">성공 30% | 파괴 10%</p>
             </Card>
          </div>
        </div>

        {/* 순위표 */}
        <div className="w-full md:w-72 space-y-6">
          <Card className="border-none shadow-xl bg-card rounded-[2rem] overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" /> 강화 순위
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {rankings?.map((r, i) => (
                <div key={r.id} className={cn(
                  "flex justify-between items-center p-3 rounded-xl text-xs font-bold transition-all",
                  r.id === user?.uid ? "bg-primary text-white scale-105" : "bg-muted/30"
                )}>
                  <div className="flex items-center gap-2">
                    <span className="opacity-50">#{i + 1}</span>
                    <span className="truncate max-w-[80px]">{r.nickname}</span>
                  </div>
                  <Badge variant={r.level >= 10 ? "destructive" : "secondary"} className="h-5 rounded-full text-[10px] font-black">
                    +{r.level}
                  </Badge>
                </div>
              ))}
              {(!rankings || rankings.length === 0) && (
                <p className="text-center py-10 text-[10px] font-bold opacity-30 italic">도전자가 아직 없습니다.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-card rounded-[2rem] p-6 text-center space-y-3">
             <div className="mx-auto h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
               <Zap className="h-6 w-6 text-accent" />
             </div>
             <div className="space-y-1">
               <p className="text-[10px] font-black opacity-40 uppercase">나의 최고 기록</p>
               <p className="text-2xl font-black text-primary">+{profile?.maxLevel || 0}</p>
             </div>
             <p className="text-[10px] font-bold text-muted-foreground">총 {profile?.totalAttempts || 0}번의 도전</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
