
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Send, Loader2, CheckCircle2, Clock } from "lucide-react"
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

  const inquiriesQuery = useMemoFirebase(() => {
    if (!user?.uid) return null
    return query(
      collection(db, "inquiries"), 
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(20)
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
      isRead: false,
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
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    router.push("/login")
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
          <MessageSquare className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-black font-headline tracking-tight">고객센터</h1>
          <p className="text-muted-foreground text-sm font-bold">궁금한 점이나 건의사항을 남겨주세요.</p>
        </div>
      </div>

      <div className="space-y-8">
        <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black text-primary uppercase tracking-wider">1:1 문의하기</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-muted-foreground ml-1">문의 제목</Label>
              <Input 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)} 
                placeholder="궁금한 내용을 간단히 적어주세요." 
                className="rounded-2xl h-11 border-none bg-muted/30 focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-muted-foreground ml-1">상세 내용</Label>
              <Textarea 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                placeholder="선생님이 확인하실 수 있도록 자세히 적어주세요." 
                className="min-h-[140px] rounded-2xl border-none bg-muted/30 resize-none focus-visible:ring-primary"
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

        <div className="space-y-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between px-2">
            <h2 className="font-black text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" /> 나의 문의 내역
            </h2>
          </div>
          
          {isHistoryLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-30">
              <Loader2 className="animate-spin h-6 w-6 text-primary" />
            </div>
          ) : myInquiries && myInquiries.length > 0 ? (
            <div className="grid gap-4">
              {myInquiries.map((iq) => (
                <Card key={iq.id} className="border-none shadow-sm bg-card rounded-3xl overflow-hidden">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={iq.status === "open" ? "destructive" : "secondary"} className="text-[9px] font-black rounded-full px-2 h-5 border-none">
                            {iq.status === "open" ? "답변 대기" : "답변 완료"}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-black">
                            {iq.createdAt?.toDate ? iq.createdAt.toDate().toLocaleDateString() : "방금 전"}
                          </span>
                        </div>
                        <p className="text-sm font-black text-primary leading-tight">{iq.subject}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-muted/20 rounded-2xl text-[12px] font-medium leading-relaxed text-foreground/80">
                      {iq.message}
                    </div>
                    {iq.reply && (
                      <div className="mt-4 p-5 bg-primary/5 rounded-[2rem] border border-primary/10 relative overflow-hidden animate-in slide-in-from-top-2">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-3 w-3 text-primary" />
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest">선생님 답변</p>
                        </div>
                        <p className="text-xs font-bold leading-relaxed text-primary/90 whitespace-pre-wrap">{iq.reply}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/20 rounded-[2.5rem] border border-dashed border-border flex flex-col items-center gap-2">
              <p className="text-[11px] text-muted-foreground font-black italic">아직 등록된 문의가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
