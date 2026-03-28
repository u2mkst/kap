
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ShieldAlert, Star, Plus, Trash2, Users, Loader2, Megaphone } from "lucide-react"
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

  // 선생님 목록 쿼리
  const teachersQuery = useMemoFirebase(() => {
    if (isAdminLoading || !isAdminDoc?.id) return null
    return query(collection(db, "teachers"), orderBy("vote", "desc"))
  }, [db, isAdminLoading, isAdminDoc?.id])

  const { data: teachers, isLoading: isTeachersLoading } = useCollection(teachersQuery)

  const [teacherName, setTeacherName] = useState("")
  const [noticeText, setNoticeText] = useState("")

  const [fortuneDate, setFortuneDate] = useState("")
  const [fortuneText, setFortuneText] = useState("")

  useEffect(() => {
    setIsMounted(true)
    const today = new Date().toISOString().split('T')[0]
    setFortuneDate(today)
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
      toast({ title: "저장 완료" })
      setFortuneText("")
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
          <p className="text-muted-foreground">인기 투표 및 콘텐츠 관리</p>
        </div>
      </div>

      <Tabs defaultValue="vote" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/50 p-1">
          <TabsTrigger value="vote"><Users className="mr-2 h-4 w-4" /> 투표 관리</TabsTrigger>
          <TabsTrigger value="notice"><Megaphone className="mr-2 h-4 w-4" /> 공지 관리</TabsTrigger>
          <TabsTrigger value="fortune"><Star className="mr-2 h-4 w-4" /> 운세 관리</TabsTrigger>
        </TabsList>

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
                <CardDescription>투표 현황을 실시간으로 확인하고 관리합니다.</CardDescription>
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
