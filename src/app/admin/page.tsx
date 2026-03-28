
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShieldAlert, Send, Plus, Calendar, Star } from "lucide-react"
import { useFirestore, useUser } from "@/firebase"
import { doc, setDoc, collection, serverTimestamp } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"

export default function AdminPage() {
  const { user } = useUser()
  const db = useFirestore()
  const [isLoading, setIsLoading] = useState(false)

  // 오늘의 한마디 (Fortune)
  const [fortuneDate, setFortuneDate] = useState(new Date().toISOString().split('T')[0])
  const [fortuneText, setFortuneText] = useState("")

  // 오늘의 문제 (Problem)
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-headline">관리자 대시보드</h1>
          <p className="text-muted-foreground">학원 전용 콘텐츠를 관리합니다.</p>
        </div>
      </div>

      <Tabs defaultValue="fortune" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="fortune"><Star className="mr-2 h-4 w-4" /> 오늘의 한마디</TabsTrigger>
          <TabsTrigger value="problem"><Plus className="mr-2 h-4 w-4" /> 오늘의 문제</TabsTrigger>
        </TabsList>

        <TabsContent value="fortune">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle>오늘의 한마디 설정</CardTitle>
              <CardDescription>학생들에게 영감을 주는 메시지를 입력하세요.</CardDescription>
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
                {isLoading ? "저장 중..." : "저장하기"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="problem">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle>오늘의 도전 문제 등록</CardTitle>
              <CardDescription>학생들이 풀 수 있는 일일 문제를 등록합니다.</CardDescription>
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
                {isLoading ? "저장 중..." : "문제 등록하기"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
