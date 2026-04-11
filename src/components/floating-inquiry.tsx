
"use client"

import { useState } from "react"
import { MessageSquarePlus, Send, Loader2, CheckCircle2, Quote, Sparkles, Star, MessageCircle } from "lucide-react"
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { collection, addDoc, serverTimestamp, doc, query, where, updateDoc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export function FloatingInquiry() {
  const { user } = useUser()
  const db = useFirestore()
  const [isSending, setIsSending] = useState(false)
  const [open, setOpen] = useState(false)

  // 1:1 문의 상태
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")

  // 명언 추천 상태
  const [quoteText, setQuoteText] = useState("")
  const [quoteAuthor, setQuoteAuthor] = useState("")

  const userDocRef = useMemoFirebase(() => {
    if (!user?.uid) return null
    return doc(db, "users", user.uid)
  }, [user?.uid, db])
  const { data: userData } = useDoc(userDocRef)

  // 읽지 않은 답변 쿼리
  const unreadRepliesQuery = useMemoFirebase(() => {
    if (!user?.uid) return null
    return query(
      collection(db, "inquiries"),
      where("userId", "==", user.uid),
      where("status", "==", "replied"),
      where("isRead", "==", false)
    )
  }, [db, user?.uid])
  
  const { data: unreadReplies } = useCollection(unreadRepliesQuery)
  const unreadCount = unreadReplies?.length || 0

  const handleSendInquiry = async () => {
    if (!subject.trim() || !message.trim() || !user) return
    setIsSending(true)
    
    try {
      await addDoc(collection(db, "inquiries"), {
        userId: user.uid,
        userNickname: userData?.nickname || "학생",
        subject: subject.trim(),
        message: message.trim(),
        reply: "",
        status: "open",
        isRead: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      toast({ title: "문의가 전송되었습니다.", description: "선생님이 확인 후 조치해 드릴게요!" })
      setSubject("")
      setMessage("")
    } catch (error) {
      console.error(error)
      toast({ variant: "destructive", title: "전송 실패", description: "잠시 후 다시 시도해 주세요." })
    } finally {
      setIsSending(false)
    }
  }

  const handleSuggestQuote = async () => {
    if (!quoteText.trim() || !user) return
    setIsSending(true)

    try {
      await addDoc(collection(db, "quote_suggestions"), {
        userId: user.uid,
        userNickname: userData?.nickname || "학생",
        fortuneText: quoteText.trim(),
        author: quoteAuthor.trim() || "알 수 없음",
        status: "pending",
        createdAt: serverTimestamp()
      })
      toast({ title: "명언이 추천되었습니다!", description: "관리자 검토 후 반영될 예정입니다." })
      setQuoteText("")
      setQuoteAuthor("")
    } catch (error) {
      console.error(error)
      toast({ variant: "destructive", title: "추천 실패", description: "잠시 후 다시 시도해 주세요." })
    } finally {
      setIsSending(false)
    }
  }

  const handleMarkAsRead = async (inquiryId: string) => {
    try {
      await updateDoc(doc(db, "inquiries", inquiryId), { isRead: true })
    } catch (error) {
      console.error("Error marking as read:", error)
    }
  }

  if (!user) return null

  return (
    <div className="fixed bottom-20 right-6 sm:bottom-8 sm:right-8 z-50">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button 
            size="icon" 
            className="relative h-14 w-14 rounded-full bg-primary text-white shadow-2xl hover:scale-110 transition-transform active:scale-95 border-4 border-background"
          >
            <MessageCircle className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs font-black text-white animate-bounce shadow-md">
                {unreadCount}
              </span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[90%] rounded-[2.5rem] sm:max-w-md bg-card border-none overflow-hidden max-h-[85vh] p-0 shadow-2xl">
          <Tabs defaultValue="inquiry" className="w-full">
            <div className="p-6 pb-0">
              <DialogHeader>
                <DialogTitle className="font-black text-xl text-primary tracking-tight">지원 및 제안</DialogTitle>
                <DialogDescription className="text-xs font-bold opacity-60">궁금한 점이나 멋진 생각을 들려주세요.</DialogDescription>
              </DialogHeader>
              <TabsList className="grid w-full grid-cols-2 mt-6 bg-muted/50 p-1 rounded-2xl">
                <TabsTrigger value="inquiry" className="rounded-xl font-black text-xs py-2">
                  <MessageSquarePlus className="h-3.5 w-3.5 mr-1.5" /> 1:1 문의
                </TabsTrigger>
                <TabsTrigger value="quote" className="rounded-xl font-black text-xs py-2">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" /> 명언 추천
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="overflow-y-auto px-6 py-6 max-h-[50vh] custom-scrollbar">
              <TabsContent value="inquiry" className="space-y-4 m-0">
                {/* 안 읽은 답변 목록 */}
                {unreadReplies && unreadReplies.length > 0 && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2 mb-6">
                    <Label className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full w-fit">🔔 새로운 답변 도착!</Label>
                    <div className="grid gap-2">
                      {unreadReplies.map((reply) => (
                        <div key={reply.id} className="p-4 bg-primary/5 rounded-2xl border border-primary/20 space-y-2">
                          <p className="text-xs font-black text-primary">Q: {reply.subject}</p>
                          <div className="p-3 bg-card rounded-xl border border-primary/10">
                            <p className="text-[11px] font-bold text-primary/80 leading-relaxed italic">"{reply.reply}"</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-full text-[10px] font-black text-primary/50 hover:bg-primary/10 rounded-full"
                            onClick={() => handleMarkAsRead(reply.id)}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" /> 확인했습니다
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="h-px bg-border my-4" />
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-black text-muted-foreground ml-1">문의 제목</Label>
                    <Input 
                      value={subject} 
                      onChange={(e) => setSubject(e.target.value)} 
                      placeholder="간단한 제목을 적어주세요." 
                      className="rounded-2xl bg-muted/30 border-none h-11 focus-visible:ring-primary font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-black text-muted-foreground ml-1">상세 내용</Label>
                    <Textarea 
                      value={message} 
                      onChange={(e) => setMessage(e.target.value)} 
                      placeholder="선생님이 확인하실 수 있게 자세히 알려주세요." 
                      className="rounded-2xl bg-muted/30 border-none min-h-[120px] resize-none focus-visible:ring-primary font-bold text-sm leading-relaxed"
                    />
                  </div>
                  <Button 
                    onClick={handleSendInquiry} 
                    disabled={isSending || !subject.trim() || !message.trim()}
                    className="w-full rounded-2xl h-12 font-black bg-primary text-white shadow-md active:scale-95 transition-transform"
                  >
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-2" /> 문의 보내기</>}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="quote" className="space-y-4 m-0">
                <div className="bg-accent/10 p-4 rounded-2xl mb-4 border border-accent/20">
                  <p className="text-[10px] font-black text-accent-foreground leading-relaxed">
                    친구들에게 힘이 될 만한 멋진 글귀를 추천해주세요. 승인되면 대시보드에 나타납니다! ✨
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-black text-muted-foreground ml-1">명언 내용</Label>
                    <Textarea 
                      value={quoteText} 
                      onChange={(e) => setQuoteText(e.target.value)} 
                      placeholder="예: 실수는 인생의 교훈이다." 
                      className="rounded-2xl bg-muted/30 border-none min-h-[100px] resize-none focus-visible:ring-accent font-bold text-sm italic"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-black text-muted-foreground ml-1">작성자 또는 출처</Label>
                    <Input 
                      value={quoteAuthor} 
                      onChange={(e) => setQuoteAuthor(e.target.value)} 
                      placeholder="예: 알버트 아인슈타인" 
                      className="rounded-2xl bg-muted/30 border-none h-11 focus-visible:ring-accent font-bold text-sm"
                    />
                  </div>
                  <Button 
                    onClick={handleSuggestQuote} 
                    disabled={isSending || !quoteText.trim()} 
                    className="w-full font-black h-12 rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90 shadow-md active:scale-95 transition-transform border-none"
                  >
                    {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Star className="mr-2 h-4 w-4" /> 명언 추천하기</>}
                  </Button>
                </div>
              </TabsContent>
            </div>
          </Tabs>
          <div className="p-4 bg-muted/20 text-center">
            <p className="text-[9px] font-black opacity-30 uppercase tracking-widest">class hub student support system</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
