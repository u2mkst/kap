
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
  Coins,
  Info
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
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

  // 자동 스크롤 로직
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const currentLevel = profile?.level || 0
  const userNickname = userData?.nickname || "학생"
  const userPoints = userData?.points || 0
  const ENHANCE_COST = 10

  // 단계별 확률 계산 함수 (1단위)
  const getRates = (level: number) => {
    // 기본 성공 확률: 100%에서 시작하여 레벨당 감소
    // +0~5는 매우 높음, 그 이후 가파르게 감소
    let success = 100;
    if (level < 5) success = 100 - (level * 5); // +0:100, +1:95, +2:90, +3:85, +4:80
    else if (level < 10) success = 75 - (level - 5) * 7; // +5:75, +6:68, +7:61...
    else if (level < 15) success = 40 - (level - 10) * 4; // +10:40, +11:36, +12:32...
    else success = Math.max(5, 20 - (level - 15) * 2); // +15이후 최소 5%까지 수렴

    // 파괴 확률: 레벨이 높을수록 증가 (최대 15% 캡)
    let destroy = 0;
    if (level >= 3) {
      destroy = Math.min(15, Math.floor(level / 2));
    }

    // 유지 확률: 나머지
    const fail = 100 - success - destroy;

    return { 
      success: Math.round(success), 
      fail: Math.round(fail), 
      destroy: Math.round(destroy) 
    };
  }

  const currentRates = getRates(currentLevel);

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
    const { success, fail, destroy } = getRates(level);

    let resultStatus: 'success' | 'fail' | 'destroy'
    let nextLevel = level

    if (roll < success) {
      resultStatus = 'success'
      nextLevel = level + 1
    } else if (roll < success + fail) {
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

    setMessages(prev => [...prev.slice(-49), newMessage]) // 로그 보관량 증가
    
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
              <div className="h-[450px] flex flex-col bg-muted/20 relative">
                <ScrollArea className="flex-grow p-6">
                  <div className="space-y-4">
                    <div className="bg-primary/10 p-4 rounded-2xl border border-primary/10 text-xs font-bold text-primary leading-relaxed">
                      📢 [시스템] {userNickname}님, 검 강화 게임에 오신 것을 환영합니다!<br/>
                      - 시도 시 <span className="underline">10포인트</span>가 소모됩니다.<br/>
                      - 강화 단계가 높아질수록 확률이 점밀하게 변동합니다.<br/>
                      - 행운이 함께하기를 바랍니다!
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
                    {/* 자동 스크롤 타겟 */}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                
                <div className="p-6 bg-card border-t flex flex-col gap-4">
                  <div className="flex justify-between items-center bg-muted/30 p-3 rounded-xl border border-dashed">
                    <div className="flex items-center gap-2 text-[11px] font-black text-primary/60">
                      <Info className="h-3 w-3" /> 다음 강화 정보 (+{currentLevel} → +{currentLevel + 1})
                    </div>
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-bold text-green-600 opacity-60">성공</span>
                        <span className="text-xs font-black text-green-600">{currentRates.success}%</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-bold text-blue-600 opacity-60">유지</span>
                        <span className="text-xs font-black text-blue-600">{currentRates.fail}%</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-bold text-destructive opacity-60">파괴</span>
                        <span className="text-xs font-black text-destructive">{currentRates.destroy}%</span>
                      </div>
                    </div>
                  </div>

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
