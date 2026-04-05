
"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Sprout, Gamepad2, MessageSquarePlus, Send, Loader2, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
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
import { collection, addDoc, serverTimestamp, doc, query, where, updateDoc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"

export function BottomNav() {
  const pathname = usePathname()
  const { user } = useUser()
  const db = useFirestore()
  const [isSending, setIsSending] = useState(false)
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [open, setOpen] = useState(false)

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

  const items = [
    { name: "홈", href: "/dashboard", icon: Home },
    { name: "정원", href: "/plants", icon: Sprout },
    { name: "라운지", href: "/lounge", icon: Gamepad2 },
  ]

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
      <div className="bg-card/90 backdrop-blur-md border shadow-2xl rounded-full h-14 flex items-center justify-around px-4">
        {items.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href} className={cn(
              "flex flex-col items-center justify-center gap-0.5 transition-all",
              isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-primary"
            )}>
              <item.icon className="h-5 w-5" />
              <span className="text-[9px] font-black">{item.name}</span>
            </Link>
          )
        })}

        <div className="h-8 w-px bg-muted mx-1" />

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="relative flex flex-col items-center justify-center gap-0.5 text-accent hover:text-accent/80 transition-all">
              <MessageSquarePlus className="h-5 w-5" />
              <span className="text-[9px] font-black">문의</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-black text-white animate-bounce shadow-md">
                  {unreadCount}
                </span>
              )}
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-[90%] rounded-[2rem] sm:max-w-md bg-card border-none overflow-hidden max-h-[85vh]">
            <DialogHeader className="pt-2">
              <DialogTitle className="font-black flex items-center gap-2 text-primary">
                <MessageSquarePlus className="h-5 w-5" /> 선생님께 문의하기
              </DialogTitle>
              <DialogDescription className="text-xs font-medium">
                궁금한 점이나 건의사항을 자유롭게 적어주세요.
              </DialogDescription>
            </DialogHeader>

            <div className="overflow-y-auto pr-1 space-y-4 py-4 max-h-[60vh]">
              {/* 안 읽은 답변 목록 */}
              {unreadReplies && unreadReplies.length > 0 && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
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
                <div className="space-y-2">
                  <Label className="text-xs font-bold ml-1">제목</Label>
                  <Input 
                    value={subject} 
                    onChange={(e) => setSubject(e.target.value)} 
                    placeholder="간단한 제목" 
                    className="rounded-2xl bg-muted/20 border-none h-11 focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold ml-1">내용</Label>
                  <Textarea 
                    value={message} 
                    onChange={(e) => setMessage(e.target.value)} 
                    placeholder="상세한 내용을 입력해 주세요." 
                    className="rounded-2xl bg-muted/20 border-none min-h-[100px] resize-none focus-visible:ring-primary"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pb-2">
              <Button 
                onClick={handleSendInquiry} 
                disabled={isSending || !subject.trim() || !message.trim()}
                className="w-full rounded-2xl h-12 font-black bg-primary text-white shadow-md active:scale-95 transition-transform"
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-2" /> 보내기</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
