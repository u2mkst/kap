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
  BookOpen,
  PlusCircle,
  CalendarPlus,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Sparkles,
  KeyRound,
  ShieldCheck
} from "lucide-react"
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { doc, setDoc, serverTimestamp, query, orderBy, collection, addDoc, limit, updateDoc, where } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { format, addDays } from "date-fns"
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
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))
  const [claimCode, setClaimSecret] = useState("")

  // 단일 문제 등록 상태
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

  // 단일 명언 등록 상태
  const [singleFortune, setSingleFortune] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    fortuneText: "",
    author: ""
  })

  // 관리자 권한 확인
  const adminRef = useMemoFirebase(() => {
    if (!user?.uid) return null
    return doc(db, "roles_admin", user.uid)
  }, [user?.uid, db])

  const { data: isAdminDoc, isLoading: isAdminLoading } = useDoc(adminRef)
  
  // 관리자 권한이 명확히 로드되고 존재할 때만 true
  const isActuallyAdmin = useMemo(() => {
    return !!user && !!isAdminDoc && !isAdminLoading;
  }, [user, isAdminDoc, isAdminLoading]);

  // 시스템 설정 데이터 (권한 상관없이 로드 - 공개 데이터 기반)
  const configRef = useMemoFirebase(() => {
    return doc(db, "metadata", "config")
  }, [db])
  const { data: configData } = useDoc(configRef)

  // 관리자 전용 데이터 쿼리 - isActuallyAdmin이 true일 때만 실행되도록 보호
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

  const quoteSuggestionsQuery = useMemoFirebase(() => {
    if (!isActuallyAdmin) return null
    return query(collection(db, "quote_suggestions"), where("status", "==", "pending"), orderBy("createdAt", "desc"))
  }, [db, isActuallyAdmin])
  const { data: quoteSuggestions } = useCollection(quoteSuggestionsQuery)

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
  const [kakaoApiKey, setKakaoApiKey] = useState("")
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

  const handleClaimAdmin = async () => {
    if (!user) return
    const secret = adminSecretCode || "ufes-admin-777"
    if (claimCode === secret) {
      setIsSaving(true)
      try {
        await setDoc(doc(db, "roles_admin", user.uid), {
          addedAt: serverTimestamp(),
          claimed: true
        })
        toast({ title: "관리자 권한 획득 성공!", description: "이제 모든 관리 기능을 사용할 수 있습니다." })
      } catch (e) {
        toast({ variant: "destructive", title: "권한 획득 실패", description: "잠시 후 다시 시도해 주세요." })
      } finally {
        setIsSaving(false)
      }
    } else {
      toast({ variant: "destructive", title: "인증 코드가 틀렸습니다." })
    }
  }

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

  const handleApproveQuote = async (suggestion: any) => {
    if (!confirm("이 명언을 정식 명언으로 승인하시겠습니까?")) return
    setIsSaving(true)
    try {
      const todayStr = format(new Date(), "yyyy-MM-dd")
      await setDoc(doc(db, "daily_fortunes", todayStr), {
        date: todayStr,
        fortuneText: suggestion.fortuneText,
        author: suggestion.author || suggestion.userNickname,
        updatedAt: serverTimestamp()
      })
      await updateDoc(doc(db, "quote_suggestions", suggestion.id), { status: "approved" })
      toast({ title: "명언 승인 및 등록 완료!", description: "오늘의 명언으로 반영되었습니다." })
    } catch (e) {
      toast({ variant: "destructive", title: "승인 실패" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleRejectQuote = (id: string) => {
    if (!confirm("이 추천을 거절하시겠습니까?")) return
    updateDocumentNonBlocking(doc(db, "quote_suggestions", id), { status: "rejected" })
    toast({ title: "추천 거절 완료" })
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

  const handleSingleProblemSave = async () => {
    const { date, grade, title, problemText, answer } = singleProblem
    if (!date || !grade || !title || !problemText || !answer) {
      toast({ variant: "destructive", title: "모든 칸을 채워주세요." })
      return
    }

    setIsSaving(true)
    const problemId = `${date}_${grade}`
    try {
      await setDoc(doc(db, "daily_problems", problemId), {
        ...singleProblem,
        id: problemId,
        rewardPoints: Number(singleProblem.rewardPoints),
        updatedAt: serverTimestamp()
      })
      toast({ title: "문제 등록 완료!" })
      setSingleProblem({ ...singleProblem, title: "", problemText: "", answer: "" })
    } catch (e) {
      toast({ variant: "destructive", title: "등록 실패" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSingleFortuneSave = async () => {
    const { date, fortuneText, author } = singleFortune
    if (!date || !fortuneText) {
      toast({ variant: "destructive", title: "날짜와 명언 내용을 입력해주세요." })
      return
    }

    setIsSaving(true)
    try {
      await setDoc(doc(db, "daily_fortunes", date), {
        date,
        fortuneText,
        author: author || "알 수 없음",
        updatedAt: serverTimestamp()
      })
      toast({ title: "명언 등록 완료!" })
      setSingleFortune({ ...singleFortune, fortuneText: "", author: "" })
    } catch (e) {
      toast({ variant: "destructive", title: "등록 실패" })
    } finally {
      setIsSaving(false)
    }
  }

  const setNextDayForProblem = () => {
    if (!allProblems || allProblems.length === 0) return;
    const sortedDates = [...allProblems].map(p => p.date).sort();
    const lastDateStr = sortedDates[sortedDates.length - 1];
    const nextDate = addDays(new Date(lastDateStr), 1);
    setSingleProblem({ ...singleProblem, date: format(nextDate, "yyyy-MM-dd") });
    toast({ title: "날짜가 다음 날로 설정되었습니다.", description: `대상 날짜: ${format(nextDate, "yyyy-MM-dd")}` });
  }

  const setNextDayForFortune = () => {
    if (!allFortunes || allFortunes.length === 0) return;
    const sortedDates = [...allFortunes].map(f => f.date).sort();
    const lastDateStr = sortedDates[sortedDates.length - 1];
    const nextDate = addDays(new Date(lastDateStr), 1);
    setSingleFortune({ ...singleFortune, date: format(nextDate, "yyyy-MM-dd") });
    toast({ title: "날짜가 다음 날로 설정되었습니다.", description: `대상 날짜: ${format(nextDate, "yyyy-MM-dd")}` });
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

  const getDayData = (day: Date) => {
    const dStr = format(day, "yyyy-MM-dd")
    const hasProblem = allProblems?.some(p => p.date === dStr)
    const hasFortune = allFortunes?.some(f => f.date === dStr)
    return { hasProblem, hasFortune }
  }

  if (isUserLoading || isAdminLoading || !isMounted) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="flex flex-col items-center gap-8 relative z-10">
          <div className="relative group">
            <div className="absolute -inset-4 bg-primary/20 rounded-[2.5rem] blur-xl group-hover:bg-primary/30 transition-all duration-500 animate-pulse" />
            <div className="relative h-24 w-24 rounded-[2rem] bg-card border border-primary/10 flex items-center justify-center shadow-2xl animate-float animate-glow">
              <BookOpen className="h-12 w-12 text-primary animate-pulse-gentle" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent animate-shimmer-text">
              Admin Accessing...
            </h2>
            <div className="flex gap-1.5">
              <div className="h-2 w-2 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.3s]" />
              <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
              <div className="h-2 w-2 rounded-full bg-primary animate-bounce" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 관리자 권한이 없을 경우 인증 화면 표시
  if (!isActuallyAdmin) {
    return (
      <div className="container mx-auto px-4 h-[calc(100vh-120px)] flex items-center justify-center">
        <Card className="w-full max-w-md border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-primary/10 p-8 text-center border-b border-primary/10">
            <div className="mx-auto mb-4 h-16 w-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
              <KeyRound className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-black text-primary">관리자 인증</CardTitle>
            <CardDescription className="text-xs font-bold text-primary/60">
              이 페이지는 관리자 전용입니다. <br/>관리자 인증 코드를 입력해 주세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-black text-muted-foreground ml-1">인증 코드 (Secret Code)</Label>
              <Input 
                type="password" 
                placeholder="코드를 입력하세요" 
                value={claimCode} 
                onChange={(e) => setClaimSecret(e.target.value)}
                className="h-12 rounded-2xl bg-muted/30 border-none focus-visible:ring-primary font-mono text-center tracking-widest"
              />
            </div>
            <Button 
              onClick={handleClaimAdmin} 
              disabled={isSaving || !claimCode.trim()} 
              className="w-full h-12 rounded-2xl font-black bg-primary text-white shadow-md hover:bg-primary/90 transition-all active:scale-95"
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ShieldCheck className="h-5 w-5 mr-2" /> 관리자 권한 획득</>}
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => router.push("/dashboard")} 
              className="w-full rounded-2xl h-10 text-xs font-bold text-muted-foreground"
            >
              대시보드로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const problemExample = `2024-03-25|1|다항식의 덧셈|수학|중|x^2 + 2x + 1 을 x+1로 나누면?|x+1|150\n2024-03-25|2|삼각함수 기초|수학|상|sin(pi/2)의 값은?|1|200`
  const fortuneExample = `2024-03-25|천재는 1%의 영감과 99%의 노력으로 이루어진다|토마스 에디슨\n2024-03-26|실패는 성공의 어머니이다|토마스 에디슨`

  const copyExample = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "예시가 복사되었습니다." })
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-8">
        <ShieldAlert className="h-8 w-8 text-destructive" />
        <h1 className="text-2xl font-black font-headline tracking-tight text-primary">KST HUB 관리 시스템</h1>
      </div>

      <Tabs defaultValue="inquiry">
        <TabsList className="grid w-full grid-cols-8 mb-6 bg-muted/50 p-1 rounded-2xl overflow-hidden">
          <TabsTrigger value="inquiry" className="rounded-xl font-bold text-xs"><MessageSquare className="h-3 w-3 mr-1" /> 문의</TabsTrigger>
          <TabsTrigger value="quote_requests" className="rounded-xl font-bold text-xs"><Sparkles className="h-3 w-3 mr-1" /> 추천</TabsTrigger>
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

        <TabsContent value="quote_requests">
          <div className="space-y-4">
            <h2 className="text-sm font-black flex items-center gap-2 mb-4"><Sparkles className="h-4 w-4 text-accent" /> 학생들이 추천한 명언 목록</h2>
            {quoteSuggestions?.map((s) => (
              <Card key={s.id} className="border-none shadow-sm bg-card rounded-3xl overflow-hidden">
                <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="space-y-2 flex-grow">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] font-black rounded-full">추천: {s.userNickname} 학생</Badge>
                      <span className="text-[10px] text-muted-foreground">{s.createdAt?.toDate?.().toLocaleString()}</span>
                    </div>
                    <p className="text-sm font-black text-primary leading-relaxed italic">"{s.fortuneText}"</p>
                    <p className="text-xs font-bold text-muted-foreground">- {s.author}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button 
                      size="sm" 
                      onClick={() => handleApproveQuote(s)} 
                      disabled={isSaving}
                      className="bg-accent text-accent-foreground rounded-xl font-black text-xs"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" /> 승인
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRejectQuote(s.id)}
                      className="text-destructive hover:bg-destructive/10 rounded-xl font-black text-xs"
                    >
                      <XCircle className="h-3 w-3 mr-1" /> 거절
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!quoteSuggestions || quoteSuggestions.length === 0) && (
              <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-muted-foreground/20">
                <p className="text-xs text-muted-foreground font-bold italic">대기 중인 명언 추천이 없습니다.</p>
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
                  <CardHeader className="border-b pb-4">
                    <CardTitle className="text-sm font-black flex items-center gap-2">
                      <PlusCircle className="h-4 w-4 text-primary" /> 오늘의 문제 직접 등록
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold">대상 날짜</Label>
                        <div className="flex gap-1">
                          <Input 
                            type="date" 
                            value={singleProblem.date} 
                            onChange={(e) => setSingleProblem({...singleProblem, date: e.target.value})} 
                            className="rounded-xl h-9 text-xs"
                          />
                          <Button variant="outline" size="icon" onClick={setNextDayForProblem} className="h-9 w-9 shrink-0 rounded-xl" title="마지막 등록일 다음 날로 설정">
                            <CalendarPlus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold">대상 학년</Label>
                        <Select value={singleProblem.grade} onValueChange={(v) => setSingleProblem({...singleProblem, grade: v})}>
                          <SelectTrigger className="h-9 text-xs rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1학년</SelectItem>
                            <SelectItem value="2">2학년</SelectItem>
                            <SelectItem value="3">3학년</SelectItem>
                            <SelectItem value="4">4학년</SelectItem>
                            <SelectItem value="5">5학년</SelectItem>
                            <SelectItem value="6">6학년</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold">문제 제목</Label>
                      <Input 
                        placeholder="예: 다항식의 연산 기초" 
                        value={singleProblem.title} 
                        onChange={(e) => setSingleProblem({...singleProblem, title: e.target.value})} 
                        className="rounded-xl h-9 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold">토픽</Label>
                        <Input value={singleProblem.topic} onChange={(e) => setSingleProblem({...singleProblem, topic: e.target.value})} className="rounded-xl h-9 text-xs" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold">난이도</Label>
                        <Select value={singleProblem.difficulty} onValueChange={(v) => setSingleProblem({...singleProblem, difficulty: v})}>
                          <SelectTrigger className="h-9 text-xs rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="하">하</SelectItem>
                            <SelectItem value="중">중</SelectItem>
                            <SelectItem value="상">상</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold">보상 포인트</Label>
                        <Input type="number" value={singleProblem.rewardPoints} onChange={(e) => setSingleProblem({...singleProblem, rewardPoints: parseInt(e.target.value)})} className="rounded-xl h-9 text-xs" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold">문제 내용</Label>
                      <Textarea 
                        placeholder="문제 본문을 입력하세요..." 
                        value={singleProblem.problemText} 
                        onChange={(e) => setSingleProblem({...singleProblem, problemText: e.target.value})} 
                        className="rounded-xl min-h-[80px] text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold">정답</Label>
                      <Input 
                        placeholder="정답 입력" 
                        value={singleProblem.answer} 
                        onChange={(e) => setSingleProblem({...singleProblem, answer: e.target.value})} 
                        className="rounded-xl h-9 text-xs"
                      />
                    </div>
                    <Button onClick={handleSingleProblemSave} disabled={isSaving} className="w-full rounded-2xl h-11 font-black bg-primary text-white">
                      문제 등록하기
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden">
                  <CardHeader className="border-b pb-4">
                    <CardTitle className="text-sm font-black flex items-center gap-2">
                      <Quote className="h-4 w-4 text-accent" /> 오늘의 명언 직접 등록
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold">대상 날짜</Label>
                      <div className="flex gap-1">
                        <Input 
                          type="date" 
                          value={singleFortune.date} 
                          onChange={(e) => setSingleFortune({...singleFortune, date: e.target.value})} 
                          className="rounded-xl h-9 text-xs"
                        />
                        <Button variant="outline" size="icon" onClick={setNextDayForFortune} className="h-9 w-9 shrink-0 rounded-xl" title="마지막 등록일 다음 날로 설정">
                          <CalendarPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold">명언 내용</Label>
                      <Textarea 
                        placeholder="오늘의 명언 내용을 입력하세요..." 
                        value={singleFortune.fortuneText} 
                        onChange={(e) => setSingleFortune({...singleFortune, fortuneText: e.target.value})} 
                        className="rounded-xl min-h-[80px] text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold">작성자 (선택사항)</Label>
                      <Input 
                        placeholder="예: 알버트 아인슈타인" 
                        value={singleFortune.author} 
                        onChange={(e) => setSingleFortune({...singleFortune, author: e.target.value})} 
                        className="rounded-xl h-9 text-xs"
                      />
                    </div>
                    <Button onClick={handleSingleFortuneSave} disabled={isSaving} className="w-full rounded-2xl h-11 font-black bg-accent text-white">
                      명언 등록하기
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden">
                  <CardHeader className="border-b pb-4"><CardTitle className="text-sm font-black">데이터 일괄 등록 (Bulk)</CardTitle></CardHeader>
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
                    <CardDescription className="text-[10px]">날짜 클릭 시 해당 날짜의 등록 정보를 확인합니다.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <div className="bg-card rounded-3xl border flex justify-center overflow-hidden w-full max-w-[320px]">
                      <Calendar
                        onDateClick={(d) => {
                          const dStr = format(d, "yyyy-MM-dd")
                          setSelectedDate(dStr)
                        }}
                        renderDay={(date) => {
                          const { hasProblem, hasFortune } = getDayData(date)
                          return (
                            <div className="flex gap-0.5 justify-center mt-1">
                              {hasProblem && <div className="h-1 w-1 rounded-full bg-primary" />}
                              {hasFortune && <div className="h-1 w-1 rounded-full bg-[#67C4DA]" />}
                            </div>
                          )
                        }}
                      />
                    </div>
                    <div className="flex gap-4 mt-4 text-[10px] font-bold">
                      <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-primary" /> 문제 등록됨</div>
                      <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-[#67C4DA]" /> 명언 등록됨</div>
                    </div>
                  </CardContent>
                </Card>

                {/* 선택한 날짜의 데이터 상세 뷰 */}
                <Card className="border-none shadow-md bg-card rounded-3xl overflow-hidden animate-in fade-in zoom-in duration-300">
                  <CardHeader className="bg-muted/30 pb-3">
                    <CardTitle className="text-sm font-black flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-primary" /> {selectedDate} 현황
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black opacity-50 uppercase tracking-widest">등록된 문제 ({problemsOnSelectedDate.length})</Label>
                      {problemsOnSelectedDate.length > 0 ? (
                        <div className="grid gap-2">
                          {problemsOnSelectedDate.map(p => (
                            <div key={p.id} className="p-3 bg-muted/20 rounded-xl border border-border/50">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-[9px] h-4">{p.grade}학년</Badge>
                                <span className="text-[11px] font-black truncate">{p.title}</span>
                              </div>
                              <p className="text-[10px] opacity-70 line-clamp-1">{p.problemText}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] font-bold opacity-30 italic py-2 text-center">등록된 문제가 없습니다.</p>
                      )}
                    </div>

                    <div className="space-y-2 pt-2 border-t">
                      <Label className="text-[10px] font-black opacity-50 uppercase tracking-widest">등록된 명언</Label>
                      {fortuneOnSelectedDate ? (
                        <div className="p-3 bg-accent/5 rounded-xl border border-accent/20">
                          <p className="text-[11px] font-bold italic leading-relaxed">"{fortuneOnSelectedDate.fortuneText}"</p>
                          <p className="text-[9px] font-black text-accent mt-1 text-right">- {fortuneOnSelectedDate.author}</p>
                        </div>
                      ) : (
                        <p className="text-[10px] font-bold opacity-30 italic py-2 text-center">등록된 명언이 없습니다.</p>
                      )}
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
                  <input placeholder="선생님 성함" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} className="rounded-2xl bg-background border px-4 h-10 w-full" />
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
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-sm font-black">실시간 공지 사항</CardTitle>
              <CardDescription className="text-xs">여기에 작성한 내용은 대시보드 진입 시 팝업으로 나타납니다.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Textarea 
                value={noticeText} 
                onChange={(e) => setNoticeText(e.target.value)} 
                className="rounded-2xl min-h-[120px] bg-background" 
                placeholder="학생들에게 보여줄 공지 내용을 입력하세요..." 
              />
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