
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, Send, Loader2, CheckCircle2, Clock, Quote, Sparkles, Star } from "lucide-react"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, addDoc, serverTimestamp, query, where, orderBy, doc, limit, updateDoc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

export default function SupportPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  
  const [isSending, setIsSending] = useState(false)
  
  // 1:1 문의 상태
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")

  // 명언 추천 상태
  const [quoteText, setQuoteText] = useState("")
  const [quoteAuthor, setQuoteAuthor] = useState("")

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

  // 페이지 접속 시 안 읽은 답변 모두 읽음 처리
  useEffect(() => {
    if (myInquiries) {
      myInquiries.forEach(iq => {
        if (iq.status === "replied" && iq.isRead === false) {
          updateDoc(doc(db, "inquiries", iq.id), { isRead: true })
        }
      })
    }
  }, [myInquiries, db])

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

  const handleSuggestQuote = async () => {
    if (!quoteText.trim() || !user) return
    setIsSending(true)

    const suggestionData = {
      userId: user.uid,
      userNickname: userData?.nickname || "학생",
      fortuneText: quoteText.trim(),
      author: quoteAuthor.trim() || "알 수 없음",
      status: "pending",
      createdAt: serverTimestamp()
    }

    addDoc(collection(db, "quote_suggestions"), suggestionData)
      .then(() => {
        toast({ title: "명언이 추천되었습니다!", description: "관리자 검토 후 반영될 예정입니다." })
        setQuoteText("")
        setQuoteAuthor("")
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'quote_suggestions',
          operation: 'create',
          requestResourceData: suggestionData
        }))
      })
      .finally(() => setIsSending(false))
  }

  if (isUserLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="flex flex-col items-center gap-8 relative z-10">
          <div className="relative group">
            <div className="absolute -inset-4 bg-primary/20 rounded-[2.5rem] blur-xl group-hover:bg-primary/30 transition-all duration-500 animate-pulse" />
            <div className="relative h-24 w-24 rounded-[2rem] bg-card border border-primary/10 flex items-center justify-center shadow-2xl animate-float animate-glow">
              <MessageSquare className="h-12 w-12 text-primary animate-pulse-gentle" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent animate-shimmer-text">
              고객센터 연결 중...
            </h2>
            <div className="flex gap-1.5">
              <div className="h-2 w-2 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.3s]" />
              <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
              <div className="h-2 w-2 rounded-full bg-primary animate-bounce" />
            </div>
          </div>
        </div>
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
          <h1 className="text-3xl font-black font-headline tracking-tight">문의 및 제안</h1>
          <p className="text-muted-foreground text-sm font-bold">선생님과 소통하고 KST HUB를 함께 만들어가요.</p>
        </div>
      </div>

      <Tabs defaultValue="inquiry" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 p-1 rounded-2xl">
          <TabsTrigger value="inquiry" className="rounded-xl font-black py-2"><MessageSquare className="h-4 w-4 mr-2" /> 1:1 문의</TabsTrigger>
          <TabsTrigger value="quote" className="rounded-xl font-black py-2"><Quote className="h-4 w-4 mr-2" /> 명언 추천</TabsTrigger>
        </TabsList>

        <TabsContent value="inquiry" className="space-y-8">
          <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black text-primary uppercase tracking-wider">선생님께 질문하기</CardTitle>
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
              <span className="text-[10px] font-bold text-muted-foreground opacity-60">최근 20건</span>
            </div>
            
            {isHistoryLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-30">
                <Loader2 className="animate-spin h-6 w-6 text-primary" />
                <p className="text-[10px] font-bold">내역을 불러오는 중...</p>
              </div>
            ) : myInquiries && myInquiries.length > 0 ? (
              <div className="grid gap-4">
                {myInquiries.map((iq) => (
                  <Card key={iq.id} className="border-none shadow-sm bg-card rounded-3xl overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={iq.status === "open" ? "destructive" : "secondary"} className="text-[9px] font-black rounded-full px-2 py-0 h-5 border-none">
                              {iq.status === "open" ? "답변 대기" : "답변 완료"}
                            </Badge>
                            {!iq.isRead && iq.status === "replied" && (
                              <Badge className="bg-destructive text-white text-[9px] font-black rounded-full h-5 animate-pulse">NEW</Badge>
                            )}
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
                          <p className="text-[9px] text-primary/40 mt-3 font-bold">
                            확인 시간: {iq.updatedAt?.toDate ? iq.updatedAt.toDate().toLocaleString() : "방금 전"}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-muted/20 rounded-[2.5rem] border border-dashed border-border flex flex-col items-center gap-2">
                <MessageSquare className="h-10 w-10 text-muted-foreground/20" />
                <p className="text-[11px] text-muted-foreground font-black italic">아직 등록된 문의가 없습니다.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="quote" className="space-y-8">
          <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden">
            <CardHeader className="pb-2 bg-accent/10">
              <div className="flex items-center gap-2 text-accent-foreground">
                <Sparkles className="h-5 w-5" />
                <CardTitle className="text-sm font-black uppercase tracking-wider">나만의 명언 추천하기</CardTitle>
              </div>
              <CardDescription className="text-[10px] font-bold">
                친구들에게 힘이 될 만한 멋진 글귀를 추천해주세요. <br/>
                관리자가 승인하면 내일의 명언으로 등록됩니다!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label className="text-[11px] font-black text-muted-foreground ml-1">명언 내용</Label>
                <Textarea 
                  value={quoteText} 
                  onChange={(e) => setQuoteText(e.target.value)} 
                  placeholder="예: 실수는 인생의 교훈이다." 
                  className="min-h-[100px] rounded-2xl border-none bg-muted/30 resize-none focus-visible:ring-accent"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-black text-muted-foreground ml-1">작성자 또는 출처</Label>
                <Input 
                  value={quoteAuthor} 
                  onChange={(e) => setQuoteAuthor(e.target.value)} 
                  placeholder="예: 알버트 아인슈타인 (비워두면 '알 수 없음')" 
                  className="rounded-2xl h-11 border-none bg-muted/30 focus-visible:ring-accent"
                />
              </div>
              <Button 
                onClick={handleSuggestQuote} 
                disabled={isSending || !quoteText.trim()} 
                className="w-full font-black h-12 rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90 shadow-md active:scale-95 transition-transform border-none"
              >
                {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Star className="mr-2 h-4 w-4" /> 명언 추천하기</>}
              </Button>
            </CardContent>
          </Card>

          <div className="bg-muted/30 p-6 rounded-3xl border border-dashed border-border text-center space-y-2">
            <Quote className="h-8 w-8 text-muted-foreground/30 mx-auto" />
            <h3 className="text-sm font-black opacity-60">오늘의 주인공은 바로 당신!</h3>
            <p className="text-[10px] font-bold text-muted-foreground leading-relaxed">
              자신이 직접 지은 문장도 좋아요. <br/>
              멋진 글귀로 친구들의 하루를 밝혀주세요. ✨
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
