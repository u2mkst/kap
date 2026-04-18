"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { BookOpen, Loader2, ArrowRight, Zap, Mail } from "lucide-react"
import { useAuth, useUser, useFirestore } from "@/firebase"
import { doc, getDoc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { initiateAnonymousSignIn, initiateGoogleSignIn, initiateNaverSignIn } from "@/firebase/non-blocking-login"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const auth = useAuth()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      if (!isUserLoading && user && !user.isAnonymous) {
        setIsLoading(true)
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid))
          if (!userDoc.exists()) {
            router.push("/signup")
          } else {
            router.push("/dashboard")
          }
        } finally {
          setIsLoading(false)
        }
      }
    }
    checkUserAndRedirect()
  }, [user, isUserLoading, router, db])

  const handleGoogleLogin = async () => {
    if (isLoading) return
    setIsLoading(true)
    try {
      await initiateGoogleSignIn(auth)
    } catch (error) {
      // initiateGoogleSignIn 내부에서 toast 처리됨
    } finally {
      setIsLoading(false)
    }
  }

  const handleNaverLogin = async () => {
    if (isLoading) return
    setIsLoading(true)
    try {
      await initiateNaverSignIn(auth)
    } catch (error) {
      // initiateNaverSignIn 내부에서 toast 처리됨
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuestLogin = async () => {
    setIsLoading(true)
    try {
      await initiateAnonymousSignIn(auth)
      toast({ title: "게스트 모드", description: "강화 게임 체험을 시작합니다." })
      router.push("/games/sword")
    } catch (error) {
      // error handled in helper
    } finally {
      setIsLoading(false)
    }
  }

  if (isUserLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="flex flex-col items-center gap-8 relative z-10">
          <div className="relative h-24 w-24 rounded-[2rem] bg-card border border-primary/10 flex items-center justify-center shadow-2xl animate-pulse">
            <BookOpen className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-xl font-black animate-shimmer-text">KST HUB Loading...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border-none shadow-xl bg-card rounded-[2.5rem] overflow-hidden">
        <CardHeader className="text-center p-8 bg-primary/5 border-b border-primary/5">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Mail className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-black font-headline text-primary tracking-tight">KST HUB 로그인</CardTitle>
          <CardDescription className="text-xs font-bold opacity-60">
            소셜 계정으로 간편하게 시작하세요.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-8 space-y-4">
          <Button 
            onClick={handleGoogleLogin} 
            disabled={isLoading}
            className="w-full h-14 rounded-2xl font-black bg-white text-black border-2 border-gray-100 hover:bg-gray-50 shadow-sm flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="20" height="24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c1.61-1.48 2.53-3.66 2.53-6.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
                Google로 로그인
              </>
            )}
          </Button>

          <Button 
            onClick={handleNaverLogin} 
            disabled={isLoading}
            className="w-full h-14 rounded-2xl font-black bg-[#03C75A] text-white hover:bg-[#02b350] shadow-sm flex items-center justify-center gap-3 border-none"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span className="text-xl font-bold">N</span>
                네이버로 로그인
              </>
            )}
          </Button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200"></span></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground font-bold">또는</span></div>
          </div>

          <Button 
            variant="outline" 
            className="w-full h-12 rounded-xl font-black border-accent/30 text-accent-foreground" 
            onClick={handleGuestLogin}
            disabled={isLoading}
          >
            <Zap className="h-4 w-4 mr-2 text-accent" /> 게스트로 체험하기 (500P)
          </Button>
        </CardContent>

        <CardFooter className="bg-muted/10 p-6 flex flex-col space-y-4 text-center border-t border-border/50">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground">
            <p>계정이 없으신가요?</p>
            <Link href="/signup" className="text-primary font-black hover:underline flex items-center">
              회원가입 <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
