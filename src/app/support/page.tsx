
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  MessageSquare, 
  Send, 
  Loader2, 
  History, 
  ChevronRight, 
  AlertCircle,
  HelpCircle
} from "lucide-react"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, addDoc, serverTimestamp, query, where, orderBy } from "firebase/firestore"
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
        userNickname: userData?.nickname || "익명",
        subject,
        message,
        reply: "",
        status: "open",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      toast({ title: "문의가 등록되었습니다.", description: "최대한 빠르게 답변해 드릴게요!" })
      setSubject("")
      setMessage("")
    } catch (error) {
      console.error(error)
    } finally {
      setIsSending(false)
    }
  }

  if (isUserLoading || !user) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="flex items-center gap-3 mb-10">
        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
          <HelpCircle className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-4xl font-bold font-headline">1:1 고객센터</h1>
          <p className="text-muted-foreground font-medium">학습이나 서비스 이용 중 궁금한 점을 남겨주세요.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-primary/5 pb-6">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" /> 새로운 문의 남기기
              </CardTitle>
              <CardDescription>어떤 내용이든 친절하게 답변해 드립니다.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>제목</Label>
                <Input 
                  placeholder="문의 제목을 입력하세요" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>상세 내용</Label>
                <Textarea 
                  placeholder="궁금한 내용을 구체적으로 적어주세요." 
                  className="min-h-[150px]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleSendInquiry} 
                disabled={isSending || !subject || !message}
                className="w-full bg-primary h-12 text-lg font-bold rounded-xl"
              >
                {isSending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <><Send className="mr-2 h-5 w-5" /> 문의 보내기</>}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-orange-50/50 border-orange-100">
            <CardContent className="p-6 flex gap-4">
              <AlertCircle className="h-6 w-6 text-orange-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-orange-800 mb-1">문의 전 확인해 주세요!</p>
                <p className="text-xs text-orange-700 leading-relaxed">
                  답변은 관리자가 확인 후 순차적으로 진행됩니다. 보통 24시간 이내에 답변을 받으실 수 있습니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <History className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-xl">나의 문의 내역</h2>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {isHistoryLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin opacity-20" /></div>
            ) : myInquiries?.map((iq) => (
              <Card key={iq.id} className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
                <CardHeader className="p-5 pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={iq.status === "open" ? "secondary" : "default"} className="text-[10px] py-0">
                      {iq.status === "open" ? "답변 대기" : "답변 완료"}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{new Date(iq.createdAt?.toDate()).toLocaleDateString()}</span>
                  </div>
                  <CardTitle className="text-sm font-bold truncate">{iq.subject}</CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-4">
                  <p className="text-xs text-muted-foreground line-clamp-2">{iq.message}</p>
                  
                  {iq.reply && (
                    <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/10 relative">
                      <div className="absolute -top-2 left-4 px-2 bg-white border border-primary/20 rounded-full text-[9px] font-black text-primary uppercase">
                        HUB Reply
                      </div>
                      <p className="text-xs font-medium leading-relaxed">{iq.reply}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {(!myInquiries || myInquiries.length === 0) && !isHistoryLoading && (
              <div className="text-center py-20 bg-muted/10 rounded-2xl border-2 border-dashed">
                <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">문의 내역이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
