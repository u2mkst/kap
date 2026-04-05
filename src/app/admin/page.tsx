
"use client"

import { useState, useEffect } from "react"
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
import { 
  ShieldAlert, 
  Plus, 
  Trash2, 
  Users, 
  Loader2, 
  Megaphone, 
  BrainCircuit, 
  UserCog, 
  RefreshCcw, 
  Key, 
  ClipboardPaste,
  Star,
  Coins,
  MessageSquare
} from "lucide-react"
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from "@/firebase"
import { doc, setDoc, deleteDoc, serverTimestamp, query, orderBy, collection, addDoc, writeBatch, getDocs, updateDoc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"

export default function AdminPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState("all")
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({})

  const adminRef = useMemoFirebase(() => {
    if (!user?.uid) return null
    return doc(db, "roles_admin", user.uid)
  }, [user?.uid, db])

  const { data: isAdminDoc, isLoading: isAdminLoading } = useDoc(adminRef)
  const isActuallyAdmin = !!isAdminDoc && !isAdminLoading

  const configRef = useMemoFirebase(() => {
    if (!isActuallyAdmin || !user?.uid) return null
    return doc(db, "metadata", "config")
  }, [user?.uid, db, isActuallyAdmin])
  const { data: configData } = useDoc(configRef)

  const teachersQuery = useMemoFirebase(() => {
    if (!isActuallyAdmin || !user?.uid) return null
    return query(collection(db, "teachers"), orderBy("vote", "desc"))
  }, [db, user?.uid, isActuallyAdmin])
  const { data: teachers } = useCollection(teachersQuery)

  const usersQuery = useMemoFirebase(() => {
    if (!isActuallyAdmin || !user?.uid) return null
    return query(collection(db, "users"), orderBy("username", "asc"))
  }, [db, user?.uid, isActuallyAdmin])
  const { data: allUsers } = useCollection(usersQuery)

  const inquiriesQuery = useMemoFirebase(() => {
    if (!isActuallyAdmin || !user?.uid) return null
    return query(collection(db, "inquiries"), orderBy("createdAt", "desc"))
  }, [db, user?.uid, isActuallyAdmin])
  const { data: inquiries } = useCollection(inquiriesQuery)

  const adminsQuery = useMemoFirebase(() => {
    if (!isActuallyAdmin || !user?.uid) return null
    return collection(db, "roles_admin")
  }, [db, user?.uid, isActuallyAdmin])
  const { data: adminDocs } = useCollection(adminsQuery)

  const adminIds = adminDocs?.map(d => d.id) || []

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

  const handleResetVotes = async () => {
    if (!confirm("모든 투표수를 초기화하시겠습니까?")) return
    setIsSaving(true)
    try {
      const batch = writeBatch(db)
      const snapshot = await getDocs(collection(db, "teachers"))
      snapshot.forEach((doc) => batch.update(doc.ref, { vote: 0 }))
      await batch.commit()
      toast({ title: "초기화 완료" })
    } catch (e) {
      console.error(e)
    } finally {
      setIsSaving(false)
    }
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

  const handleUpdatePoints = (userId: string, points: number) => {
    updateDoc(doc(db, "users", userId), { points }).then(() => toast({ title: "포인트 수정 완료" }))
  }

  const handleSendReply = (inquiryId: string) => {
    const text = replyText[inquiryId]
    if (!text?.trim()) return
    setIsSaving(true)
    updateDoc(doc(db, "inquiries", inquiryId), {
      reply: text,
      status: "replied",
      updatedAt: serverTimestamp()
    }).then(() => {
      toast({ title: "답변 전송 완료" })
      setReplyText({ ...replyText, [inquiryId]: "" })
    }).finally(() => setIsSaving(false))
  }

  const handleDeleteInquiry = (id: string) => {
    if (!confirm("이 문의 내역을 영구 삭제하시겠습니까?")) return
    deleteDoc(doc(db, "inquiries", id)).then(() => toast({ title: "문의 삭제 완료" }))
  }

  const handleBulkProblems = async () => {
    if (!bulkProblemText.trim()) return
    setIsSaving(true)
    try {
      const batch = writeBatch(db)
      bulkProblemText.trim().split("\n").forEach(line => {
        const [date, grade, title, topic, diff, text, answer] = line.split("|")
        if (date && grade && title && text && answer) {
          const docId = `${date}_${grade}`
          batch.set(doc(db, "daily_problems", docId), {
            id: docId, date, grade, title, topic: topic || "일반",
            difficulty: diff || "보통", problemText: text, answer: answer.trim(),
            rewardPoints: 100, createdAt: serverTimestamp()
          })
        }
      })
      await batch.commit()
      toast({ title: "문제 등록 완료" })
      setBulkProblemText("")
    } catch (e) {
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  const handleBulkFortunes = async () => {
    if (!bulkFortuneText.trim()) return
    setIsSaving(true)
    try {
      const batch = writeBatch(db)
      bulkFortuneText.trim().split("\n").forEach(line => {
        const [date, text] = line.split("|")
        if (date && text) {
          batch.set(doc(db, "daily_fortunes", date), { id: date, date, fortuneText: text, createdAt: serverTimestamp() })
        }
      })
      await batch.commit()
      toast({ title: "일괄 등록 완료" })
      setBulkFortuneText("")
    } catch (e) {
      console.error(e)
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
    <div className="container mx-auto px-4 py-8 max-w-5xl animate-in fade-in duration-700">
      <div className="flex items-center gap-3 mb-8">
        <ShieldAlert className="h-8 w-8 text-destructive" />
        <h1 className="text-2xl font-bold font-headline">학원 관리 시스템</h1>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="grid w-full grid-cols-6 mb-6 bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="users" className="rounded-lg font-bold text-xs">학생</TabsTrigger>
          <TabsTrigger value="vote" className="rounded-lg font-bold text-xs">투표</TabsTrigger>
          <TabsTrigger value="inquiry" className="rounded-lg font-bold text-xs">문의</TabsTrigger>
          <TabsTrigger value="bulk" className="rounded-lg font-bold text-xs">등록</TabsTrigger>
          <TabsTrigger value="notice" className="rounded-lg font-bold text-xs">공지</TabsTrigger>
          <TabsTrigger value="config" className="rounded-lg font-bold text-xs">설정</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <CardTitle className="text-sm font-bold">학생 명단</CardTitle>
              <Select value={selectedTeacherFilter} onValueChange={setSelectedTeacherFilter}>
                <SelectTrigger className="w-40 h-8 text-xs rounded-full"><SelectValue placeholder="교사 필터" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {teachers?.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="space-y-2 p-4">
              {allUsers?.filter(u => selectedTeacherFilter === "all" || u.teacherId === selectedTeacherFilter).map((u) => (
                <div key={u.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-xl text-xs hover:bg-muted/30 transition-colors">
                  <div>
                    <span className="font-bold">{u.nickname}</span>
                    <span className="ml-2 opacity-60 font-medium">{u.schoolName} {u.grade}학년</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Coins className="h-3 w-3 text-primary" />
                      <Input 
                        type="number" 
                        className="w-20 h-7 text-[10px] rounded-lg" 
                        defaultValue={u.points} 
                        onBlur={(e) => handleUpdatePoints(u.id, parseInt(e.target.value))} 
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="opacity-60 font-bold">관리자</span>
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
              {(!allUsers || allUsers.length === 0) && (
                <p className="text-center py-10 text-xs text-muted-foreground italic">학생 데이터가 없습니다.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vote">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
              <CardHeader className="border-b pb-4"><CardTitle className="text-sm font-bold">후보 추가</CardTitle></CardHeader>
              <CardContent className="space-y-4 p-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold opacity-70">이름</Label>
                  <Input 
                    placeholder="선생님 이름" 
                    value={teacherName} 
                    onChange={(e) => setTeacherName(e.target.value)} 
                    className="rounded-xl h-10"
                  />
                </div>
                <Button onClick={handleAddTeacher} className="w-full font-bold h-10 rounded-xl">추가</Button>
                <Button variant="destructive" onClick={handleResetVotes} className="w-full font-bold h-10 rounded-xl">투표수 초기화</Button>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
              <CardHeader className="border-b pb-4"><CardTitle className="text-sm font-bold">현황</CardTitle></CardHeader>
              <CardContent className="space-y-2 p-4">
                {teachers?.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl text-xs">
                    <span className="font-bold">{t.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-primary font-black">{t.vote}P</span>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteTeacher(t.id)} className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-full"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inquiry">
          <div className="space-y-4">
            {inquiries?.map((iq) => (
              <Card key={iq.id} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                <CardContent className="p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <Badge variant={iq.status === "open" ? "destructive" : "outline"} className="text-[10px] font-bold rounded-full">{iq.status === "open" ? "미답변" : "답변완료"}</Badge>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] opacity-60 font-medium">{iq.userNickname} | {iq.createdAt?.toDate?.().toLocaleString() || "방금 전"}</span>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteInquiry(iq.id)} className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-full"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div className="text-xs">
                    <p className="font-bold mb-1 text-primary">Q: {iq.subject}</p>
                    <p className="opacity-80 whitespace-pre-wrap leading-relaxed font-medium">{iq.message}</p>
                  </div>
                  <div className="flex gap-2">
                    <Textarea className="min-h-[60px] text-xs bg-muted/20 rounded-xl" placeholder="답변 내용을 입력하세요..." defaultValue={iq.reply} onChange={(e) => setReplyText({ ...replyText, [iq.id]: e.target.value })} />
                    <Button size="sm" onClick={() => handleSendReply(iq.id)} className="font-bold rounded-xl px-4 h-auto">전송</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!inquiries || inquiries.length === 0) && (
              <p className="text-center py-20 text-xs text-muted-foreground italic bg-muted/20 rounded-2xl border border-dashed font-medium">
                처리할 문의 사항이 없습니다.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="bulk">
          <div className="grid gap-6">
            <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
              <CardHeader className="border-b pb-4"><CardTitle className="text-sm flex items-center gap-2 font-bold"><BrainCircuit className="h-4 w-4 text-primary" /> 문제 일괄 등록</CardTitle></CardHeader>
              <CardContent className="space-y-4 p-5">
                <Textarea placeholder="날짜|학년|제목|토픽|난이도|문제내용|정답" className="min-h-[100px] text-xs rounded-xl" value={bulkProblemText} onChange={(e) => setBulkProblemText(e.target.value)} />
                <Button onClick={handleBulkProblems} className="w-full font-bold h-11 rounded-xl">일괄 등록하기</Button>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
              <CardHeader className="border-b pb-4"><CardTitle className="text-sm flex items-center gap-2 font-bold"><Star className="h-4 w-4 text-yellow-500" /> 한마디 일괄 등록</CardTitle></CardHeader>
              <CardContent className="space-y-4 p-5">
                <Textarea placeholder="날짜|내용" className="min-h-[100px] text-xs rounded-xl" value={bulkFortuneText} onChange={(e) => setBulkFortuneText(e.target.value)} />
                <Button onClick={handleBulkFortunes} className="w-full font-bold h-11 rounded-xl">일괄 등록하기</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notice">
          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardHeader className="border-b pb-4"><CardTitle className="text-sm font-bold">실시간 공지</CardTitle></CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold opacity-70">공지 내용</Label>
                <Input placeholder="학원 전체 공지사항을 입력하세요" value={noticeText} onChange={(e) => setNoticeText(e.target.value)} className="rounded-xl h-11" />
              </div>
              <Button onClick={handleUpdateConfig} className="w-full font-bold h-11 rounded-xl">저장 및 게시</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardHeader className="border-b pb-4"><CardTitle className="text-sm font-bold">시스템 보안</CardTitle></CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold opacity-70">관리자 비밀 코드</Label>
                <Input type="password" value={adminSecretCode} onChange={(e) => setAdminSecretCode(e.target.value)} className="rounded-xl h-11" />
              </div>
              <Button onClick={handleUpdateConfig} className="w-full font-bold h-11 rounded-xl">설정 변경 저장</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
