
"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { 
  Sword, 
  Flame, 
  Trophy, 
  Zap, 
  Loader2,
  Coins,
  UserPlus,
  Users,
  Search,
  UserMinus,
  MessageSquare,
  LogOut,
  Bell,
  Check,
  X
} from "lucide-react"
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase"
import { doc, setDoc, serverTimestamp, query, collection, orderBy, limit, increment, updateDoc, where, getDocs, deleteDoc, addDoc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

type GameMessage = {
  id: string;
  type: 'result';
  status: 'success' | 'fail' | 'decrease' | 'destroy';
  nickname: string;
  before: number;
  after: number;
  timestamp: any;
}

export default function SwordGamePage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const [isEnhancing, setIsEnhancing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // 합동 플레이 상태
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [isInviting, setIsInviting] = useState<string | null>(null)

  // Friend System States
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])

  // 1. 유저 프로필
  const userDocRef = useMemoFirebase(() => {
    if (!user) return null
    return doc(db, "users", user.uid)
  }, [user, db])
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef)

  // 2. 사용자 게임 프로필
  const profileRef = useMemoFirebase(() => {
    if (!user) return null
    return doc(db, "sword_game_profiles", user.uid)
  }, [user, db])
  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef)

  // 3. 전체 순위
  const rankingQuery = useMemoFirebase(() => {
    return query(collection(db, "sword_game_profiles"), orderBy("level", "desc"), limit(10))
  }, [db])
  const { data: rankings } = useCollection(rankingQuery)

  // 4. 친구 목록
  const friendsQuery = useMemoFirebase(() => {
    if (!user) return null
    return collection(db, "users", user.uid, "friends")
  }, [user, db])
  const { data: friendsList } = useCollection(friendsQuery)

  // 5. 받은 초대 목록
  const invitesQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "users", user.uid, "invites"), where("status", "==", "pending"), orderBy("createdAt", "desc"))
  }, [db, user])
  const { data: incomingInvites } = useCollection(invitesQuery)

  // 6. 세션 메시지 (합동 플레이 시)
  const sessionMessagesQuery = useMemoFirebase(() => {
    if (!activeSessionId) return null
    return query(collection(db, "game_sessions", activeSessionId, "messages"), orderBy("timestamp", "asc"), limit(50))
  }, [db, activeSessionId])
  const { data: sessionMessages } = useCollection(sessionMessagesQuery)

  // 7. 로컬 메시지 (싱글 플레이 시)
  const [localMessages, setLocalMessages] = useState<GameMessage[]>([])

  // 8. 전체 유저 (온라인 상태 확인용)
  const usersQuery = useMemoFirebase(() => {
    if (!user) return null
    return collection(db, "users")
  }, [db, user])
  const { data: allUsers } = useCollection(usersQuery)

  const friendsWithStatus = (friendsList || []).map(f => {
    const userDetail = allUsers?.find(u => u.id === f.friendId)
    const gameProfile = rankings?.find(r => r.userId === f.friendId) || { level: 0 }
    return {
      ...f,
      isOnline: userDetail?.isOnline || false,
      level: gameProfile.level || 0
    }
  }).sort((a, b) => (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0))

  useEffect(() => {
    if (!isUserLoading && !user) router.push("/login")
  }, [user, isUserLoading, router])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [localMessages, sessionMessages])

  const currentLevel = profile?.level || 0
  const userNickname = userData?.nickname || "학생"
  const userPoints = userData?.points || 0
  const ENHANCE_COST = 10

  const getRates = (level: number) => {
    let success = 100;
    let decrease = 0;
    let destroy = 0;

    if (level === 0) {
      success = 100;
    } else if (level < 5) {
      success = 95 - (level * 8); 
      decrease = level + 1; 
      destroy = Math.floor(level / 2); 
    } else {
      success = Math.max(5, 50 - (level - 5) * 6); 
      decrease = Math.min(40, 20 + (level - 5) * 4); 
      destroy = Math.min(20, 5 + (level - 5) * 2); 
    }

    const fail = Math.max(0, 100 - success - decrease - destroy);

    return { 
      success: Math.round(success), 
      fail: Math.round(fail), 
      decrease: Math.round(decrease),
      destroy: Math.round(destroy) 
    };
  }

  const currentRates = getRates(currentLevel);

  const handleEnhance = async () => {
    if (!user || !profileRef || !userData || !userDocRef || isEnhancing) return
    
    if (userPoints < ENHANCE_COST) {
      toast({ variant: "destructive", title: "포인트 부족!", description: "학습을 통해 포인트를 모아보세요!" })
      return
    }

    setIsEnhancing(true)

    updateDoc(userDocRef, {
      points: increment(-ENHANCE_COST),
      updatedAt: serverTimestamp()
    }).catch(async () => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'update'
      }))
    })

    const level = currentLevel
    const roll = Math.random() * 100
    const { success, fail, decrease, destroy } = getRates(level);

    let resultStatus: 'success' | 'fail' | 'decrease' | 'destroy'
    let nextLevel = level

    if (roll < success) {
      resultStatus = 'success'
      nextLevel = level + 1
    } else if (roll < success + fail) {
      resultStatus = 'fail'
      nextLevel = level
    } else if (roll < success + fail + decrease) {
      resultStatus = 'decrease'
      nextLevel = Math.max(0, level - 1)
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

    setDoc(profileRef, gameData, { merge: true })
      .catch(async () => {
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

    if (activeSessionId) {
      addDoc(collection(db, "game_sessions", activeSessionId, "messages"), {
        ...newMessage,
        timestamp: serverTimestamp()
      })
    } else {
      setLocalMessages(prev => [...prev.slice(-49), newMessage])
    }
    setIsEnhancing(false)
  }

  // 친구 초대 보내기
  const handleInviteFriend = async (friendId: string, friendNickname: string) => {
    if (!user || !userData) return
    setIsInviting(friendId)
    
    try {
      const sessionId = [user.uid, friendId].sort().join("_")
      
      // 세션 문서 생성
      await setDoc(doc(db, "game_sessions", sessionId), {
        participants: [user.uid, friendId],
        active: true,
        createdAt: serverTimestamp()
      }, { merge: true })

      // 친구에게 초대 알림 전송
      const inviteRef = doc(collection(db, "users", friendId, "invites"))
      await setDoc(inviteRef, {
        fromId: user.uid,
        fromNickname: userData.nickname,
        status: "pending",
        sessionId: sessionId,
        createdAt: serverTimestamp()
      })

      toast({ title: "초대 전송!", description: `${friendNickname}님에게 합동 플레이 초대를 보냈습니다.` })
    } catch (e) {
      console.error(e)
    } finally {
      setIsInviting(null)
    }
  }

  // 초대 수락
  const handleAcceptInvite = async (invite: any) => {
    if (!user) return
    try {
      await updateDoc(doc(db, "users", user.uid, "invites", invite.id), { status: "accepted" })
      setActiveSessionId(invite.sessionId)
      toast({ title: "초대 수락!", description: "합동 플레이 룸으로 입장합니다." })
    } catch (e) {
      console.error(e)
    }
  }

  // 초대 거절
  const handleRejectInvite = async (inviteId: string) => {
    if (!user) return
    await deleteDoc(doc(db, "users", user.uid, "invites", inviteId))
  }

  // 세션 나가기
  const handleExitSession = () => {
    setActiveSessionId(null)
    toast({ title: "세션 종료", description: "싱글 플레이 모드로 전환합니다." })
  }

  // 친구 검색 로직
  const handleSearchFriend = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    try {
      const qNick = query(collection(db, "users"), where("nickname", "==", searchQuery.trim()))
      const qId = query(collection(db, "users"), where("username", "==", searchQuery.trim()))
      
      const [resNick, resId] = await Promise.all([getDocs(qNick), getDocs(qId)])
      const results: any[] = []
      resNick.forEach(doc => results.push({ id: doc.id, ...doc.data() }))
      resId.forEach(doc => {
        if (!results.find(r => r.id === doc.id)) results.push({ id: doc.id, ...doc.data() })
      })
      
      setSearchResults(results.filter(r => r.id !== user?.uid))
    } catch (e) {
      console.error(e)
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddFriend = async (friend: any) => {
    if (!user) return
    const friendRef = doc(db, "users", user.uid, "friends", friend.id)
    await setDoc(friendRef, {
      friendId: friend.id,
      nickname: friend.nickname,
      username: friend.username,
      addedAt: serverTimestamp()
    })
    toast({ title: "친구 추가 완료!", description: `${friend.nickname}님과 친구가 되었습니다.` })
    setSearchResults([])
    setSearchQuery("")
  }

  const handleRemoveFriend = async (friendId: string) => {
    if (!user) return
    await deleteDoc(doc(db, "users", user.uid, "friends", friendId))
    toast({ title: "친구 삭제 완료" })
  }

  if (isUserLoading || isProfileLoading || isUserDataLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  const displayMessages = activeSessionId ? (sessionMessages || []) : localMessages

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* 메인 게임 영역 */}
        <div className="flex-grow space-y-6">
          <Card className={cn(
            "border-none shadow-2xl bg-card rounded-[2.5rem] overflow-hidden transition-all duration-500",
            activeSessionId && "ring-4 ring-primary/20 scale-[1.01]"
          )}>
            <CardHeader className={cn(
              "p-6 border-b border-primary/10 transition-colors",
              activeSessionId ? "bg-primary/10" : "bg-primary/5"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-3 rounded-2xl shadow-lg transition-colors",
                    activeSessionId ? "bg-accent text-accent-foreground" : "bg-primary text-white"
                  )}>
                    {activeSessionId ? <Users className="h-6 w-6" /> : <Sword className="h-6 w-6" />}
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black">
                      {activeSessionId ? "합동 플레이 룸" : "검 강화 게임"}
                    </CardTitle>
                    <CardDescription className="text-xs font-bold text-primary/60">
                      {activeSessionId ? "친구와 함께 실시간으로 강화 중!" : `${userNickname}님의 도전! (회당 10P)`}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className="h-7 px-3 rounded-full border-primary/20 bg-background font-black text-primary">
                      현재: +{currentLevel}
                    </Badge>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                      <Coins className="h-3 w-3" /> {userPoints.toLocaleString()}P 보유
                    </div>
                  </div>
                  {activeSessionId && (
                    <Button variant="ghost" size="icon" onClick={handleExitSession} className="text-destructive hover:bg-destructive/10 rounded-full h-10 w-10">
                      <LogOut className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[450px] flex flex-col bg-muted/20 relative">
                <ScrollArea className="flex-grow p-6">
                  <div className="space-y-4">
                    <div className="bg-primary/10 p-4 rounded-2xl border border-primary/10 text-xs font-bold text-primary leading-relaxed">
                      {activeSessionId ? (
                        <>📢 [시스템] 합동 플레이 모드 활성화!<br/>- 친구의 강화 소식도 이곳에 실시간으로 표시됩니다.</>
                      ) : (
                        <>📢 [시스템] {userNickname}님, 환영합니다!<br/>- 10포인트 소모 | 5단계부터 하락 위험!<br/>- 친구를 초대해 함께 즐겨보세요.</>
                      )}
                    </div>

                    {displayMessages.map((msg: any) => (
                      <div key={msg.id} className="animate-in slide-in-from-bottom-2 duration-300">
                        <div className={cn(
                          "p-4 rounded-2xl border transition-all",
                          msg.nickname === userNickname ? "ml-4" : "mr-4 border-dashed",
                          msg.status === 'success' ? "bg-green-500/10 border-green-500/20" :
                          msg.status === 'fail' ? "bg-blue-500/10 border-blue-500/20" :
                          msg.status === 'decrease' ? "bg-orange-500/10 border-orange-500/20" :
                          "bg-destructive/10 border-destructive/20"
                        )}>
                          <p className={cn("text-[10px] font-black mb-1 uppercase tracking-widest", 
                            msg.status === 'success' ? "text-green-600" :
                            msg.status === 'fail' ? "text-blue-600" :
                            msg.status === 'decrease' ? "text-orange-600" : "text-destructive"
                          )}>
                            {msg.status === 'success' ? '🔥 SUCCESS' : 
                             msg.status === 'fail' ? '🛡️ STABLE' : 
                             msg.status === 'decrease' ? '📉 DECREASE' : '💥 DESTROYED'}
                          </p>
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-xs font-black">{msg.nickname}</p>
                              <p className="text-[11px] font-bold opacity-60">+{msg.before} → +{msg.after}</p>
                            </div>
                            <span className="text-lg font-black">
                              {msg.status === 'success' ? '✅' : 
                               msg.status === 'fail' ? '💠' : 
                               msg.status === 'decrease' ? '⚠️' : '💀'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                
                <div className="p-6 bg-card border-t flex flex-col gap-4">
                  <div className="bg-muted/30 p-3 rounded-xl border border-dashed grid grid-cols-4 gap-2 text-center">
                    <div className="flex flex-col"><span className="text-[9px] font-bold text-green-600 opacity-60">성공</span><span className="text-xs font-black text-green-600">{currentRates.success}%</span></div>
                    <div className="flex flex-col"><span className="text-[9px] font-bold text-blue-600 opacity-60">유지</span><span className="text-xs font-black text-blue-600">{currentRates.fail}%</span></div>
                    <div className="flex flex-col"><span className="text-[9px] font-bold text-orange-600 opacity-60">하락</span><span className="text-xs font-black text-orange-600">{currentRates.decrease}%</span></div>
                    <div className="flex flex-col"><span className="text-[9px] font-bold text-destructive opacity-60">파괴</span><span className="text-xs font-black text-destructive">{currentRates.destroy}%</span></div>
                  </div>
                  <Button onClick={handleEnhance} disabled={isEnhancing || userPoints < ENHANCE_COST} className="w-full h-14 rounded-2xl font-black text-lg bg-primary shadow-xl active:scale-95 transition-all">
                    {isEnhancing ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Flame className="mr-2 h-5 w-5" /> 강화 시도 (10P)</>}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 사이드바: 친구 & 순위 */}
        <div className="w-full lg:w-80 space-y-6">
          {/* 받은 초대 알림 */}
          {incomingInvites && incomingInvites.length > 0 && (
            <div className="space-y-2 animate-in zoom-in-95 duration-300">
              <p className="text-[10px] font-black text-primary flex items-center gap-1.5 px-2">
                <Bell className="h-3 w-3" /> 도착한 초대 ({incomingInvites.length})
              </p>
              {incomingInvites.map((inv) => (
                <Card key={inv.id} className="border-none shadow-lg bg-primary text-white rounded-2xl overflow-hidden">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex-grow">
                      <p className="text-[10px] font-bold opacity-80">합동 플레이 초대</p>
                      <p className="text-xs font-black">{inv.fromNickname}님</p>
                    </div>
                    <div className="flex gap-1.5">
                      <Button size="icon" onClick={() => handleAcceptInvite(inv)} className="h-8 w-8 rounded-full bg-white text-primary hover:bg-white/90">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleRejectInvite(inv.id)} className="h-8 w-8 rounded-full text-white/50 hover:bg-white/10">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Tabs defaultValue="friends">
            <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-muted/50 p-1 mb-4">
              <TabsTrigger value="friends" className="rounded-xl font-bold text-xs"><Users className="h-3 w-3 mr-1" /> 친구</TabsTrigger>
              <TabsTrigger value="ranking" className="rounded-xl font-bold text-xs"><Trophy className="h-3 w-3 mr-1" /> 순위</TabsTrigger>
            </TabsList>

            <TabsContent value="friends" className="space-y-4 m-0">
              <Card className="border-none shadow-xl bg-card rounded-[2rem] overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-black flex items-center gap-2">친구 관리</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="아이디 또는 닉네임" 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchFriend()}
                      className="h-9 text-xs rounded-xl bg-muted/30 border-none"
                    />
                    <Button size="icon" onClick={handleSearchFriend} disabled={isSearching} className="h-9 w-9 rounded-xl shrink-0"><Search className="h-4 w-4" /></Button>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="bg-primary/5 p-3 rounded-2xl space-y-2 border border-primary/10 animate-in zoom-in-95">
                      <p className="text-[10px] font-black text-primary px-1">검색 결과</p>
                      {searchResults.map(res => (
                        <div key={res.id} className="flex items-center justify-between bg-card p-2 rounded-xl shadow-sm border border-primary/5">
                          <span className="text-xs font-bold">{res.nickname}</span>
                          <Button size="sm" onClick={() => handleAddFriend(res)} className="h-7 rounded-lg text-[10px] font-black"><UserPlus className="h-3 w-3 mr-1" /> 추가</Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2 pr-2">
                      {friendsWithStatus.map(f => (
                        <div key={f.friendId} className="group flex items-center justify-between p-3 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <div className="h-8 w-8 bg-card rounded-full border flex items-center justify-center font-black text-xs">
                                {f.nickname[0]}
                              </div>
                              <div className={cn(
                                "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
                                f.isOnline ? "bg-green-500" : "bg-gray-400"
                              )} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-black">{f.nickname}</span>
                              <span className="text-[9px] font-bold text-primary">+{f.level} 검 보유</span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {f.isOnline && !activeSessionId && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleInviteFriend(f.friendId, f.nickname)}
                                disabled={isInviting === f.friendId}
                                className="h-7 rounded-lg text-[9px] font-black border-primary/20 text-primary hover:bg-primary/10"
                              >
                                {isInviting === f.friendId ? <Loader2 className="h-3 w-3 animate-spin" /> : "함께하기"}
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleRemoveFriend(f.friendId)}
                              className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                            >
                              <UserMinus className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {friendsWithStatus.length === 0 && (
                        <p className="text-center py-10 text-[10px] font-bold text-muted-foreground italic">아직 친구가 없습니다.</p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ranking" className="space-y-4 m-0">
              <Card className="border-none shadow-xl bg-card rounded-[2rem] overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-black flex items-center gap-2 text-yellow-500"><Trophy className="h-4 w-4" /> 강화 TOP 10</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  {rankings?.map((r, i) => (
                    <div key={r.id} className={cn(
                      "flex justify-between items-center p-3 rounded-2xl text-xs font-bold transition-all",
                      r.userId === user?.uid ? "bg-primary text-white scale-105" : "bg-muted/30"
                    )}>
                      <div className="flex items-center gap-2">
                        <span className="opacity-50">#{i + 1}</span>
                        <span className="truncate max-w-[80px]">{r.nickname}</span>
                      </div>
                      <Badge variant={r.level >= 10 ? "destructive" : "secondary"} className="h-5 rounded-full text-[10px] font-black">+{r.level}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="border-none shadow-xl bg-card rounded-[2rem] p-6 text-center space-y-3">
             <div className="mx-auto h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center"><Zap className="h-6 w-6 text-accent" /></div>
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
