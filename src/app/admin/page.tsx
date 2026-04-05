
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
  Star,
  MessageSquare,
  Save
} from "lucide-react"
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from "@/firebase"
import { doc, setDoc, deleteDoc, serverTimestamp, query, orderBy, collection, addDoc, writeBatch, getDocs, updateDoc, limit } from "firebase/firestore"
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
    return query(collection(db, "inquiries"), orderBy("createdAt", "desc"), limit(50))
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
  const [bulkProblemText, setBulkProblemText] = useState("")
  const [bulkFortuneText, setBulkFortuneText] = useState("")

  useEffect(() => {
    setIsMounted(true)
    if (configData) {
      setNoticeText(configData.notice || "")
      setAdminSecretCode(configData.adminSecret || "ufes-admin-777")
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
    addDoc(collection(db, "teachers"), { name: teacherName, vote: 0, createdAt: serverTimestamp() })
      .then(() => {
        toast({ title: "교사 등록 완료" })
        setTeacherName("")
      })
      .finally(() => setIsSaving(false))
  }

  const handleDeleteTeacher = (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return
    deleteDoc(doc(db, "teachers", id)).then(() => toast({ title: "삭제 완료" }))
  }

  const handleUpdateConfig = () => {
    if (!configRef) return
    setIsSaving(true)
    setDoc(configRef, { notice: noticeText, adminSecret: adminSecretCode }, { merge: true })
      .then(() => toast({ title: "저장 완료" }))
      .finally(() => setIsSaving(false))
  }

  const handleToggleAdmin = (userId: string, isCurrentlyAdmin: boolean) => {
    if (userId === user?.uid) return
    const targetAdminRef = doc(db, "roles_admin", userId)
    if (isCurrentlyAdmin) {
      deleteDoc(targetAdminRef).then(() => toast({ title: "권한 해제" }))
    } else {
      setDoc(targetAdminRef, { addedAt: serverTimestamp() }).then(() => toast({ title: "권한 부여" }))
    }
  }

  const handleSendReply = (inquiryId: string) => {
    const text = replyText[inquiryId]
    if (!text?.trim()) return
    setIsSaving(true)
    updateDoc(doc(db, "inquiries", inquiryId), {
      reply: text.trim(),
      status: "replied",
      updatedAt: serverTimestamp()
    }).then(() => {
      toast({ title: "답변이 전송되었습니다." })
      setReplyText({ ...replyText, [inquiryId]: "" })
    }).finally(() => setIsSaving(false))
  }

  const handleDeleteInquiry = (id: string) => {
    if (!confirm("이 문의를 영구 삭제하시겠습니까?")) return
    deleteDoc(doc(db, "inquiries", id)).then(() => toast({ title: "문의가 삭제되었습니다." }))
  }

  const handleUpdatePoints = (userId: string) => {
    const newPoints = tempPoints[userId]
    if (newPoints === undefined || isNaN(newPoints)) return
    
    setIsSaving(true)
    updateDoc(doc(db, "users", userId), {
      points: newPoints,
      updatedAt: serverTimestamp()
    }).then(() => {
      toast({ title: "포인트 수정 완료", description: `포인트가 ${newPoints}P로 변경되었습니다.` })
    }).finally(() => setIsSaving(false))
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
          <div className="space-y-4">
            {inquiries?.map((iq) => (
              <Card key={iq.id} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
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
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteInquiry(iq.id)} className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-full"><Trash2 className="h-4 w-4" /></Button>
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
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
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
                <div key={u.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-muted/20 rounded-2xl text-[11px] hover:bg-muted/30 transition-all gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-sm">{u.nickname}</span>
                    <span className="opacity-60 font-bold">{u.schoolName} {u.grade}학년</span>
                    <span className="text-[9px] opacity-40 font-mono">({u.username})</span>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center gap-2 bg-white/50 p-1.5 rounded-xl border border-primary/10 shadow-sm">
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
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
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
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
             <CardHeader className="border-b pb-4"><CardTitle className="text-sm font-black">데이터 일괄 등록</CardTitle></CardHeader>
             <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground ml-1">일일 문제 등록</Label>
                  <Textarea placeholder="날짜|학년|제목|토픽|난이도|문제내용|정답" value={bulkProblemText} onChange={(e) => setBulkProblemText(e.target.value)} className="rounded-2xl min-h-[100px]" />
                  <Button onClick={handleUpdateConfig} className="w-full rounded-2xl font-black h-11">문제 일괄 등록</Button>
                </div>
                <div className="space-y-2 pt-4 border-t">
                  <Label className="text-xs font-bold text-muted-foreground ml-1">오늘의 한마디 등록</Label>
                  <Textarea placeholder="날짜|내용" value={bulkFortuneText} onChange={(e) => setBulkFortuneText(e.target.value)} className="rounded-2xl min-h-[100px]" />
                  <Button onClick={handleUpdateConfig} className="w-full rounded-2xl font-black h-11">한마디 일괄 등록</Button>
                </div>
             </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notice">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
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
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="border-b pb-4"><CardTitle className="text-sm font-black">시스템 보안 설정</CardTitle></CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground ml-1">관리자 인증 코드</Label>
                <Input type="password" value={adminSecretCode} onChange={(e) => setAdminSecretCode(e.target.value)} className="rounded-2xl h-11" />
              </div>
              <Button onClick={handleUpdateConfig} className="w-full rounded-2xl font-black h-11 bg-destructive text-white">보안 설정 저장</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
