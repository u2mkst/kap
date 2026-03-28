
"use client"

import { useState, useMemo, useEffect } from "react"
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase"
import { collection, doc, updateDoc, increment, query, orderBy } from "firebase/firestore"
import { Loader2, Moon, Share2, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function LoungePage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const [isDarkMode, setIsDarkMode] = useState(false)

  // 선생님 목록 쿼리 (득표순 정렬)
  const teachersQuery = useMemoFirebase(() => {
    return query(collection(db, "teachers"), orderBy("vote", "desc"))
  }, [db])

  const { data: teachers, isLoading: isTeachersLoading } = useCollection(teachersQuery)

  // 공지사항 데이터
  const configRef = useMemoFirebase(() => doc(db, "metadata", "config"), [db])
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
        description: "권한이 없거나 오류가 발생했습니다."
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

  if (isUserLoading || isTeachersLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2]">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className={cn(
      "min-h-[calc(100vh-64px)] transition-colors duration-500 flex items-center justify-center p-4",
      isDarkMode ? "bg-[#111]" : "bg-gradient-to-br from-[#667eea] to-[#764ba2]"
    )}>
      <div className={cn(
        "w-full max-w-[420px] backdrop-blur-xl rounded-[28px] p-6 shadow-2xl transition-all",
        isDarkMode ? "bg-[#1e1e1e] text-white" : "bg-black/40 text-white"
      )}>
        
        <h1 className="text-3xl font-black text-center mb-6 cursor-pointer flex items-center justify-center gap-2">
          🔥 선생님 인기 투표
        </h1>

        {configData?.notice && (
          <div className="bg-white/15 p-3 rounded-xl mb-6 text-center text-sm font-medium animate-pulse">
            {configData.notice}
          </div>
        )}

        <div className="space-y-3">
          {teachers?.map((teacher, index) => {
            let medal = (index + 1).toString()
            if (index === 0) medal = "🥇"
            else if (index === 1) medal = "🥈"
            else if (index === 2) medal = "🥉"

            return (
              <div
                key={teacher.id}
                onClick={() => handleVote(teacher.id, teacher.name)}
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm",
                  isDarkMode ? "bg-[#2b2b2b] text-white" : "bg-white/95 text-black"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold w-8 text-center">{medal}</span>
                  <span className="text-lg font-bold">{teacher.name}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-black opacity-40 uppercase">Votes</span>
                  <span className="text-xl font-black">{teacher.vote.toLocaleString()}</span>
                </div>
              </div>
            )
          })}

          {(!teachers || teachers.length === 0) && (
            <div className="text-center py-12 opacity-50">
              <Trophy className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>아직 후보가 등록되지 않았습니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Buttons */}
      <div className="fixed bottom-8 left-8 flex flex-col gap-4">
        <Button
          onClick={shareVote}
          className="h-14 w-14 rounded-full bg-[#FEE500] hover:bg-[#FEE500]/90 text-black shadow-lg"
          size="icon"
        >
          <Share2 className="h-6 w-6" />
        </Button>
      </div>

      <div className="fixed bottom-8 right-8 flex flex-col gap-4">
        <Button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={cn(
            "h-14 w-14 rounded-full shadow-lg",
            isDarkMode ? "bg-white text-black hover:bg-white/90" : "bg-[#222] text-white hover:bg-[#222]/90"
          )}
          size="icon"
        >
          <Moon className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}
