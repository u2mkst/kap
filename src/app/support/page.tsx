
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Send, Loader2, Trash2 } from "lucide-react"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, addDoc, serverTimestamp, query, where, orderBy, doc, deleteDoc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"

export default function SupportPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const [isSending, setIsSending] = useState(false)
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")

  const inquiriesQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(
      collection(db, "inquiries"), 
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    )
  }, [db, user])

  const { data: myInquiries, isLoading: isHistoryLoading } = useCollection(inquiriesQuery)

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null
    return doc(db, "users", user.uid)
  }, [user, db])
  const { data: userData } = useDoc(userDocRef)

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login")
    }
  }, [user, isUserLoading, router])

  const handleSendInquiry = async () => {
    if (!subject.trim() || !message.trim() || !user) return
    setIsSending(true)
    try {
      await addDoc(collection(db, "inquiries"), {
        userId: user.uid,
        userNickname: userData?.nickname || "학생",
        subject,
        message,
        reply: "",
        status: "open",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      toast({ title: "문의 등록 완료" })
      setSubject("")
      setMessage("")
    } catch (error) {
      console.error(error)
    } finally {
      setIsSending(false)
    }
  }

  const handleDeleteInquiry = (id: string) => {
    if (!confirm("이 문의 내역을 삭제하시겠습니까?")) return
    deleteDoc(doc(db, "inquiries", id)).then(() => toast({ title: "내역 삭제 완료" }))
  }

  if (isUserLoading || !user) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <MessageSquare className="h-6 w-6 text-primary" /> 1:1 고객센터
      </h1>

      <div className="grid gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">새 문의 작성</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">제목</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="제목을 입력하세요" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">내용</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="문의 내용을 입력하세요" className="min-h-[120px]" />
            </div>
            <Button onClick={handleSendInquiry} disabled={isSending || !subject || !message} className="w-full">
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-2 h-4 w-4" /> 보내기</>}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="font-bold text-sm">나의 문의 내역</h2>
          {isHistoryLoading ? (
            <div className="flex justify-center"><Loader2 className="animate-spin opacity-20" /></div>
          ) : myInquiries && myInquiries.length > 0 ? (
            myInquiries.map((iq) => (
              <Card key={iq.id} className="border-none shadow-sm relative group">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleDeleteInquiry(iq.id)} 
                  className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive/50 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-center pr-8">
                    <Badge variant={iq.status === "open" ? "outline" : "default"} className="text-[10px]">
                      {iq.status === "open" ? "답변대기" : "답변완료"}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{iq.createdAt?.toDate().toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm font-bold">{iq.subject}</p>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">{iq.message}</p>
                  {iq.reply && (
                    <div className="mt-2 p-3 bg-primary/5 rounded-lg border-l-2 border-primary">
                      <p className="text-[10px] font-bold text-primary mb-1">답변</p>
                      <p className="text-xs">{iq.reply}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-center py-10 text-xs text-muted-foreground">등록된 문의가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  )
}
