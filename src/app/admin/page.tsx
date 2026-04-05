"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { 
  ShieldAlert, 
  Trash2, 
  Loader2, 
  BrainCircuit, 
  Coins,
  Save,
  FileText,
  Quote,
  MessageSquare,
  Key,
  Eraser
} from "lucide-react"
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { doc, setDoc, serverTimestamp, query, orderBy, collection, addDoc, limit } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"

export default function AdminPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState("all")
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({})
  const [tempPoints, setTempPoints] = useState<{ [key: string]: number }>({})

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

  const adminIds = useMemo(() => adminDocs?.map(d => d.id) || [], [adminDocs])

  const [teacherName, setTeacherName] = useState("")
  const [noticeText, setNoticeText] = useState("")
  const [adminSecretCode, setAdminSecretCode] = useState("")
  const [kakaoApiKey, setKakaoApiKey] = useState("")
  const [bulkProblemText, setBulkProblemText] = useState("")
  const [bulkFortuneText, setBulkFortuneText] = useState("")

  useEffect(() => {
    setIsMounted(true)
    if (configData) {
      setNoticeText(configData.notice || "")
      setAdminSecretCode(configData.adminSecret || "ufes-admin-777")
      setKakaoApiKey(configData.kakaoApiKey || "")
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

  const handleUpdateConfig = () => {
    if (!configRef) return
    setIsSaving(true)
    setDoc(configRef, { 
      notice: noticeText, 
      adminSecret: adminSecretCode,
      kakaoApiKey: kakaoApiKey 
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
    const targetRef = doc(db, "inquiries", id)
    deleteDocumentNonBlocking(targetRef)
    toast({ title: "문의가 삭제되었습니다." })
  }

  const handleDeleteAllInquiries = () => {
    if (!inquiries || inquiries.length === 0) return
    if (!confirm(`정말 ${inquiries.length}개의 모든 문의를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return
    
    inquiries.forEach(iq => {
      if (iq.id) {
        const targetRef = doc(db, "inquiries", iq.id)
        deleteDocumentNonBlocking(targetRef)
      }
    })
    toast({ title: "전체 삭제 완료" })
  }

  const handleUpdatePoints = (userId: string) => {
    const newPoints = tempPoints[userId]
    if (newPoints === undefined || isNaN(newPoints)) return
    
    setIsSaving(true)
    updateDocumentNonBlocking(doc(db, "users", userId), {
      points: newPoints,
      updatedAt: serverTimestamp()
    })
    toast({ title: "포인트 수정 완료", description: `포인트가 ${newPoints}P로 변경되었습니다.` })
    setIsSaving(false)
  }

  const handleBulkProblems = async () => {
    if (!bulkProblemText.trim()) return
    setIsSaving(true)
    const lines = bulkProblemText.trim().split("\n")
    let count = 0
    try {
      for (const line of lines) {
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
      console.error(e)
      toast({ variant: "destructive", title: "등록 실패", description: "데이터 형식을 확인해주세요." })
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
        const [date, fortuneText] = line.split("|")
        if (date && fortuneText) {
          await setDoc(doc(db, "daily_fortunes", date), {
            date,
            fortuneText,
            updatedAt: serverTimestamp()
          })
          count++
        }
      }
      toast({ title: "한마디 일괄 등록 완료", description: `${count}개의 한마디가 등록되었습니다.` })
      setBulkFortuneText("")
    } catch (e) {
      console.error(e)
      toast({ variant: "destructive", title: "등록 실패", description: "데이터 형식을 확인해주세요." })
    } finally {
      setIsSaving(false)
    }
  }

  if (isUserLoading || isAdminLoading || !isMounted) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isActuallyAdmin) return null

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-8">
        <ShieldAlert className="h-8 w-8 text-destructive" />
        <h1 className="text-2xl font-black font-headline tracking-tight text-primary">KST HUB 관리 시스템</h1>
      </div>

      <Tabs defaultValue="inquiry">
        <TabsList className="grid w-full grid-cols-6 mb-6 bg-muted/50 p-1 rounded-2xl overflow-hidden">
          <TabsTrigger value="inquiry" className="rounded-xl font-bold text-xs"><MessageSquare className="h-3 w-3 mr-1" /> 문의</TabsTrigger>
          <TabsTrigger value="users" className="rounded-xl font-bold text-xs">학생</TabsTrigger>
          <TabsTrigger value="vote" className="rounded-xl font-bold text-xs">투표</TabsTrigger>
          <TabsTrigger value="bulk" className="rounded-xl font-bold text-xs">등록</TabsTrigger>
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
                      onClick={() => handleSendReply(iq.id)} 
                      disabled={isSaving}
                      className="font-black rounded-2xl px-5 h-[80px] bg-primary hover:bg-primary/90"
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
                <SelectTrigger className="w-40 h-8 text-[10px] rounded-full"><SelectValue placeholder="교사 필터" /></SelectTrigger>
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
                    <span className="text-[9px] opacity-40 font-mono">({u.username})</span>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center gap-2 bg-background/50 p-1.5 rounded-xl border border-primary/10 shadow-sm">
                      <Coins className="h-3 w-3 text-primary" />
                      <Input 
                        type="number" 
                        defaultValue={u.points} 
                        onChange={(e) => setTempPoints({ ...tempPoints, [u.id]: parseInt(e.target.value) })}
                        className="w-20 h-7 text-[10px] border-none bg-transparent font-black text-primary p-0 text-right focus-visible:ring-0" 
                      />
                      <span className="text-[10px] font-black text-primary pr-1">P</span>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6 rounded-lg text-primary hover:bg-primary/10"
                        onClick={() => handleUpdatePoints(u.id)}
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

        <TabsContent value="vote">
          <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden">
             <CardHeader className="border-b pb-4"><CardTitle className="text-sm font-black">선생님 투표 관리</CardTitle></CardHeader>
             <CardContent className="p-6 space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="선생님 성함" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} className="rounded-2xl" />
                  <Button onClick={handleAddTeacher} className="rounded-2xl font-black bg-primary">추가</Button>
                </div>
                <div className="grid gap-2">
                  {teachers?.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl">
                      <span className="font-black text-sm">{t.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="font-black text-primary">{t.vote}표</span>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTeacher(t.id)} className="h-8 w-8 text-destructive rounded-full hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
             </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden">
             <CardHeader className="border-b pb-4"><CardTitle className="text-sm font-black">데이터 일괄 등록</CardTitle></CardHeader>
             <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <BrainCircuit className="h-4 w-4 text-primary" />
                    <Label className="text-xs font-bold text-muted-foreground">일일 문제 일괄 등록</Label>
                  </div>
                  <Textarea 
                    placeholder={`예시:\n2024-05-20|1|기초 연산|수학|하|1+1은 무엇일까요?|2|100\n2024-05-21|2|분수 문제|수학|중|1/2 + 1/2는?|1|200`} 
                    value={bulkProblemText} 
                    onChange={(e) => setBulkProblemText(e.target.value)} 
                    className="rounded-2xl min-h-[150px] text-[11px] font-mono leading-relaxed" 
                  />
                  <p className="text-[10px] text-muted-foreground ml-1">형식: 날짜|학년|제목|토픽|난이도|문제내용|정답|지급포인트</p>
                  <Button onClick={handleBulkProblems} disabled={isSaving || !bulkProblemText.trim()} className="w-full rounded-2xl font-black h-11">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                    문제 일괄 등록 실행
                  </Button>
                </div>
                
                <div className="space-y-2 pt-6 border-t">
                  <div className="flex items-center gap-2 mb-1">
                    <Quote className="h-4 w-4 text-accent" />
                    <Label className="text-xs font-bold text-muted-foreground">오늘의 한마디 일괄 등록</Label>
                  </div>
                  <Textarea 
                    placeholder={`예시:\n2024-05-20|오늘은 당신의 꿈을 향해 한 걸음 더 나아가세요!\n2024-05-21|작은 성취들이 모여 큰 기적을 만듭니다.`} 
                    value={bulkFortuneText} 
                    onChange={(e) => setBulkFortuneText(e.target.value)} 
                    className="rounded-2xl min-h-[120px] text-[11px] font-mono leading-relaxed" 
                  />
                  <p className="text-[10px] text-muted-foreground ml-1">형식: 날짜|한마디내용</p>
                  <Button onClick={handleBulkFortunes} disabled={isSaving || !bulkFortuneText.trim()} className="w-full rounded-2xl font-black h-11 bg-accent text-accent-foreground">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Quote className="h-4 w-4 mr-2" />}
                    한마디 일괄 등록 실행
                  </Button>
                </div>
             </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notice">
          <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden">
            <CardHeader className="border-b pb-4"><CardTitle className="text-sm font-black">실시간 공지 사항</CardTitle></CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground ml-1">공지 내용</Label>
                <Input value={noticeText} onChange={(e) => setNoticeText(e.target.value)} className="rounded-2xl h-11" placeholder="학원 전체에 노출되는 공지입니다." />
              </div>
              <Button onClick={handleUpdateConfig} className="w-full rounded-2xl font-black h-11 bg-primary text-white">공지 업데이트</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden">
            <CardHeader className="border-b pb-4"><CardTitle className="text-sm font-black">시스템 보안 및 API 설정</CardTitle></CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground ml-1 flex items-center gap-2">
                  <ShieldAlert className="h-3 w-3" /> 관리자 인증 코드
                </Label>
                <Input type="password" value={adminSecretCode} onChange={(e) => setAdminSecretCode(e.target.value)} className="rounded-2xl h-11" />
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Label className="text-xs font-bold text-muted-foreground ml-1 flex items-center gap-2">
                  <Key className="h-3 w-3" /> 카카오 JavaScript 키 (공유용)
                </Label>
                <Input 
                  type="text" 
                  value={kakaoApiKey} 
                  onChange={(e) => setKakaoApiKey(e.target.value)} 
                  className="rounded-2xl h-11" 
                  placeholder="카카오 개발자 콘솔에서 발급받은 키를 입력하세요."
                />
              </div>

              <Button onClick={handleUpdateConfig} className="w-full rounded-2xl font-black h-11 bg-destructive text-white">전체 설정 저장</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
