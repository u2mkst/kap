
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShieldAlert, Send, Plus, Calendar, Star, Lock } from "lucide-react"
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"

export default function AdminPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const adminRef = useMemoFirebase(() => {
    if (!user) return null
    return doc(db, "roles_admin", user.uid)
  }, [user, db])

  const { data: isAdminDoc, isLoading: isAdminLoading } = useDoc(adminRef)

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login")
    }
  }, [user, isUserLoading, router])

  useEffect(() => {
    if (!isUserLoading && !isAdminLoading && user && !isAdminDoc) {
      toast({
        variant: "destructive",
        title: "접근 권한 없음",
        description: "관리자 전용 페이지입니다. 관리자 계정으로 로그인해 주세요.",
      })
      router.push("/dashboard")
    }
  }, [user, isAdminDoc, isUserLoading, isAdminLoading, router])

  const [fortuneDate, setFortuneDate] = useState(new Date().toISOString().split('T')[0])
  const [fortuneText, setFortuneText] = useState("")

  const [problemDate, setProblemDate] = useState(new Date().toISOString().split('T')[0])
  const [problemTitle, setProblemTitle] = useState("")
  const [problemText, setProblemText] = useState("")
  const [problemTopic, setProblemTopic] = useState("수학")

  const handleSaveFortune = async () => {
    if (!fortuneText) return
    setIsLoading(true)
    try {
      await setDoc(doc(db, "daily_fortunes", fortuneDate), {
        id: fortuneDate,
        date: fortuneDate,
        fortuneText,
        category: "General",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      toast({ title: "저장 완료", description: `${fortuneDate}의 운세가 저장되었습니다.` })
      setFortuneText("")
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProblem = async () => {
    if (!problemTitle || !problemText) return
    setIsLoading(true)
    try {
      await setDoc(doc(db, "daily_problems", problemDate), {
        id: problemDate,
        date: problemDate,
        title: problemTitle,
        problemText,
        solutionText: "해설은 관리자에게 문의하세요.",
        topic: problemTopic,
        difficulty: "Medium",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      toast({ title: "저장 완료", description: `${problemDate}의 문제가 저장되었습니다.` })
      setProblemTitle("")
      setProblemText("")
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isUserLoading || isAdminLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAdminDoc) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)] items-center justify-center p-4">
        <Lock className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">접근이 제한되었습니다.</h1>
        <p className="text-muted-foreground">관리자 권한이 필요합니다.</p>
        <Button onClick={() => router.push("/dashboard")} className="mt-6">대시보드로 돌아가기</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-headline">관리자 마스터 대시보드</h1>
          <p className="text-muted-foreground">학원 전용 시스템 및 일일 콘텐츠를 관리합니다.</p>
        </div>
      </div>

      <Tabs defaultValue="fortune" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="fortune"><Star className="mr-2 h-4 w-4" /> 오늘의 한마디 관리</TabsTrigger>
          <TabsTrigger value="problem"><Plus className="mr-2 h-4 w-4" /> 일일 도전 문제 관리</TabsTrigger>
        </TabsList>

        <TabsContent value="fortune">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle>오늘의 한마디 설정</CardTitle>
              <CardDescription>모든 학생의 대시보드에 표시될 메시지를 입력하세요.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>날짜 선택</Label>
                <div className="flex gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <Input type="date" value={fortuneDate} onChange={(e) => setFortuneDate(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>메시지</Label>
                <Textarea 
                  placeholder="예: 오늘도 당신의 성장을 응원합니다! 끝까지 포기하지 마세요." 
                  className="min-h-[100px]"
                  value={fortuneText}
                  onChange={(e) => setFortuneText(e.target.value)}
                />
              </div>
              <Button onClick={handleSaveFortune} disabled={isLoading} className="w-full bg-primary">
                {isLoading ? "저장 중..." : "글로벌 공지 저장"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="problem">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle>오늘의 도전 문제 등록</CardTitle>
              <CardDescription>학생들이 풀 수 있는 고난도 문제를 등록합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>날짜</Label>
                  <Input type="date" value={problemDate} onChange={(e) => setProblemDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>과목/토픽</Label>
                  <Input placeholder="예: 수학(미분)" value={problemTopic} onChange={(e) => setProblemTopic(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>문제 제목</Label>
                <Input placeholder="문제의 핵심 제목" value={problemTitle} onChange={(e) => setProblemTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>문제 내용</Label>
                <Textarea 
                  placeholder="문제 텍스트를 입력하세요..." 
                  className="min-h-[150px]"
                  value={problemText}
                  onChange={(e) => setProblemText(e.target.value)}
                />
              </div>
              <Button onClick={handleSaveProblem} disabled={isLoading} className="w-full bg-primary">
                {isLoading ? "저장 중..." : "문제 챌린지 게시"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
