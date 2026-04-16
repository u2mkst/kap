
"use client"

import { useState } from "react"
import { MessageCircle, Send, Loader2, MessageSquarePlus } from "lucide-react"
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { collection, addDoc, serverTimestamp, doc, query, where, updateDoc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"

export function FloatingInquiry() {
  const { user } = useUser()
  const db = useFirestore()
  const [isSending, setIsSending] = useState(false)
  const [open, setOpen] = useState(false)

  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")

  const userDocRef = useMemoFirebase(() => {
    if (!user?.uid) return null
    return doc(db, "users", user.uid)
  }, [user?.uid, db])
  const { data: userData } = useDoc(userDocRef)

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
      setOpen(false)
    } catch (error) {
      console.error(error)
      toast({ variant: "destructive", title: "전송 실패", description: "잠시 후 다시 시도해 주세요." })
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
        <DialogContent className="max-w-[90%] rounded-[2.5rem] sm:max-w-md bg-card border-none overflow-hidden max-h-[85vh] p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-black text-xl text-primary tracking-tight">1:1 문의하기</DialogTitle>
            <DialogDescription className="text-xs font-bold opacity-60">궁금한 점이나 필요한 지원을 요청하세요.</DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto mt-6 custom-scrollbar space-y-6">
            {unreadReplies && unreadReplies.length > 0 && (
              <div className="space-y-3 p-4 bg-primary/5 rounded-2xl border border-primary/20">
                <Label className="text-[10px] font-black text-primary uppercase">🔔 새로운 답변 도착</Label>
                {unreadReplies.map((reply) => (
                  <div key={reply.id} className="space-y-2">
                    <p className="text-xs font-bold">Q: {reply.subject}</p>
                    <p className="text-[11px] opacity-70 italic">"{reply.reply}"</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-full text-[10px] font-black text-primary"
                      onClick={() => handleMarkAsRead(reply.id)}
                    >
                      확인했습니다
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-black text-muted-foreground ml-1">문의 제목</Label>
                <Input 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)} 
                  placeholder="제목을 입력하세요." 
                  className="rounded-2xl bg-muted/30 border-none h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-black text-muted-foreground ml-1">상세 내용</Label>
                <Textarea 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                  placeholder="내용을 자세히 입력하세요." 
                  className="rounded-2xl bg-muted/30 border-none min-h-[120px]"
                />
              </div>
              <Button 
                onClick={handleSendInquiry} 
                disabled={isSending || !subject.trim() || !message.trim()}
                className="w-full rounded-2xl h-12 font-black bg-primary text-white"
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-2" /> 보내기</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
