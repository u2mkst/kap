
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { BookOpen, KeyRound, UserCircle, Sparkles, Zap } from "lucide-react"
import { useUser, useAuth } from "@/firebase"
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login"
import { toast } from "@/hooks/use-toast"

export default function Home() {
  const { user, isUserLoading } = useUser()
  const auth = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isUserLoading && user && !user.isAnonymous) {
      router.push("/dashboard")
    }
  }, [user, isUserLoading, router])

  const handleGuestMode = () => {
    try {
      initiateAnonymousSignIn(auth)
      toast({ title: "체험 모드 시작!", description: "로그인 없이 게임을 즐겨보세요." })
      router.push("/games/sword")
    } catch (e) {
      toast({ variant: "destructive", title: "오류 발생", description: "잠시 후 다시 시도해주세요." })
    }
  }

  if (isUserLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <Card className="w-full max-w-md border-none shadow-2xl bg-white/80 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
        <CardHeader className="text-center p-8">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg transform -rotate-6">
            <BookOpen className="h-10 w-10" />
          </div>
          <CardTitle className="text-3xl font-black font-headline text-primary tracking-tight">KST HUB</CardTitle>
          <CardDescription className="text-sm font-bold mt-2 opacity-70">
            미래를 여는 스마트 교육 플랫폼<br/>학습과 즐거움이 가득한 곳으로 들어오세요!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-8 pb-8">
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 text-primary text-xs flex items-center gap-3 font-bold">
            <UserCircle className="h-5 w-5 shrink-0" />
            <span>오늘도 당신의 성장을 응원합니다!</span>
          </div>
          
          <div className="grid gap-3">
            <Link href="/login" className="w-full">
              <Button className="w-full h-14 text-lg font-black bg-primary hover:bg-primary/90 shadow-md rounded-2xl">
                <KeyRound className="mr-2 h-5 w-5" /> 로그인하여 시작하기
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              onClick={handleGuestMode}
              className="w-full h-14 text-base font-black border-2 border-accent text-accent-foreground hover:bg-accent/5 rounded-2xl"
            >
              <Zap className="mr-2 h-5 w-5 text-accent" /> 게스트로 체험하기 (500P)
            </Button>
          </div>
        </CardContent>
        <CardFooter className="justify-center border-t border-border/50 py-6 bg-muted/20">
          <p className="text-xs font-bold text-muted-foreground">
            아직 회원이 아니신가요?{" "}
            <Link href="/signup" className="text-primary font-black hover:underline">회원가입</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
