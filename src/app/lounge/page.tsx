
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase"
import { collection, doc, updateDoc, increment, query, orderBy } from "firebase/firestore"
import { Loader2, Share2, Trophy, Flame } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function LoungePage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()

  const teachersQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "teachers"), orderBy("vote", "desc"))
  }, [db, user])

  const { data: teachers, isLoading: isTeachersLoading } = useCollection(teachersQuery)

  const configRef = useMemoFirebase(() => {
    if (!user) return null
    return doc(db, "metadata", "config")
  }, [db, user])
  const { data: configData } = useDoc(configRef)

  const handleVote = async (teacherId: string, teacherName: string) => {
    if (!user) return
    const teacherRef = doc(db, "teachers", teacherId)
    
    try {
      await updateDoc(teacherRef, {
        vote: increment(1)
      })
      toast({
        title: "투표 완료!",
        description: `${teacherName} 선생님께 소중한 한 표를 드렸습니다.`
      })
    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "투표 실패",
        description: "오류가 발생했습니다."
      })
    }
  }

  const shareVote = () => {
    if (typeof window !== "undefined") {
      const url = window.location.href
      navigator.clipboard.writeText(url)
      toast({
        title: "링크 복사 완료",
        description: "친구들에게 투표를 독려해보세요!"
      })
    }
  }

  if (isUserLoading || (user && isTeachersLoading)) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-background text-foreground p-4 text-center">
        <div className="bg-white p-8 rounded-[28px] shadow-xl max-w-sm w-full animate-in zoom-in-95 duration-500">
          <Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-500 animate-bounce-slow" />
          <h2 className="text-2xl font-black mb-4">선생님 인기 투표</h2>
          <p className="mb-8 opacity-70">로그인한 학생만 투표에 참여할 수 있습니다.</p>
          <Button 
            onClick={() => router.push("/login")} 
            className="bg-primary text-white hover:bg-primary/90 font-black px-10 h-12 rounded-full text-lg w-full active:scale-95 transition-transform"
          >
            로그인 하러가기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background flex items-center justify-center p-4 animate-in fade-in duration-700">
      <div className="w-full max-w-[420px] bg-white rounded-[28px] p-6 shadow-xl border relative overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary"></div>
        
        <div className="flex items-center justify-center gap-2 mb-6 pt-2">
          <Flame className="h-6 w-6 text-orange-500 fill-orange-500 animate-pulse" />
          <h1 className="text-2xl font-black text-center select-none tracking-tight">
            선생님 인기 투표
          </h1>
        </div>

        {configData?.notice && (
          <div className="bg-primary/5 p-4 rounded-xl mb-6 text-center text-sm font-bold text-primary animate-pulse-gentle border border-primary/10">
            📢 {configData.notice}
          </div>
        )}

        <div className="space-y-3">
          {teachers?.map((teacher, index) => {
            let medal: string | number = index + 1
            if (index === 0) medal = "🥇"
            else if (index === 1) medal = "🥈"
            else if (index === 2) medal = "🥉"

            return (
              <div
                key={teacher.id}
                onClick={() => handleVote(teacher.id, teacher.name)}
                className={cn(
                  "group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm border bg-white hover:border-primary/30 animate-in slide-in-from-right-4",
                  `duration-${300 + (index * 100)}`
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold w-10 text-center">{medal}</span>
                  <span className="text-lg font-black tracking-tight group-hover:text-primary transition-colors">{teacher.name}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black opacity-30 uppercase leading-none mb-1">Votes</span>
                  <span className="text-xl font-black leading-none text-primary">{teacher.vote.toLocaleString()}</span>
                </div>
              </div>
            )
          })}

          {(!teachers || teachers.length === 0) && !isTeachersLoading && (
            <div className="text-center py-16 opacity-40 animate-in fade-in duration-700">
              <Trophy className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="font-bold">아직 투표 후보가 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-8 left-8">
        <Button
          onClick={shareVote}
          className="h-14 w-14 rounded-full bg-primary text-white hover:bg-primary/90 shadow-2xl border-none active:scale-90 transition-transform"
          size="icon"
        >
          <Share2 className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}
