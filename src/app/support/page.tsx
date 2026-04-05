
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
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

export default function SupportPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const [isSending, setIsSending] = useState(false)
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")

  // 쿼리를 메모이제이션하고 user.uid가 확실할 때만 실행
  const inquiriesQuery = useMemoFirebase(() => {
    if (!user?.uid) return null
    return query(
      collection(db, "inquiries"), 
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    )
  }, [db, user?.uid])

  const { data: myInquiries, isLoading: isHistoryLoading } = useCollection(inquiriesQuery)

  const userDocRef = useMemoFirebase(() => {
    if (!user?.uid) return null
    return doc(db, "users", user.uid)
  }, [user?.uid, db])
  const { data: userData } = useDoc(userDocRef)

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login")
    }
  }, [user, isUserLoading, router])

  const handleSendInquiry = async () => {
    if (!subject.trim() || !message.trim() || !user) return
    setIsSending(true)
    
    const inquiryData = {
      userId: user.uid,
      userNickname: userData?.nickname || "학생",
      subject,
      message,
      reply: "",
      status: "open",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }

    addDoc(collection(db, "inquiries"), inquiryData)
      .then(() => {
        toast({ title: "문의 등록 완료" })
        setSubject("")
        setMessage("")
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'inquiries',
          operation: 'create',
          requestResourceData: inquiryData
        }))
      })
      .finally(() => setIsSending(false))
  }

  const handleDeleteInquiry = (id: string) => {
    if (!confirm("이 문의 내역을 삭제하시겠습니까?")) return
    const inquiryRef = doc(db, "inquiries", id)
    
    deleteDoc(inquiryRef)
      .then(() => toast({ title: "내역 삭제 완료" }))
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: inquiryRef.path,
          operation: 'delete'
        }))
      })
  }

  if (isUserLoading || !user) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl animate-in fade-in duration-700">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-primary font-headline">
        <MessageSquare className="h-6 w-6" /> 1:1 고객센터
      </h1>

      <div className="grid gap-6">
        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm font-bold">새 문의 작성</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold opacity-70">제목</Label>
              <Input 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)} 
                placeholder="제목을 입력하세요" 
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold opacity-70">내용</Label>
              <Textarea 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                placeholder="문의 내용을 입력하세요" 
                className="min-h-[120px] rounded-xl"
              />
            </div>
            <Button 
              onClick={handleSendInquiry} 
              disabled={isSending || !subject || !message} 
              className="w-full font-bold h-11 rounded-xl bg-primary hover:bg-primary/90 shadow-sm active:scale-95 transition-transform"
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-2 h-4 w-4" /> 보내기</>}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="font-bold text-sm flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" /> 나의 문의 내역
          </h2>
          {isHistoryLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-primary opacity-50" />
            </div>
          ) : myInquiries && myInquiries.length > 0 ? (
            myInquiries.map((iq) => (
              <Card key={iq.id} className="border-none shadow-sm relative group bg-white rounded-2xl overflow-hidden animate-in slide-in-from-bottom-2 transition-all hover:shadow-md">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleDeleteInquiry(iq.id)} 
                  className="absolute top-3 right-3 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 rounded-full"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <CardContent className="p-5 space-y-3">
                  <div className="flex justify-between items-center pr-10">
                    <Badge variant={iq.status === "open" ? "destructive" : "outline"} className="text-[10px] font-bold rounded-full">
                      {iq.status === "open" ? "답변대기" : "답변완료"}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {iq.createdAt?.toDate ? iq.createdAt.toDate().toLocaleDateString() : "방금 전"}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-foreground leading-tight">{iq.subject}</p>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{iq.message}</p>
                  {iq.reply && (
                    <div className="mt-2 p-4 bg-primary/5 rounded-xl border border-primary/10 animate-in fade-in slide-in-from-top-1">
                      <p className="text-[10px] font-black text-primary mb-1 uppercase tracking-wider">선생님 답변</p>
                      <p className="text-xs font-bold leading-relaxed text-primary/80">{iq.reply}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-center py-20 text-xs text-muted-foreground italic bg-muted/20 rounded-2xl border border-dashed font-medium">
              등록된 문의가 없습니다.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
