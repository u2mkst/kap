
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
import { ShieldAlert, Star, Plus, Trash2, Users, Loader2, Megaphone, BrainCircuit, UserCog, ShieldCheck } from "lucide-react"
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from "@/firebase"
import { doc, setDoc, deleteDoc, serverTimestamp, query, orderBy, collection, addDoc } from "firebase/firestore"
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

  // 전체 선생님 목록
  const teachersQuery = useMemoFirebase(() => {
    if (isAdminLoading || !isAdminDoc?.id) return null
    return query(collection(db, "teachers"), orderBy("vote", "desc"))
  }, [db, isAdminLoading, isAdminDoc?.id])
  const { data: teachers, isLoading: isTeachersLoading } = useCollection(teachersQuery)

  // 전체 사용자 목록 (관리자만 가능)
  const usersQuery = useMemoFirebase(() => {
    if (isAdminLoading || !isAdminDoc?.id) return null
    return query(collection(db, "users"), orderBy("username", "asc"))
  }, [db, isAdminLoading, isAdminDoc?.id])
  const { data: allUsers, isLoading: isUsersLoading } = useCollection(usersQuery)

  // 전체 관리자 ID 목록
  const adminsQuery = useMemoFirebase(() => {
    if (isAdminLoading || !isAdminDoc?.id) return null
    return collection(db, "roles_admin")
  }, [db, isAdminLoading, isAdminDoc?.id])
  const { data: adminDocs } = useCollection(adminsQuery)

  const adminIds = adminDocs?.map(d => d.id) || []

  const [teacherName, setTeacherName] = useState("")
  const [noticeText, setNoticeText] = useState("")
  const [fortuneDate, setFortuneDate] = useState("")
  const [fortuneText, setFortuneText] = useState("")

  // 오늘의 문제 상태
  const [probDate, setProbDate] = useState("")
  const [probGrade, setProbGrade] = useState("1")
  const [probTitle, setProbTitle] = useState("")
  const [probTopic, setProbTopic] = useState("")
  const [probDiff, setProbDiff] = useState("보통")
  const [probText, setProbText] = useState("")
  const [probAnswer, setProbAnswer] = useState("")

  useEffect(() => {
    setIsMounted(true)
    const today = new Date().toISOString().split('T')[0]
    setFortuneDate(today)
    setProbDate(today)
  }, [])

  useEffect(() => {
    if (!isUserLoading && !isAdminLoading && isMounted) {
      if (!user || !isAdminDoc) {
        router.push("/dashboard")
      }
    }
  }, [user, isAdminDoc, isUserLoading, isAdminLoading, isMounted, router])

  const handleAddTeacher = async () => {
    if (!teacherName.trim()) return
    setIsSaving(true)
    try {
      await addDoc(collection(db, "teachers"), {
        name: teacherName,
        vote: 0,
        createdAt: serverTimestamp()
      })
      toast({ title: "선생님 등록 완료" })
      setTeacherName("")
    } catch (error) {
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteTeacher = async (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return
    try {
      await deleteDoc(doc(db, "teachers", id))
      toast({ title: "삭제 완료" })
    } catch (error) {
      console.error(error)
    }
  }

  const handleToggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    if (userId === user?.uid) {
      toast({ variant: "destructive", title: "본인의 권한은 해제할 수 없습니다." })
      return
    }
    
    try {
      const targetAdminRef = doc(db, "roles_admin", userId)
      if (isCurrentlyAdmin) {
        await deleteDoc(targetAdminRef)
        toast({ title: "관리자 권한 해제 완료" })
      } else {
        await setDoc(targetAdminRef, {
          addedAt: serverTimestamp(),
          addedBy: user?.uid
        })
        toast({ title: "관리자 권한 부여 완료" })
      }
    } catch (error) {
      console.error(error)
      toast({ variant: "destructive", title: "권한 변경 실패" })
    }
  }

  const handleUpdateNotice = async () => {
    if (!noticeText.trim()) return
    setIsSaving(true)
    try {
      await setDoc(doc(db, "metadata", "config"), {
        notice: noticeText
      }, { merge: true })
      toast({ title: "공지 업데이트 완료" })
      setNoticeText("")
    } catch (error) {
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveFortune = async () => {
    if (!fortuneText || !fortuneDate) return
    setIsSaving(true)
    try {
      await setDoc(doc(db, "daily_fortunes", fortuneDate), {
        id: fortuneDate,
        date: fortuneDate,
        fortuneText,
        createdAt: serverTimestamp(),
      })
      toast({ title: "운세 저장 완료" })
      setFortuneText("")
    } catch (error) { 
      console.error(error) 
    } finally { 
      setIsSaving(false) 
    }
  }

  const handleSaveProblem = async () => {
    if (!probDate || !probGrade || !probTitle || !probText || !probAnswer) {
      toast({ variant: "destructive", title: "모든 항목을 입력해주세요." })
      return
    }
    setIsSaving(true)
    try {
      const docId = `${probDate}_${probGrade}`
      await setDoc(doc(db, "daily_problems", docId), {
        id: docId,
        date: probDate,
        grade: probGrade,
        title: probTitle,
        topic: probTopic || "일반",
        difficulty: probDiff,
        problemText: probText,
        answer: probAnswer.trim(),
        rewardPoints: 100,
        createdAt: serverTimestamp(),
      })
      toast({ title: "문제 등록 완료" })
      setProbTitle("")
      setProbText("")
      setProbAnswer("")
    } catch (error) {
      console.error(error)
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
          <p className="text-muted-foreground text-sm">학생 및 콘텐츠 전반 관리</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-8 bg-muted/50 p-1">
          <TabsTrigger value="users"><UserCog className="mr-2 h-4 w-4" /> 회원 관리</TabsTrigger>
          <TabsTrigger value="vote"><Users className="mr-2 h-4 w-4" /> 투표</TabsTrigger>
          <TabsTrigger value="problem"><BrainCircuit className="mr-2 h-4 w-4" /> 문제</TabsTrigger>
          <TabsTrigger value="notice"><Megaphone className="mr-2 h-4 w-4" /> 공지</TabsTrigger>
          <TabsTrigger value="fortune"><Star className="mr-2 h-4 w-4" /> 운세</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle>회원 명단 및 권한 관리</CardTitle>
              <CardDescription>학생들에게 관리자 권한을 부여하거나 해제할 수 있습니다.</CardDescription>
            </CardHeader>
            <CardContent>
              {isUsersLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
              ) : (
                <div className="space-y-2">
                  {allUsers?.map((u) => {
                    const isUserAdmin = adminIds.includes(u.id);
                    return (
                      <div key={u.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-transparent hover:border-muted-foreground/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={isUserAdmin ? "p-2 bg-primary/10 rounded-full" : "p-2 bg-muted rounded-full"}>
                            <ShieldCheck className={isUserAdmin ? "h-5 w-5 text-primary" : "h-5 w-5 text-muted-foreground"} />
                          </div>
                          <div>
                            <p className="font-bold text-sm">{u.nickname} ({u.lastName}{u.firstName})</p>
                            <p className="text-[10px] text-muted-foreground">ID: {u.username} | {u.schoolName} {u.grade}학년</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-medium text-muted-foreground">{isUserAdmin ? "관리자" : "학생"}</span>
                          <Switch 
                            checked={isUserAdmin} 
                            onCheckedChange={() => handleToggleAdmin(u.id, isUserAdmin)}
                            disabled={u.id === user?.uid}
                          />
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
                <CardTitle>새 후보 등록</CardTitle>
                <CardDescription>투표에 참여할 선생님 성함을 입력하세요.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>선생님 성함</Label>
                  <Input 
                    placeholder="홍길동" 
                    value={teacherName} 
                    onChange={(e) => setTeacherName(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddTeacher} disabled={isSaving} className="w-full">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="mr-2 h-4 w-4" />} 후보 추가
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white">
              <CardHeader>
                <CardTitle>현재 순위</CardTitle>
                <CardDescription>투표 현황을 실시간으로 확인합니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isTeachersLoading ? (
                  <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
                ) : (
                  teachers?.map((t, i) => (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0">{i + 1}</Badge>
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

        <TabsContent value="problem">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle>오늘의 도전 문제 등록</CardTitle>
              <CardDescription>학년별로 다른 문제를 제공할 수 있습니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>날짜</Label>
                  <Input type="date" value={probDate} onChange={(e) => setProbDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>학년</Label>
                  <Select value={probGrade} onValueChange={setProbGrade}>
                    <SelectTrigger>
                      <SelectValue placeholder="학년 선택" />
                    </SelectTrigger>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>제목</Label>
                  <Input placeholder="미적분 기초 퀴즈" value={probTitle} onChange={(e) => setProbTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>과목/토픽</Label>
                  <Input placeholder="수학" value={probTopic} onChange={(e) => setProbTopic(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>난이도</Label>
                <Select value={probDiff} onValueChange={setProbDiff}>
                  <SelectTrigger>
                    <SelectValue placeholder="난이도" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="쉬움">쉬움</SelectItem>
                    <SelectItem value="보통">보통</SelectItem>
                    <SelectItem value="어려움">어려움</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>문제 내용</Label>
                <Textarea 
                  placeholder="문제 설명을 입력하세요..." 
                  className="min-h-[120px]" 
                  value={probText} 
                  onChange={(e) => setProbText(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>정답 (텍스트 일치 확인)</Label>
                <Input placeholder="정답을 입력하세요" value={probAnswer} onChange={(e) => setProbAnswer(e.target.value)} />
              </div>
              <Button onClick={handleSaveProblem} disabled={isSaving} className="w-full">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "문제 등록하기"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notice">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle>라운지 공지사항</CardTitle>
              <CardDescription>투표 화면 상단에 노출될 한 줄 공지를 설정합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>공지 내용</Label>
                <Input 
                  placeholder="예: 이번 주 금요일까지 투표 마감입니다! 🔥" 
                  value={noticeText} 
                  onChange={(e) => setNoticeText(e.target.value)}
                />
              </div>
              <Button onClick={handleUpdateNotice} disabled={isSaving} className="w-full">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "공지 업데이트"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fortune">
          <Card className="border-none shadow-sm bg-white p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>날짜</Label>
                <Input type="date" value={fortuneDate} onChange={(e) => setFortuneDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>오늘의 한마디</Label>
                <Input value={fortuneText} onChange={(e) => setFortuneText(e.target.value)} placeholder="운세 내용을 입력하세요." />
              </div>
              <Button onClick={handleSaveFortune} disabled={isSaving} className="w-full">
                저장하기
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
