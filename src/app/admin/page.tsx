
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ShieldAlert, Star, Plus, Trash2, MessageSquare, Loader2 } from "lucide-react"
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from "@/firebase"
import { doc, setDoc, deleteDoc, serverTimestamp, query, orderBy, collection } from "firebase/firestore"
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

  // 관리자 권한이 완전히 확인된 경우에만 게시글 쿼리 실행
  const allPostsQuery = useMemoFirebase(() => {
    if (isAdminLoading || !isAdminDoc) return null
    return query(collection(db, "posts"), orderBy("createdAt", "desc"))
  }, [db, isAdminLoading, isAdminDoc])

  const { data: allPosts, isLoading: isPostsLoading } = useCollection(allPostsQuery)

  const [fortuneDate, setFortuneDate] = useState("")
  const [fortuneText, setFortuneText] = useState("")

  const [problemDate, setProblemDate] = useState("")
  const [problemTitle, setProblemTitle] = useState("")
  const [problemText, setProblemText] = useState("")
  const [problemTopic, setProblemTopic] = useState("수학")

  useEffect(() => {
    setIsMounted(true)
    const today = new Date().toISOString().split('T')[0]
    setFortuneDate(today)
    setProblemDate(today)
  }, [])

  useEffect(() => {
    if (!isUserLoading && !isAdminLoading && isMounted) {
      if (!user || !isAdminDoc) {
        toast({ variant: "destructive", title: "권한 오류", description: "관리자 전용 페이지입니다." })
        router.push("/dashboard")
      }
    }
  }, [user, isAdminDoc, isUserLoading, isAdminLoading, isMounted, router])

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

  const handleSaveProblem = async () => {
    if (!problemTitle || !problemText || !problemDate) return
    setIsSaving(true)
    try {
      await setDoc(doc(db, "daily_problems", problemDate), {
        id: problemDate,
        date: problemDate,
        title: problemTitle,
        problemText,
        topic: problemTopic,
        difficulty: "Medium",
        createdAt: serverTimestamp(),
      })
      toast({ title: "문제 등록 완료" })
      setProblemTitle("")
      setProblemText("")
    } catch (error) { 
      console.error(error) 
    } finally { 
      setIsSaving(false) 
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm("이 게시글을 삭제하시겠습니까?")) return
    try {
      await deleteDoc(doc(db, "posts", postId))
      toast({ title: "삭제 완료", description: "게시글이 삭제되었습니다." })
    } catch (error) { 
      console.error(error) 
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
          <p className="text-muted-foreground">콘텐츠 관리 및 커뮤니티 모니터링</p>
        </div>
      </div>

      <Tabs defaultValue="lounge" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/50 p-1">
          <TabsTrigger value="lounge"><MessageSquare className="mr-2 h-4 w-4" /> 게시판 관리</TabsTrigger>
          <TabsTrigger value="fortune"><Star className="mr-2 h-4 w-4" /> 운세 관리</TabsTrigger>
          <TabsTrigger value="problem"><Plus className="mr-2 h-4 w-4" /> 문제 관리</TabsTrigger>
        </TabsList>

        <TabsContent value="lounge">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle>실시간 라운지 모니터링</CardTitle>
              <CardDescription>전체 학년의 게시글을 확인하고 부적절한 내용을 관리합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isPostsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : allPosts?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">게시글이 없습니다.</div>
              ) : (
                allPosts?.map((post) => (
                  <div key={post.id} className="p-4 rounded-xl border flex items-start justify-between bg-muted/5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{post.grade}학년</Badge>
                        <span className="font-bold text-sm">{post.authorNickname}</span>
                      </div>
                      <p className="text-sm">{post.content}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeletePost(post.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fortune">
          <Card className="border-none shadow-sm bg-white p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>날짜</Label>
                <Input type="date" value={fortuneDate || ""} onChange={(e) => setFortuneDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>오늘의 한마디</Label>
                <Textarea value={fortuneText || ""} onChange={(e) => setFortuneText(e.target.value)} placeholder="오늘의 운세 또는 격려의 말을 입력하세요." />
              </div>
              <Button onClick={handleSaveFortune} disabled={isSaving} className="w-full">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} 저장하기
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="problem">
          <Card className="border-none shadow-sm bg-white p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>날짜</Label>
                <Input type="date" value={problemDate || ""} onChange={(e) => setProblemDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>문제 제목</Label>
                <Input placeholder="오늘의 도전 문제 제목" value={problemTitle || ""} onChange={(e) => setProblemTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>문제 내용</Label>
                <Textarea placeholder="문제 내용을 입력하세요." value={problemText || ""} onChange={(e) => setProblemText(e.target.value)} />
              </div>
              <Button onClick={handleSaveProblem} disabled={isSaving} className="w-full">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} 문제 등록
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
