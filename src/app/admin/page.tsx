
"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { 
  ShieldAlert, 
  Trash2, 
  Loader2, 
  BrainCircuit, 
  Coins,
  Save,
  Quote,
  MessageSquare,
  Eraser,
  CalendarDays,
  Copy,
  Info,
  RefreshCw,
  Edit2,
  Settings2
} from "lucide-react"
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { doc, setDoc, serverTimestamp, query, orderBy, collection, addDoc, limit, updateDoc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { cn } from "@/lib/utils"

export default function AdminPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState("all")
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({})
  const [tempPoints, setTempPoints] = useState<{ [key: string]: number }>({})
  const [tempVotes, setTempVotes] = useState<{ [key: string]: number }>({})

  const adminRef = useMemoFirebase(() => {
    if (!user?.uid) return null
    return doc(db, "roles_admin", user.uid)
  }, [user?.uid, db])

  const { data: isAdminDoc, isLoading: isAdminLoading } = useDoc(adminRef)
  
  const isActuallyAdmin = useMemo(() => {
    return !!isAdminDoc && !isAdminLoading;
  }, [isAdminDoc, isAdminLoading]);

  const configRef = useMemoFirebase(() => {
    if (!isActuallyAdmin) return null
    return doc(db, "metadata", "config")
  }, [isActuallyAdmin, db])
  const { data: configData } = useDoc(configRef)

  const teachersQuery = useMemoFirebase(() => {
    if (!isActuallyAdmin) return null
    return query(collection(db, "teachers"), orderBy("vote", "desc"))
  }, [db, isActuallyAdmin])
  const { data: teachers } = useCollection(teachersQuery)

  const usersQuery = useMemoFirebase(() => {
    if (!isActuallyAdmin) return null
    return query(collection(db, "users"), orderBy("username", "asc"))
  }, [db, isActuallyAdmin])
  const { data: allUsers } = useCollection(usersQuery)

  const inquiriesQuery = useMemoFirebase(() => {
    if (!isActuallyAdmin) return null
    return query(collection(db, "inquiries"), orderBy("createdAt", "desc"), limit(100))
  }, [db, isActuallyAdmin])
  const { data: inquiries } = useCollection(inquiriesQuery)

  const adminDocsQuery = useMemoFirebase(() => {
    if (!isActuallyAdmin) return null
    return collection(db, "roles_admin")
  }, [db, isActuallyAdmin])
  const { data: adminDocs } = useCollection(adminDocsQuery)

  const allProblemsQuery = useMemoFirebase(() => {
    if (!isActuallyAdmin) return null
    return collection(db, "daily_problems")
  }, [db, isActuallyAdmin])
  const { data: allProblems } = useCollection(allProblemsQuery)

  const allFortunesQuery = useMemoFirebase(() => {
    if (!isActuallyAdmin) return null
    return collection(db, "daily_fortunes")
  }, [db, isActuallyAdmin])
  const { data: allFortunes } = useCollection(allFortunesQuery)

  const adminIds = useMemo(() => adminDocs?.map(d => d.id) || [], [adminDocs])

  const [teacherName, setTeacherName] = useState("")
  const [noticeText, setNoticeText] = useState("")
  const [adminSecretCode, setAdminSecretCode] = useState("")
  const [kakaoApiKey, setKakaoApiKey] = useState("")
  const [bulkProblemText, setBulkProblemText] = useState("")
  const [bulkFortuneText, setBulkFortuneText] = useState("")
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(new Date())

  const [pointsConfig, setPointsConfig] = useState({
    dailyAttendance: 100,
    streak7: 1000,
    streak30: 5000,
    problemDefault: 100
  })

  useEffect(() => {
    setIsMounted(true)
    if (configData) {
      setNoticeText(configData.notice || "")
      setAdminSecretCode(configData.adminSecret || "ufes-admin-777")
      setKakaoApiKey(configData.kakaoApiKey || "")
      if (configData.pointConfig) {
        setPointsConfig({
          dailyAttendance: configData.pointConfig.dailyAttendance || 100,
          streak7: configData.pointConfig.streak7 || 1000,
          streak30: configData.pointConfig.streak30 || 5000,
          problemDefault: configData.pointConfig.problemDefault || 100
        })
      }
    }
  }, [configData])

  useEffect(() => {
    if (!isUserLoading && !isAdminLoading && isMounted) {
      if (!user || !isActuallyAdmin) {
        router.push("/dashboard")
      }
    }
  }, [user, isActuallyAdmin, isUserLoading, isAdminLoading, isMounted, router])

  const handleAddTeacher = () => {
    if (!teacherName.trim()) return
    setIsSaving(true)
    addDoc(collection(db, "teachers"), { 
      name: teacherName, 
      vote: 0, 
      createdAt: serverTimestamp() 
    })
      .then(() => {
        toast({ title: "교사 등록 완료" })
        setTeacherName("")
      })
      .finally(() => setIsSaving(false))
  }

  const handleDeleteTeacher = (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return
    deleteDocumentNonBlocking(doc(db, "teachers", id))
    toast({ title: "삭제 완료" })
  }

  const handleResetAllVotes = async () => {
    if (!teachers || teachers.length === 0) return
    if (!confirm("정말 모든 투표 결과를 0으로 초기화하시겠습니까?")) return
    
    setIsSaving(true)
    try {
      const promises = teachers.map(t => 
        updateDoc(doc(db, "teachers", t.id), { vote: 0, updatedAt: serverTimestamp() })
      )
      await Promise.all(promises)
      toast({ title: "투표 결과 초기화 완료" })
    } catch (e) {
      toast({ variant: "destructive", title: "초기화 실패" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateVoteCount = (teacherId: string) => {
    const newVote = tempVotes[teacherId]
    if (newVote === undefined || isNaN(newVote)) return
    setIsSaving(true)
    updateDocumentNonBlocking(doc(db, "teachers", teacherId), { vote: newVote, updatedAt: serverTimestamp() })
    toast({ title: "투표수 수정 완료" })
    setIsSaving(false)
  }

  const handleUpdateConfig = () => {
    if (!configRef) return
    setIsSaving(true)
    setDoc(configRef, { 
      notice: noticeText, 
      adminSecret: adminSecretCode,
      kakaoApiKey: kakaoApiKey,
      pointConfig: pointsConfig
    }, { merge: true })
      .then(() => toast({ title: "저장 완료" }))
      .finally(() => setIsSaving(false))
  }

  const handleToggleAdmin = (userId: string, isCurrentlyAdmin: boolean) => {
    if (userId === user?.uid) return
    const targetAdminRef = doc(db, "roles_admin", userId)
    if (isCurrentlyAdmin) {
      deleteDocumentNonBlocking(targetAdminRef)
      toast({ title: "권한 해제" })
    } else {
      setDoc(targetAdminRef, { addedAt: serverTimestamp() }).then(() => toast({ title: "권한 부여" }))
    }
  }

  const handleSendReply = (inquiryId: string) => {
    const text = replyText[inquiryId]
    if (!text?.trim()) return
    setIsSaving(true)
    
    updateDocumentNonBlocking(doc(db, "inquiries", inquiryId), {
      reply: text.trim(),
      status: "replied",
      isRead: false,
      updatedAt: serverTimestamp()
    })
    
    toast({ title: "답변이 전송되었습니다." })
    setReplyText({ ...replyText, [inquiryId]: "" })
    setIsSaving(false)
  }

  const handleDeleteInquiry = (id: string) => {
    if (!id) return
    if (!confirm("이 문의를 영구 삭제하시겠습니까?")) return
    deleteDocumentNonBlocking(doc(db, "inquiries", id))
    toast({ title: "문의가 삭제되었습니다." })
  }

  const handleDeleteAllInquiries = () => {
    if (!inquiries || inquiries.length === 0) return
    if (!confirm(`정말 ${inquiries.length}개의 모든 문의를 삭제하시겠습니까?`)) return
    
    inquiries.forEach(iq => {
      if (iq.id) {
        deleteDocumentNonBlocking(doc(db, "inquiries", iq.id))
      }
    })
    toast({ title: "전체 삭제 완료" })
  }

  const handleBulkProblems = async () => {
    if (!bulkProblemText.trim()) return
    setIsSaving(true)
    const lines = bulkProblemText.trim().split("\n")
    let count = 0
    try {
      for (const line of lines) {
        if (!line.trim()) continue
        const [date, grade, title, topic, difficulty, problemText, answer, rewardPoints] = line.split("|")
        if (date && grade && title && problemText && answer) {
          const problemId = `${date}_${grade}`
          await setDoc(doc(db, "daily_problems", problemId), {
            id: problemId,
            date,
            grade,
            title,
            topic: topic || "일반",
            difficulty: difficulty || "중",
            problemText,
            answer,
            rewardPoints: parseInt(rewardPoints || "100"),
            updatedAt: serverTimestamp()
          })
          count++
        }
      }
      toast({ title: "문제 일괄 등록 완료", description: `${count}개의 문제가 등록되었습니다.` })
      setBulkProblemText("")
    } catch (e) {
      toast({ variant: "destructive", title: "등록 실패" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleBulkFortunes = async () => {
    if (!bulkFortuneText.trim()) return
    setIsSaving(true)
    const lines = bulkFortuneText.trim().split("\n")
    let count = 0
    try {
      for (const line of lines) {
        if (!line.trim()) continue
        const parts = line.split("|")
        const date = parts[0]
        const quoteText = parts[1]
        const author = parts[2] || "알 수 없음"

        if (date && quoteText) {
          await setDoc(doc(db, "daily_fortunes", date), {
            date,
            fortuneText: quoteText,
            author,
            updatedAt: serverTimestamp()
          })
          count++
        }
      }
      toast({ title: "명언 일괄 등록 완료", description: `${count}개의 명언이 등록되었습니다.` })
      setBulkFortuneText("")
    } catch (e) {
      toast({ variant: "destructive", title: "등록 실패" })
    } finally {
      setIsSaving(false)
    }
  }

  const problemExample = `2024-03-25|1|다항식의 덧셈|수학|중|x^2 + 2x + 1 을 x+1로 나누면?|x+1|150\n2024-03-25|2|삼각함수 기초|수학|상|sin(pi/2)의 값은?|1|200`
  const fortuneExample = `2024-03-25|천재는 1%의 영감과 99%의 노력으로 이루어진다|토마스 에디슨\n2024-03-26|실패는 성공의 어머니이다|토마스 에디슨`

  const copyExample = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "예시가 복사되었습니다." })
  }

  if (isUserLoading || isAdminLoading || !isMounted) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 animate-pulse" />
            <ShieldAlert className="absolute inset-0 m-auto h-8 w-8 text-primary animate-bounce-slow" />
          </div>
          <p className="text-sm font-black text-primary/60 animate-pulse">관리자 로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!isActuallyAdmin) return null

  const getDayData = (day: Date) => {
    const dStr = format(day, "yyyy-MM-dd")
    const hasProblem = allProblems?.some(p => p.date === dStr)
    const hasFortune = allFortunes?.some(f => f.date === dStr)
    return { hasProblem, hasFortune }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-8">
        <ShieldAlert className="h-8 w-8 text-destructive" />
        <h1 className="text-2xl font-black font-headline tracking-tight text-primary">KST HUB 관리 시스템</h1>
      </div>

      <Tabs defaultValue="inquiry">
        <TabsList className="grid w-full grid-cols-7 mb-6 bg-muted/50 p-1 rounded-2xl overflow-hidden">
          <TabsTrigger value="inquiry" className="rounded-xl font-bold text-xs"><MessageSquare className="h-3 w-3 mr-1" /> 문의</TabsTrigger>
          <TabsTrigger value="users" className="rounded-xl font-bold text-xs">학생</TabsTrigger>
          <TabsTrigger value="points" className="rounded-xl font-bold text-xs"><Coins className="h-3 w-3 mr-1" /> 포인트</TabsTrigger>
          <TabsTrigger value="bulk" className="rounded-xl font-bold text-xs">등록/현황</TabsTrigger>
          <TabsTrigger value="vote" className="rounded-xl font-bold text-xs">투표</TabsTrigger>
          <TabsTrigger value="notice" className="rounded-xl font-bold text-xs">공지</TabsTrigger>
          <TabsTrigger value="config" className="rounded-xl font-bold text-xs">설정</TabsTrigger>
        </TabsList>

        <TabsContent value="inquiry">
          <div className="flex justify-end mb-4">
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleDeleteAllInquiries}
              disabled={!inquiries || inquiries.length === 0}
              className="rounded-full font-black text-[10px] h-8"
            >
              <Eraser className="h-3 w-3 mr-1" /> 전체 문의 삭제
            </Button>
          </div>
          <div className="space-y-4">
            {inquiries?.map((iq) => (
              <Card key={iq.id} className="border-none shadow-sm bg-card rounded-3xl overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge variant={iq.status === "open" ? "destructive" : "outline"} className="text-[10px] font-black rounded-full px-2">
                        {iq.status === "open" ? "미답변" : "답변완료"}
                      </Badge>
                      <span className="text-[10px] font-bold text-muted-foreground">{iq.userNickname} 학생</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground font-medium">{iq.createdAt?.toDate?.().toLocaleString() || "방금 전"}</span>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteInquiry(iq.id)} className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-full">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm">
                    <p className="font-black mb-1 text-primary">Q: {iq.subject}</p>
                    <p className="opacity-80 whitespace-pre-wrap leading-relaxed font-bold bg-muted/20 p-4 rounded-2xl">{iq.message}</p>
                  </div>
                  <div className="flex gap-2 items-start">
                    <Textarea 
                      className="min-h-[80px] text-xs bg-muted/20 rounded-2xl border-none focus-visible:ring-primary" 
                      placeholder="답변 내용을 입력하세요..." 
                      defaultValue={iq.reply} 
                      onChange={(e) => setReplyText({ ...replyText, [iq.id]: e.target.value })} 
                    />
                    <Button 
                      size="sm" 
                      onClick={() => setReplyText({ ...replyText, [iq.id]: replyText[iq.id] || "" }) && handleSendReply(iq.id)} 
                      disabled={isSaving}
                      className="font-black rounded-2xl px-5 h-[80px] bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "답변"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!inquiries || inquiries.length === 0) && (
              <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-muted-foreground/20">
                <p className="text-xs text-muted-foreground font-bold italic">처리할 문의가 없습니다.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <CardTitle className="text-sm font-black">학생 명단 및 포인트 관리</CardTitle>
              <Select value={selectedTeacherFilter} onValueChange={setSelectedTeacherFilter}>
                <SelectTrigger className="w-40 h-8 text-[10px] rounded-full bg-background"><SelectValue placeholder="교사 필터" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {teachers?.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="space-y-2 p-4">
              {allUsers?.filter(u => selectedTeacherFilter === "all" || u.teacherId === selectedTeacherFilter).map((u) => (
                <div key={u.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-muted/30 rounded-2xl text-[11px] hover:bg-muted/50 transition-all gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-sm">{u.nickname}</span>
                    <span className="opacity-60 font-bold">{u.schoolName} {u.grade}학년</span>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center gap-2 bg-card/50 p-1.5 rounded-xl border border-primary/10 shadow-sm">
                      <Coins className="h-3 w-3 text-primary" />
                      <Input 
                        type="number" 
                        defaultValue={u.points} 
                        onChange={(e) => setTempPoints({ ...tempPoints, [u.id]: parseInt(e.target.value) })}
                        className="w-20 h-7 text-[10px] border-none bg-transparent font-black text-primary p-0 text-right focus-visible:ring-0" 
                      />
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6 rounded-lg text-primary hover:bg-primary/10"
                        onClick={() => {
                           const newPoints = tempPoints[u.id]
                           if (newPoints === undefined || isNaN(newPoints)) return
                           setIsSaving(true)
                           updateDocumentNonBlocking(doc(db, "users", u.id), { points: newPoints, updatedAt: serverTimestamp() })
                           toast({ title: "포인트 수정 완료" })
                           setIsSaving(false)
                        }}
                        disabled={isSaving || tempPoints[u.id] === undefined}
                      >
                        <Save className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className="opacity-60 font-bold">Admin</span>
                      <Switch 
                        checked={adminIds.includes(u.id)} 
                        onCheckedChange={() => handleToggleAdmin(u.id, adminIds.includes(u.id))} 
                        disabled={u.id === user?.uid} 
                        className="scale-75"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="points">
          <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" /> 시스템 포인트 지급액 설정
              </CardTitle>
              <CardDescription className="text-xs">학생들이 활동 시 지급되는 포인트 양을 조절합니다.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold">일일 출석 기본 포인트</Label>
                  <Input 
                    type="number" 
                    value={pointsConfig.dailyAttendance} 
                    onChange={(e) => setPointsConfig({...pointsConfig, dailyAttendance: parseInt(e.target.value)})}
                    className="rounded-xl bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold">7일 연속 출석 보너스</Label>
                  <Input 
                    type="number" 
                    value={pointsConfig.streak7} 
                    onChange={(e) => setPointsConfig({...pointsConfig, streak7: parseInt(e.target.value)})}
                    className="rounded-xl bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold">30일 연속 출석 보너스</Label>
                  <Input 
                    type="number" 
                    value={pointsConfig.streak30} 
                    onChange={(e) => setPointsConfig({...pointsConfig, streak30: parseInt(e.target.value)})}
                    className="rounded-xl bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold">일일 문제 기본 보상 (개별 설정 없을 때)</Label>
                  <Input 
                    type="number" 
                    value={pointsConfig.problemDefault} 
                    onChange={(e) => setPointsConfig({...pointsConfig, problemDefault: parseInt(e.target.value)})}
                    className="rounded-xl bg-background"
                  />
                </div>
              </div>
              <Button onClick={handleUpdateConfig} disabled={isSaving} className="w-full rounded-2xl h-11 font-black bg-primary text-primary-foreground">
                포인트 설정 저장
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
             <div className="md:col-span-7 space-y-6">
                <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden">
                  <CardHeader className="border-b pb-4"><CardTitle className="text-sm font-black">데이터 일괄 등록</CardTitle></CardHeader>
                  <CardContent className="p-6 space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <BrainCircuit className="h-4 w-4 text-primary" />
                            <Label className="text-xs font-bold">일일 문제 일괄 등록</Label>
                          </div>
                          <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => copyExample(problemExample)}><Copy className="h-3 w-3 mr-1" /> 예시 복사</Button>
                        </div>
                        <Textarea 
                          placeholder="날짜|학년|제목|토픽|난이도|문제내용|정답|지급포인트" 
                          value={bulkProblemText} 
                          onChange={(e) => setBulkProblemText(e.target.value)} 
                          className="rounded-2xl min-h-[120px] text-[11px] font-mono leading-relaxed bg-muted/20 border-none" 
                        />
                        <Button onClick={handleBulkProblems} disabled={isSaving || !bulkProblemText.trim()} className="w-full rounded-2xl font-black h-11 bg-primary text-primary-foreground">문제 일괄 등록</Button>
                      </div>
                      
                      <div className="space-y-2 pt-6 border-t">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Quote className="h-4 w-4 text-accent" />
                            <Label className="text-xs font-bold">오늘의 명언 일괄 등록</Label>
                          </div>
                          <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => copyExample(fortuneExample)}><Copy className="h-3 w-3 mr-1" /> 예시 복사</Button>
                        </div>
                        <Textarea 
                          placeholder="날짜|명언내용|작성자" 
                          value={bulkFortuneText} 
                          onChange={(e) => setBulkFortuneText(e.target.value)} 
                          className="rounded-2xl min-h-[100px] text-[11px] font-mono leading-relaxed bg-muted/20 border-none" 
                        />
                        <Button onClick={handleBulkFortunes} disabled={isSaving || !bulkFortuneText.trim()} className="w-full rounded-2xl font-black h-11 bg-accent text-accent-foreground">명언 일괄 등록</Button>
                      </div>
                  </CardContent>
                </Card>
             </div>
             
             <div className="md:col-span-5 space-y-6">
                <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-black flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" /> 데이터 현황 달력
                    </CardTitle>
                    <CardDescription className="text-[10px]">날짜별로 등록된 문제와 명언을 확인하세요.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <div className="p-1 sm:p-2 bg-muted/30 rounded-3xl w-full max-w-full overflow-hidden flex justify-center">
                      <Calendar
                        mode="single"
                        selected={calendarDate}
                        onSelect={setCalendarDate}
                        className="rounded-md border-none scale-90 sm:scale-100"
                        locale={ko}
                        components={{
                          DayContent: (props) => {
                            const { date } = props
                            const { hasProblem, hasFortune } = getDayData(date)
                            return (
                              <div className="relative w-full h-full flex flex-col items-center justify-center p-0.5">
                                <span className="text-xs z-10">{date.getDate()}</span>
                                <div className="absolute bottom-1.5 flex gap-0.5">
                                  {hasProblem && <div className="h-1 w-1 rounded-full bg-primary" />}
                                  {hasFortune && <div className="h-1 w-1 rounded-full bg-accent" />}
                                </div>
                              </div>
                            )
                          }
                        }}
                      />
                    </div>
                    <div className="flex gap-4 mt-4 text-[10px] font-bold">
                      <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-primary" /> 문제 등록됨</div>
                      <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-accent" /> 명언 등록됨</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black flex items-center gap-2">
                      <Info className="h-3 w-3" /> 일괄 등록 형식 가이드
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 bg-muted/30 rounded-2xl">
                      <p className="text-[10px] font-black mb-1">문제 ( | 로 구분 )</p>
                      <code className="text-[9px] block text-primary font-mono leading-relaxed">날짜|학년|제목|토픽|난이도|문제|정답|포인트</code>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-2xl">
                      <p className="text-[10px] font-black mb-1">명언 ( | 로 구분 )</p>
                      <code className="text-[9px] block text-accent font-mono leading-relaxed">날짜|명언내용|작성자</code>
                    </div>
                  </CardContent>
                </Card>
             </div>
          </div>
        </TabsContent>

        <TabsContent value="vote">
          <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden">
             <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
               <div>
                 <CardTitle className="text-sm font-black">선생님 투표 관리</CardTitle>
                 <CardDescription className="text-[10px]">투표수 수정 및 결과 초기화가 가능합니다.</CardDescription>
               </div>
               <Button variant="destructive" size="sm" onClick={handleResetAllVotes} disabled={isSaving} className="rounded-full font-black text-[10px] h-8">
                 <RefreshCw className="h-3 w-3 mr-1" /> 결과 초기화
               </Button>
             </CardHeader>
             <CardContent className="p-6 space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="선생님 성함" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} className="rounded-2xl bg-background" />
                  <Button onClick={handleAddTeacher} className="rounded-2xl font-black bg-primary text-primary-foreground">추가</Button>
                </div>
                <div className="grid gap-2">
                  {teachers?.map(t => (
                    <div key={t.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted/30 rounded-2xl gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm">{t.name}</span>
                        <Badge variant="outline" className="text-[9px] h-4">현재 {t.vote}표</Badge>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="flex items-center gap-1 bg-card/50 p-1 rounded-xl border">
                          <Edit2 className="h-3 w-3 ml-1 text-muted-foreground" />
                          <Input 
                            type="number" 
                            defaultValue={t.vote} 
                            onChange={(e) => setTempVotes({ ...tempVotes, [t.id]: parseInt(e.target.value) })}
                            className="w-16 h-7 text-[10px] border-none bg-transparent font-black text-right p-0 focus-visible:ring-0" 
                          />
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6 rounded-lg text-primary"
                            onClick={() => handleUpdateVoteCount(t.id)}
                            disabled={isSaving || tempVotes[t.id] === undefined}
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTeacher(t.id)} className="h-8 w-8 text-destructive rounded-full hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
             </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notice">
          <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden">
            <CardHeader className="border-b pb-4"><CardTitle className="text-sm font-black">실시간 공지 사항</CardTitle></CardHeader>
            <CardContent className="p-6 space-y-4">
              <Input value={noticeText} onChange={(e) => setNoticeText(e.target.value)} className="rounded-2xl h-11 bg-background" placeholder="공지 내용" />
              <Button onClick={handleUpdateConfig} className="w-full rounded-2xl font-black h-11 bg-primary text-primary-foreground">공지 업데이트</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden">
            <CardHeader className="border-b pb-4"><CardTitle className="text-sm font-black">시스템 설정</CardTitle></CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground">관리자 인증 코드</Label>
                <Input type="password" value={adminSecretCode} onChange={(e) => setAdminSecretCode(e.target.value)} className="rounded-2xl h-11 bg-background" />
              </div>
              <div className="space-y-2 pt-4 border-t">
                <Label className="text-xs font-bold text-muted-foreground">카카오 JavaScript 키</Label>
                <Input type="text" value={kakaoApiKey} onChange={(e) => setKakaoApiKey(e.target.value)} className="rounded-2xl h-11 bg-background" />
              </div>
              <Button onClick={handleUpdateConfig} className="w-full rounded-2xl h-11 font-black bg-destructive text-white">전체 설정 저장</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
