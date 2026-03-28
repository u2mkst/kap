
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShieldAlert, Star, Plus, Calendar, Trash2, MessageSquare, ShieldCheck } from "lucide-react"
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from "@/firebase"
import { doc, setDoc, deleteDoc, serverTimestamp, query, orderBy, collection } from "firebase/firestore"
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

  // 모든 게시글 모니터링
  const allPostsQuery = useMemoFirebase(() => query(collection(db, "posts"), orderBy("createdAt", "desc")), [db])
  const { data: allPosts } = useCollection(allPostsQuery)

  useEffect(() => {
    if (!isUserLoading && !isAdminLoading && user && !isAdminDoc) {
      toast({ variant: "destructive", title: "권한 오류", description: "관리자만 접근 가능합니다." })
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
        createdAt: serverTimestamp(),
      })
      toast({ title: "저장 완료" })
      setFortuneText("")
    } catch (error) { console.error(error) } finally { setIsLoading(false) }
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
        topic: problemTopic,
        difficulty: "Medium",
        createdAt: serverTimestamp(),
      })
      toast({ title: "문제 등록 완료" })
      setProblemTitle("")
      setProblemText("")
    } catch (error) { console.error(error) } finally { setIsLoading(false) }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm("이 게시글을 삭제하시겠습니까?")) return
    try {
      await deleteDoc(doc(db, "posts", postId))
      toast({ title: "관리자 권한 삭제", description: "게시글이 삭제되었습니다." })
    } catch (error) { console.error(error) }
  }

  if (isUserLoading || isAdminLoading) return null

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
        <TabsList className="grid w-full grid-cols-3 mb-8">
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
              {allPosts?.map((post) => (
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
              ))}
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
                <Textarea value={fortuneText} onChange={(e) => setFortuneText(e.target.value)} />
              </div>
              <Button onClick={handleSaveFortune} disabled={isLoading} className="w-full">저장</Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="problem">
          <Card className="border-none shadow-sm bg-white p-6">
            <div className="space-y-4">
              <Input placeholder="문제 제목" value={problemTitle} onChange={(e) => setProblemTitle(e.target.value)} />
              <Textarea placeholder="문제 내용" value={problemText} onChange={(e) => setProblemText(e.target.value)} />
              <Button onClick={handleSaveProblem} disabled={isLoading} className="w-full">문제 등록</Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
