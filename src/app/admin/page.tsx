
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
  ShieldCheck, 
  RefreshCcw, 
  Key, 
  ClipboardPaste,
  Star,
  Coins
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

  const adminRef = useMemoFirebase(() => {
    if (!user) return null
    return doc(db, "roles_admin", user.uid)
  }, [user, db])

  const { data: isAdminDoc, isLoading: isAdminLoading } = useDoc(adminRef)

  const configRef = useMemoFirebase(() => doc(db, "metadata", "config"), [db])
  const { data: configData } = useDoc(configRef)

  const teachersQuery = useMemoFirebase(() => {
    if (isAdminLoading || !isAdminDoc?.id) return null
    return query(collection(db, "teachers"), orderBy("vote", "desc"))
  }, [db, isAdminLoading, isAdminDoc?.id])
  const { data: teachers, isLoading: isTeachersLoading } = useCollection(teachersQuery)

  const usersQuery = useMemoFirebase(() => {
    if (isAdminLoading || !isAdminDoc?.id) return null
    return query(collection(db, "users"), orderBy("username", "asc"))
  }, [db, isAdminLoading, isAdminDoc?.id])
  const { data: allUsers, isLoading: isUsersLoading } = useCollection(usersQuery)

  const adminsQuery = useMemoFirebase(() => {
    if (isAdminLoading || !isAdminDoc?.id) return null
    return collection(db, "roles_admin")
  }, [db, isAdminLoading, isAdminDoc?.id])
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
      if (!user || !isAdminDoc) {
        router.push("/dashboard")
      }
    }
  }, [user, isAdminDoc, isUserLoading, isAdminLoading, isMounted, router])

  const handleAddTeacher = () => {
    if (!teacherName.trim()) return
    setIsSaving(true)
    const teacherData = { name: teacherName, vote: 0, createdAt: serverTimestamp() }
    addDoc(collection(db, "teachers"), teacherData)
      .then(() => {
        toast({ title: "선생님 등록 완료" })
        setTeacherName("")
      })
      .finally(() => setIsSaving(false))
  }

  const handleDeleteTeacher = (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return
    deleteDoc(doc(db, "teachers", id)).then(() => toast({ title: "삭제 완료" }))
  }

  const handleResetVotes = async () => {
    if (!confirm("모든 투표수를 0으로 초기화하시겠습니까?")) return
    setIsSaving(true)
    try {
      const batch = writeBatch(db)
      const snapshot = await getDocs(collection(db, "teachers"))
      snapshot.forEach((doc) => {
        batch.update(doc.ref, { vote: 0 })
      })
      await batch.commit()
      toast({ title: "투표수 초기화 완료" })
    } catch (e) {
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateConfig = () => {
    setIsSaving(true)
    const configDataUpdate = { notice: noticeText, adminSecret: adminSecretCode }
    setDoc(configRef, configDataUpdate, { merge: true })
      .then(() => toast({ title: "설정 업데이트 완료" }))
      .finally(() => setIsSaving(false))
  }

  const handleToggleAdmin = (userId: string, isCurrentlyAdmin: boolean) => {
    if (userId === user?.uid) return
    const targetAdminRef = doc(db, "roles_admin", userId)
    if (isCurrentlyAdmin) {
      deleteDoc(targetAdminRef).then(() => toast({ title: "권한 해제" }))
    } else {
      setDoc(targetAdminRef, { addedAt: serverTimestamp(), addedBy: user?.uid })
        .then(() => toast({ title: "권한 부여" }))
    }
  }

  const handleUpdatePoints = (userId: string, points: number) => {
    updateDoc(doc(db, "users", userId), { points }).then(() => toast({ title: "포인트 수정 완료" }))
  }

  const handleBulkProblems = async () => {
    if (!bulkProblemText.trim()) return
    setIsSaving(true)
    try {
      const batch = writeBatch(db)
      const lines = bulkProblemText.trim().split("\n")
      lines.forEach(line => {
        const [date, grade, title, topic, diff, text, answer] = line.split("|")
        if (date && grade && title && text && answer) {
          const docId = `${date}_${grade}`
          const ref = doc(db, "daily_problems", docId)
          batch.set(ref, {
            id: docId, date, grade, title, topic: topic || "일반",
            difficulty: diff || "보통", problemText: text, answer: answer.trim(),
            rewardPoints: 100, createdAt: serverTimestamp()
          })
        }
      })
      await batch.commit()
      toast({ title: "문제 일괄 등록 완료" })
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
      const lines = bulkFortuneText.trim().split("\n")
      lines.forEach(line => {
        const [date, text] = line.split("|")
        if (date && text) {
          const ref = doc(db, "daily_fortunes", date)
          batch.set(ref, { id: date, date, fortuneText: text, createdAt: serverTimestamp() })
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

  if (!isAdminDoc) return null

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-headline text-destructive">관리자 시스템</h1>
          <p className="text-muted-foreground text-sm">학원 운영 및 콘텐츠 통합 관리</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-8 bg-muted/50 p-1">
          <TabsTrigger value="users"><UserCog className="mr-2 h-4 w-4" /> 회원/보안</TabsTrigger>
          <TabsTrigger value="vote"><Users className="mr-2 h-4 w-4" /> 투표 관리</TabsTrigger>
          <TabsTrigger value="bulk"><ClipboardPaste className="mr-2 h-4 w-4" /> 일괄 등록</TabsTrigger>
          <TabsTrigger value="notice"><Megaphone className="mr-2 h-4 w-4" /> 공지 관리</TabsTrigger>
          <TabsTrigger value="config"><Key className="mr-2 h-4 w-4" /> 시스템 설정</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle>회원 명단 및 포인트 관리</CardTitle>
              <CardDescription>학생의 권한을 관리하거나 포인트를 직접 수정할 수 있습니다.</CardDescription>
            </CardHeader>
            <CardContent>
              {isUsersLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
              ) : (
                <div className="space-y-4">
                  {allUsers?.map((u) => {
                    const isUserAdmin = adminIds.includes(u.id);
                    return (
                      <div key={u.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-muted/20 rounded-xl border border-transparent hover:border-muted-foreground/10 transition-colors gap-4">
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <div className={isUserAdmin ? "p-2 bg-primary/10 rounded-full" : "p-2 bg-muted rounded-full"}>
                            <ShieldCheck className={isUserAdmin ? "h-5 w-5 text-primary" : "h-5 w-5 text-muted-foreground"} />
                          </div>
                          <div>
                            <p className="font-bold text-sm">{u.nickname} ({u.lastName}{u.firstName})</p>
                            <p className="text-[10px] text-muted-foreground">ID: {u.username} | {u.schoolName} {u.grade}학년</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Coins className="h-4 w-4 text-primary" />
                            <Input 
                              type="number" 
                              className="w-24 h-8 text-xs font-bold" 
                              defaultValue={u.points} 
                              onBlur={(e) => handleUpdatePoints(u.id, parseInt(e.target.value))}
                            />
                            <span className="text-xs font-bold">P</span>
                          </div>
                          <div className="flex items-center gap-2 border-l pl-4">
                            <span className="text-[10px] text-muted-foreground font-bold">Admin</span>
                            <Switch 
                              checked={isUserAdmin} 
                              onCheckedChange={() => handleToggleAdmin(u.id, isUserAdmin)}
                              disabled={u.id === user?.uid}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vote">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-none shadow-sm bg-white">
              <CardHeader>
                <CardTitle>후보 추가</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>선생님 성함</Label>
                  <Input placeholder="홍길동" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} />
                </div>
                <Button onClick={handleAddTeacher} disabled={isSaving} className="w-full">
                  <Plus className="mr-2 h-4 w-4" /> 후보 추가
                </Button>
                <div className="pt-4 border-t mt-4">
                  <Button variant="destructive" onClick={handleResetVotes} disabled={isSaving} className="w-full">
                    <RefreshCcw className="mr-2 h-4 w-4" /> 모든 투표수 초기화 (0P)
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white">
              <CardHeader>
                <CardTitle>투표 현황</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isTeachersLoading ? (
                  <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
                ) : (
                  teachers?.map((t, i) => (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center font-black">{i + 1}</Badge>
                        <span className="font-bold">{t.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-black text-primary">{t.vote} P</span>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTeacher(t.id)} className="text-destructive h-8 w-8">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bulk">
          <div className="grid gap-8">
            <Card className="border-none shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <BrainCircuit className="h-5 w-5" /> 오늘의 문제 일괄 등록
                </CardTitle>
                <CardDescription>형식: <b>날짜|학년|제목|토픽|난이도|문제내용|정답</b> (한 줄에 하나씩)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea 
                  placeholder="2024-05-20|1|수학 퀴즈|연산|쉬움|1+1은?|2"
                  className="min-h-[150px] font-mono text-xs"
                  value={bulkProblemText}
                  onChange={(e) => setBulkProblemText(e.target.value)}
                />
                <Button onClick={handleBulkProblems} disabled={isSaving} className="w-full">
                  등록하기
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <Star className="h-5 w-5" /> 오늘의 한마디(운세) 일괄 등록
                </CardTitle>
                <CardDescription>형식: <b>날짜|내용</b> (한 줄에 하나씩)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea 
                  placeholder="2024-05-20|오늘은 당신의 성장을 응원하는 특별한 날입니다!"
                  className="min-h-[120px] font-mono text-xs"
                  value={bulkFortuneText}
                  onChange={(e) => setBulkFortuneText(e.target.value)}
                />
                <Button onClick={handleBulkFortunes} disabled={isSaving} className="w-full bg-orange-600 hover:bg-orange-700">
                  등록하기
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notice">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle>라운지 실시간 공지</CardTitle>
              <CardDescription>투표 화면 상단에 노출됩니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input 
                placeholder="예: 이번 주 금요일 투표 마감!" 
                value={noticeText} 
                onChange={(e) => setNoticeText(e.target.value)}
              />
              <Button onClick={handleUpdateConfig} disabled={isSaving} className="w-full">업데이트</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle>시스템 보안 설정</CardTitle>
              <CardDescription>관리자 권한 획득을 위한 코드를 설정합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>관리자 비밀 코드 (Admin Secret)</Label>
                <div className="flex gap-2">
                  <Input 
                    type="password"
                    placeholder="비밀 코드를 입력하세요" 
                    value={adminSecretCode} 
                    onChange={(e) => setAdminSecretCode(e.target.value)}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">이 코드를 마이페이지에서 입력하면 관리자 권한을 즉시 획득할 수 있습니다.</p>
              </div>
              <Button onClick={handleUpdateConfig} disabled={isSaving} className="w-full bg-primary h-12">
                설정 저장
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
