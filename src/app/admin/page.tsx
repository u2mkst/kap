
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
  Settings2,
  PlusCircle,
  CalendarPlus,
  ArrowRight,
  KeyRound,
  ShieldCheck,
  History
} from "lucide-react"
import { 
  useFirestore, 
  useUser, 
  useDoc, 
  useCollection, 
  useMemoFirebase, 
  deleteDocumentNonBlocking, 
  updateDocumentNonBlocking,
  setDocumentNonBlocking
} from "@/firebase"
import { doc, serverTimestamp, query, orderBy, collection, limit } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { format, addDays, subDays, isBefore, parseISO, isValid } from "date-fns"

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
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))
  const [claimCode, setClaimSecret] = useState("")

  const [singleProblem, setSingleProblem] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    grade: "1",
    title: "",
    topic: "수학",
    difficulty: "중",
    problemText: "",
    answer: "",
    rewardPoints: 100
  })

  const [singleFortune, setSingleFortune] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    fortuneText: "",
    author: ""
  })

  const adminRef = useMemoFirebase(() => {
    if (!user?.uid) return null
    return doc(db, "roles_admin", user.uid)
  }, [user?.uid, db])

  const { data: isAdminDoc, isLoading: isAdminLoading } = useDoc(adminRef)
  
  const isActuallyAdmin = useMemo(() => {
    return !!user && !!isAdminDoc && isAdminLoading === false;
  }, [user, isAdminDoc, isAdminLoading]);

  const configRef = useMemoFirebase(() => doc(db, "metadata", "config"), [db])
  const { data: configData } = useDoc(configRef)

  const teachersQuery = useMemoFirebase(() => {
    if (!isActuallyAdmin) return null
    return query(collection(db, "teachers"), orderBy("vote", "desc"))
  }, [db, isActuallyAdmin])
  const { data: teachers } = useCollection(teachersQuery)

  const usersQuery = useMemoFirebase(() => {
    if (!isActuallyAdmin) return null
    return query(collection(db, "users"), orderBy("nickname", "asc"))
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
    return query(collection(db, "daily_problems"), orderBy("date", "desc"))
  }, [db, isActuallyAdmin])
  const { data: allProblems } = useCollection(allProblemsQuery)

  const allFortunesQuery = useMemoFirebase(() => {
    if (!isActuallyAdmin) return null
    return query(collection(db, "daily_fortunes"), orderBy("date", "desc"))
  }, [db, isActuallyAdmin])
  const { data: allFortunes } = useCollection(allFortunesQuery)

  const problemsOnSelectedDate = useMemo(() => {
    if (!allProblems) return []
    return allProblems.filter(p => p.date === selectedDate)
  }, [allProblems, selectedDate])

  const fortuneOnSelectedDate = useMemo(() => {
    if (!allFortunes) return undefined
    return allFortunes.find(f => f.date === selectedDate)
  }, [allFortunes, selectedDate])

  const adminIds = useMemo(() => adminDocs?.map(d => d.id) || [], [adminDocs])

  const [teacherName, setTeacherName] = useState("")
  const [noticeText, setNoticeText] = useState("")
  const [adminSecretCode, setAdminSecretCode] = useState("")
  const [bulkProblemText, setBulkProblemText] = useState("")
  const [bulkFortuneText, setBulkFortuneText] = useState("")

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

  const handleClaimAdmin = () => {
    if (!user) return
    const secret = adminSecretCode || "ufes-admin-777"
    if (claimCode === secret) {
      setIsSaving(true)
      const targetRef = doc(db, "roles_admin", user.uid);
      setDocumentNonBlocking(targetRef, {
        addedAt: serverTimestamp(),
        claimed: true,
        nickname: user.displayName || "관리자"
      }, { merge: true })
      toast({ title: "관리자 권한 획득 성공!", description: "이제 모든 관리 기능을 사용할 수 있습니다." })
      setIsSaving(false)
    } else {
      toast({ variant: "destructive", title: "인증 코드가 틀렸습니다." })
    }
  }

  const handleAddTeacher = () => {
    if (!teacherName.trim()) return
    setIsSaving(true)
    const newRef = doc(collection(db, "teachers"))
    setDocumentNonBlocking(newRef, { 
      name: teacherName, 
      vote: 0, 
      createdAt: serverTimestamp() 
    }, { merge: true })
    toast({ title: "교사 등록 완료" })
    setTeacherName("")
    setIsSaving(false)
  }

  const handleDeleteTeacher = (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return
    deleteDocumentNonBlocking(doc(db, "teachers", id))
    toast({ title: "삭제 완료" })
  }

  const handleResetAllVotes = () => {
    if (!teachers || teachers.length === 0) return
    if (!confirm("정말 모든 투표 결과를 0으로 초기화하시겠습니까?")) return
    
    setIsSaving(true)
    teachers.forEach(t => {
      updateDocumentNonBlocking(doc(db, "teachers", t.id), { vote: 0, updatedAt: serverTimestamp() })
    })
    toast({ title: "투표 초기화 완료" })
    setIsSaving(false)
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
    setDocumentNonBlocking(configRef, { 
      notice: noticeText, 
      adminSecret: adminSecretCode,
      pointConfig: pointsConfig
    }, { merge: true })
    toast({ title: "저장 완료" })
    setIsSaving(false)
  }

  const handleToggleAdmin = (userId: string, isCurrentlyAdmin: boolean) => {
    if (userId === user?.uid) return
    const targetAdminRef = doc(db, "roles_admin", userId)
    if (isCurrentlyAdmin) {
      deleteDocumentNonBlocking(targetAdminRef)
      toast({ title: "권한 해제" })
    } else {
      setDocumentNonBlocking(targetAdminRef, { addedAt: serverTimestamp() }, { merge: true })
      toast({ title: "권한 부여" })
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

  const handleCleanupOldData = () => {
    if (!confirm("2일 전의 모든 운세와 문제 기록을 삭제하시겠습니까?")) return
    setIsSaving(true)
    
    const thresholdDate = subDays(new Date(), 2)
    let deleteCount = 0

    allProblems?.forEach(p => {
      const pDate = parseISO(p.date)
      if (isValid(pDate) && isBefore(pDate, thresholdDate)) {
        deleteDocumentNonBlocking(doc(db, "daily_problems", p.id))
        deleteCount++
      }
    })

    allFortunes?.forEach(f => {
      const fDate = parseISO(f.date)
      if (isValid(fDate) && isBefore(fDate, thresholdDate)) {
        deleteDocumentNonBlocking(doc(db, "daily_fortunes", f.date))
        deleteCount++
      }
    })

    toast({ title: "데이터 정리 완료", description: `${deleteCount}개의 오래된 데이터가 삭제되었습니다.` })
    setIsSaving(false)
  }

  const handleBulkProblems = () => {
    if (!bulkProblemText.trim()) return
    setIsSaving(true)
    const lines = bulkProblemText.trim().split("\n")
    let count = 0
    lines.forEach(line => {
      if (!line.trim()) return
      const [date, grade, title, topic, difficulty, problemText, answer, rewardPoints] = line.split("|")
      if (date && grade && title && problemText && answer) {
        const problemId = `${date}_${grade}`
        setDocumentNonBlocking(doc(db, "daily_problems", problemId), {
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
        }, { merge: true })
        count++
      }
    })
    toast({ title: "문제 일괄 등록 완료", description: `${count}개의 문제가 등록되었습니다.` })
    setBulkProblemText("")
    setIsSaving(false)
  }

  const handleSingleProblemSave = () => {
    const { date, grade, title, problemText, answer } = singleProblem
    if (!date || !grade || !title || !problemText || !answer) {
      toast({ variant: "destructive", title: "모든 칸을 채워주세요." })
      return
    }

    setIsSaving(true)
    const problemId = `${date}_${grade}`
    setDocumentNonBlocking(doc(db, "daily_problems", problemId), {
      ...singleProblem,
      id: problemId,
      rewardPoints: Number(singleProblem.rewardPoints),
      updatedAt: serverTimestamp()
    }, { merge: true })
    
    toast({ title: "문제 등록 완료!" })
    setSingleProblem({ ...singleProblem, title: "", problemText: "", answer: "" })
    setIsSaving(false)
  }

  const handleSingleFortuneSave = () => {
    const { date, fortuneText, author } = singleFortune
    if (!date || !fortuneText) {
      toast({ variant: "destructive", title: "날짜와 명언 내용을 입력해주세요." })
      return
    }

    setIsSaving(true)
    setDocumentNonBlocking(doc(db, "daily_fortunes", date), {
      date,
      fortuneText,
      author: author || "알 수 없음",
      updatedAt: serverTimestamp()
    }, { merge: true })
    
    toast({ title: "명언 등록 완료!" })
    setSingleFortune({ ...singleFortune, fortuneText: "", author: "" })
    setIsSaving(false)
  }

  const handleBulkFortunes = () => {
    if (!bulkFortuneText.trim()) return
    setIsSaving(true)
    const lines = bulkFortuneText.trim().split("\n")
    let count = 0
    lines.forEach(line => {
      if (!line.trim()) return
      const parts = line.split("|")
      const date = parts[0]
      const quoteText = parts[1]
      const author = parts[2] || "알 수 없음"

      if (date && quoteText) {
        setDocumentNonBlocking(doc(db, "daily_fortunes", date), {
          date,
          fortuneText: quoteText,
          author,
          updatedAt: serverTimestamp()
        }, { merge: true })
        count++
      }
    })
    toast({ title: "명언 일괄 등록 완료", description: `${count}개의 명언이 등록되었습니다.` })
    setBulkFortuneText("")
    setIsSaving(false)
  }

  if (isUserLoading || isAdminLoading || !isMounted) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!isActuallyAdmin) {
    return (
      <div className="container mx-auto px-4 h-[calc(100vh-120px)] flex items-center justify-center">
        <Card className="w-full max-w-md border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-primary/10 p-8 text-center border-b border-primary/10">
            <div className="mx-auto mb-4 h-16 w-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
              <KeyRound className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-black text-primary">관리자 인증</CardTitle>
            <CardDescription className="text-xs font-bold text-primary/60">관리자 인증 코드를 입력해 주세요.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <Input type="password" placeholder="코드를 입력하세요" value={claimCode} onChange={(e) => setClaimSecret(e.target.value)} className="h-12 rounded-2xl bg-muted/30 border-none text-center tracking-widest" />
            <Button onClick={handleClaimAdmin} disabled={isSaving || !claimCode.trim()} className="w-full h-12 rounded-2xl font-black bg-primary">관리자 권한 획득</Button>
            <Button variant="ghost" onClick={() => router.push("/dashboard")} className="w-full rounded-2xl h-10 text-xs font-bold text-muted-foreground">대시보드로 돌아가기</Button>
          </CardContent>
        </Card>
      </div>
    )
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
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteInquiry(iq.id)} className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-full">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-sm">
                    <p className="font-black mb-1 text-primary">Q: {iq.subject}</p>
                    <p className="opacity-80 whitespace-pre-wrap font-bold bg-muted/20 p-4 rounded-2xl">{iq.message}</p>
                  </div>
                  <div className="flex gap-2 items-start">
                    <Textarea className="min-h-[80px] text-xs bg-muted/20 rounded-2xl border-none" placeholder="답변 내용을 입력하세요..." defaultValue={iq.reply} onChange={(e) => setReplyText({ ...replyText, [iq.id]: e.target.value })} />
                    <Button size="sm" onClick={() => handleSendReply(iq.id)} disabled={isSaving} className="font-black rounded-2xl px-5 h-[80px] bg-primary">답변</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
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
                <div key={u.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-2xl text-[11px]">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-sm">{u.nickname}</span>
                    <span className="opacity-60 font-bold">{u.schoolName} {u.grade}학년</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-card/50 p-1.5 rounded-xl border">
                      <Coins className="h-3 w-3 text-primary" />
                      <Input type="number" defaultValue={u.points} onChange={(e) => setTempPoints({ ...tempPoints, [u.id]: parseInt(e.target.value) })} className="w-20 h-7 text-[10px] border-none bg-transparent font-black text-right p-0" />
                      <Button size="icon" variant="ghost" className="h-6 w-6 rounded-lg text-primary" onClick={() => {
                        const newPoints = tempPoints[u.id]
                        if (newPoints === undefined || isNaN(newPoints)) return
                        setIsSaving(true)
                        updateDocumentNonBlocking(doc(db, "users", u.id), { points: newPoints, updatedAt: serverTimestamp() })
                        toast({ title: "포인트 수정 완료" })
                        setIsSaving(false)
                      }} disabled={isSaving || tempPoints[u.id] === undefined}><Save className="h-3 w-3" /></Button>
                    </div>
                    <Switch checked={adminIds.includes(u.id)} onCheckedChange={() => handleToggleAdmin(u.id, adminIds.includes(u.id))} disabled={u.id === user?.uid} className="scale-75" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="points">
          <Card className="border-none shadow-sm bg-card rounded-3xl p-6 space-y-6">
            <CardHeader><CardTitle className="text-sm font-black">시스템 포인트 설정</CardTitle></CardHeader>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1"><Label className="text-xs font-bold">일일 출석</Label><Input type="number" value={pointsConfig.dailyAttendance} onChange={(e) => setPointsConfig({...pointsConfig, dailyAttendance: parseInt(e.target.value)})} /></div>
              <div className="space-y-1"><Label className="text-xs font-bold">7일 연속</Label><Input type="number" value={pointsConfig.streak7} onChange={(e) => setPointsConfig({...pointsConfig, streak7: parseInt(e.target.value)})} /></div>
              <div className="space-y-1"><Label className="text-xs font-bold">30일 연속</Label><Input type="number" value={pointsConfig.streak30} onChange={(e) => setPointsConfig({...pointsConfig, streak30: parseInt(e.target.value)})} /></div>
              <div className="space-y-1"><Label className="text-xs font-bold">문제 기본</Label><Input type="number" value={pointsConfig.problemDefault} onChange={(e) => setPointsConfig({...pointsConfig, problemDefault: parseInt(e.target.value)})} /></div>
            </div>
            <Button onClick={handleUpdateConfig} disabled={isSaving} className="w-full rounded-2xl h-11 bg-primary">설정 저장</Button>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card className="border-none shadow-sm bg-card rounded-3xl p-6 space-y-4">
                <CardHeader><CardTitle className="text-sm font-black">문제 개별 등록</CardTitle></CardHeader>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="date" value={singleProblem.date} onChange={(e) => setSingleProblem({...singleProblem, date: e.target.value})} className="rounded-xl h-9 text-xs" />
                  <Select value={singleProblem.grade} onValueChange={(v) => setSingleProblem({...singleProblem, grade: v})}><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">1학년</SelectItem><SelectItem value="2">2학년</SelectItem><SelectItem value="3">3학년</SelectItem></SelectContent></Select>
                </div>
                <Input placeholder="제목" value={singleProblem.title} onChange={(e) => setSingleProblem({...singleProblem, title: e.target.value})} className="rounded-xl h-9 text-xs" />
                <Textarea placeholder="문제 내용" value={singleProblem.problemText} onChange={(e) => setSingleProblem({...singleProblem, problemText: e.target.value})} className="rounded-xl min-h-[60px] text-xs" />
                <Input placeholder="정답" value={singleProblem.answer} onChange={(e) => setSingleProblem({...singleProblem, answer: e.target.value})} className="rounded-xl h-9 text-xs" />
                <Button onClick={handleSingleProblemSave} disabled={isSaving} className="w-full rounded-xl h-9 bg-primary">등록</Button>
             </Card>

             <Card className="border-none shadow-sm bg-card rounded-3xl p-6 space-y-4">
                <CardHeader><CardTitle className="text-sm font-black">데이터 현황 ({selectedDate})</CardTitle></CardHeader>
                <Calendar onDateClick={(d) => setSelectedDate(format(d, "yyyy-MM-dd"))} />
                <div className="p-3 bg-muted/30 rounded-xl space-y-2">
                  <p className="text-[10px] font-black">문제: {problemsOnSelectedDate.length}개</p>
                  <p className="text-[10px] font-black">명언: {fortuneOnSelectedDate ? "등록됨" : "없음"}</p>
                </div>
             </Card>
          </div>
        </TabsContent>

        <TabsContent value="vote">
          <Card className="border-none shadow-sm bg-card rounded-3xl p-6 space-y-4">
             <div className="flex gap-2">
               <input placeholder="선생님 성함" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} className="rounded-2xl border px-4 h-10 w-full" />
               <Button onClick={handleAddTeacher} className="rounded-2xl bg-primary">추가</Button>
             </div>
             <div className="grid gap-2">
               {teachers?.map(t => (
                 <div key={t.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-2xl">
                   <span className="font-black text-sm">{t.name} ({t.vote}표)</span>
                   <Button variant="ghost" size="icon" onClick={() => handleDeleteTeacher(t.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                 </div>
               ))}
             </div>
          </Card>
        </TabsContent>

        <TabsContent value="notice">
          <Card className="border-none shadow-sm bg-card rounded-3xl p-6 space-y-4">
            <Textarea value={noticeText} onChange={(e) => setNoticeText(e.target.value)} className="rounded-2xl min-h-[120px]" placeholder="공지 내용 입력..." />
            <Button onClick={handleUpdateConfig} className="w-full rounded-2xl h-11 bg-primary">공지 업데이트</Button>
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <Card className="border-none shadow-sm bg-card rounded-3xl p-6 space-y-4">
             <Label className="text-xs font-bold">시스템 데이터 정리</Label>
             <Button variant="destructive" onClick={handleCleanupOldData} disabled={isSaving} className="w-full h-12 rounded-2xl font-black">2일 이상 된 데이터 삭제</Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
