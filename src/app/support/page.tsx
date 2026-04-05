
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Send, Loader2 } from "lucide-react"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, addDoc, serverTimestamp, query, where, orderBy, doc, limit } from "firebase/firestore"
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

  // 쿼리를 본인의 ID로만 엄격하게 제한하고 개수도 제한하여 오류 가능성 최소화
  const inquiriesQuery = useMemoFirebase(() => {
    if (!user?.uid) return null
    return query(
      collection(db, "inquiries"), 
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(10) // 최근 10개만 조회
    )
  }, [db, user?.uid])

  const { data: myInquiries, isLoading: isHistoryLoading } = useCollection(inquiriesQuery)

  const userDocRef = useMemoFirebase(() => {
    if (!user?.uid) return null
    return doc(db, "users", user.uid)
  }, [user?.uid, db])
  const { data: userData } = useDoc(userDocRef)

  const handleSendInquiry = async () => {
    if (!subject.trim() || !message.trim() || !user) return
    setIsSending(true)
    
    const inquiryData = {
      userId: user.uid,
      userNickname: userData?.nickname || "학생",
      subject: subject.trim(),
      message: message.trim(),
      reply: "",
      status: "open",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }

    addDoc(collection(db, "inquiries"), inquiryData)
      .then(() => {
        toast({ title: "문의가 등록되었습니다." })
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

  if (isUserLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    )
  }

  if (!user) {
    router.push("/login")
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-black font-headline tracking-tight">1:1 고객센터</h1>
      </div>

      <div className="grid gap-6">
        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black text-muted-foreground uppercase">문의하기</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground ml-1">문의 제목</Label>
              <Input 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)} 
                placeholder="어떤 점이 궁금하신가요?" 
                className="rounded-2xl h-11 border-muted bg-muted/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground ml-1">상세 내용</Label>
              <Textarea 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                placeholder="선생님께 전달할 내용을 적어주세요." 
                className="min-h-[120px] rounded-2xl border-muted bg-muted/20 resize-none"
              />
            </div>
            <Button 
              onClick={handleSendInquiry} 
              disabled={isSending || !subject.trim() || !message.trim()} 
              className="w-full font-black h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-md active:scale-95 transition-transform"
            >
              {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Send className="mr-2 h-4 w-4" /> 문의 보내기</>}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4 pt-4">
          <h2 className="font-black text-sm flex items-center gap-2 text-muted-foreground px-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" /> 나의 최근 문의 (최대 10개)
          </h2>
          
          {isHistoryLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-primary/30" />
            </div>
          ) : myInquiries && myInquiries.length > 0 ? (
            <div className="space-y-3">
              {myInquiries.map((iq) => (
                <Card key={iq.id} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex justify-between items-center">
                      <Badge variant={iq.status === "open" ? "destructive" : "outline"} className="text-[9px] font-bold rounded-full px-2">
                        {iq.status === "open" ? "답변 대기" : "답변 완료"}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-bold">
                        {iq.createdAt?.toDate ? iq.createdAt.toDate().toLocaleDateString() : "방금 전"}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground mb-1">{iq.subject}</p>
                      <p className="text-xs text-muted-foreground font-medium line-clamp-2 leading-relaxed">{iq.message}</p>
                    </div>
                    {iq.reply && (
                      <div className="mt-2 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                        <p className="text-[9px] font-black text-primary mb-1 uppercase tracking-wider">선생님 답변</p>
                        <p className="text-xs font-bold leading-relaxed text-primary/80">{iq.reply}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-muted/20 rounded-3xl border border-dashed border-muted-foreground/20">
              <p className="text-xs text-muted-foreground font-bold italic">등록된 문의가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
