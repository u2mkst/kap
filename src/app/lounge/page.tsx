
"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  MessageSquare, 
  Heart, 
  Send, 
  Trash2,
  Users,
  ChevronRight,
  Loader2
} from "lucide-react"
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase"
import { collection, addDoc, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove, query, where, orderBy, serverTimestamp } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"

export default function LoungePage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  
  const userDocRef = useMemoFirebase(() => {
    if (!user) return null
    return doc(db, "users", user.uid)
  }, [user, db])
  const { data: userData } = useDoc(userDocRef)

  const [newPost, setNewPost] = useState("")
  const [isPosting, setIsPosting] = useState(false)

  // 학년별 쿼리 (사용자 정보가 완전히 로드된 후 실행)
  const postsQuery = useMemoFirebase(() => {
    if (!userData || !userData.grade) return null
    return query(
      collection(db, "posts"),
      where("grade", "==", userData.grade),
      orderBy("createdAt", "desc")
    )
  }, [db, userData])

  const { data: posts, isLoading: isPostsLoading } = useCollection(postsQuery)

  const handleCreatePost = async () => {
    if (!newPost.trim() || !user || !userData) return
    setIsPosting(true)
    try {
      await addDoc(collection(db, "posts"), {
        authorId: user.uid,
        authorNickname: userData.nickname || "익명",
        content: newPost,
        grade: userData.grade,
        likes: [],
        createdAt: serverTimestamp(),
      })
      setNewPost("")
      toast({ title: "게시글 등록", description: "성공적으로 게시되었습니다." })
    } catch (error) {
      console.error(error)
    } finally {
      setIsPosting(false)
    }
  }

  const handleLike = async (postId: string, currentLikes: string[]) => {
    if (!user) return
    const postRef = doc(db, "posts", postId)
    const isLiked = currentLikes.includes(user.uid)
    
    try {
      await updateDoc(postRef, {
        likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      })
    } catch (error) {
      console.error(error)
    }
  }

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteDoc(doc(db, "posts", postId))
      toast({ title: "삭제 완료", description: "게시글이 삭제되었습니다." })
    } catch (error) {
      console.error(error)
    }
  }

  if (isUserLoading || isPostsLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black font-headline text-primary flex items-center gap-2">
            <Users className="h-8 w-8" /> {userData?.grade}학년 전용 라운지
          </h1>
          <p className="text-muted-foreground mt-1">우리 학년 친구들하고만 소통하는 비밀 게시판</p>
        </div>
        <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
          {userData?.nickname}
        </Badge>
      </div>

      <Card className="mb-8 border-none shadow-md overflow-hidden bg-white">
        <CardContent className="p-0">
          <Textarea 
            placeholder="친구들에게 하고 싶은 이야기를 남겨보세요..." 
            className="border-none focus-visible:ring-0 min-h-[120px] p-6 text-lg resize-none"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
          />
        </CardContent>
        <CardFooter className="bg-muted/30 px-6 py-3 flex justify-between items-center">
          <span className="text-xs text-muted-foreground">매너 있는 대화를 나눠주세요.</span>
          <Button onClick={handleCreatePost} disabled={isPosting || !newPost.trim()} className="bg-primary font-bold">
            {isPosting ? "게시 중..." : <><Send className="mr-2 h-4 w-4" /> 게시하기</>}
          </Button>
        </CardFooter>
      </Card>

      <div className="space-y-6">
        {posts?.map((post) => (
          <Card key={post.id} className="border-none shadow-sm bg-white hover:shadow-md transition-all">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                    {post.authorNickname?.[0] || "?"}
                  </div>
                  <span className="font-bold text-sm">{post.authorNickname}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : "방금 전"}
                  </span>
                </div>
                {user?.uid === post.authorId && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeletePost(post.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pb-4 pt-2">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
            </CardContent>
            <CardFooter className="border-t pt-3 pb-3 flex gap-4">
              <button 
                onClick={() => handleLike(post.id, post.likes || [])}
                className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${post.likes?.includes(user?.uid) ? 'text-red-500' : 'text-muted-foreground hover:text-red-400'}`}
              >
                <Heart className={`h-4 w-4 ${post.likes?.includes(user?.uid) ? 'fill-current' : ''}`} /> 
                좋아요 {post.likes?.length || 0}
              </button>
              <button className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors">
                <MessageSquare className="h-4 w-4" /> 댓글
              </button>
            </CardFooter>
          </Card>
        ))}

        {posts?.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground font-medium">아직 올라온 게시글이 없습니다.<br/>첫 번째 주인공이 되어보세요!</p>
          </div>
        )}
      </div>
    </div>
  )
}
