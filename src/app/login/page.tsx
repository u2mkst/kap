
"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { BookOpen, Loader2, Phone, ShieldCheck, ArrowRight, Lock, KeyRound, Zap } from "lucide-react"
import { useAuth, useUser, useFirestore } from "@/firebase"
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  signInWithEmailAndPassword
} from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login"

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password')
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [timer, setTimer] = useState(0)
  
  const auth = useAuth()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const router = useRouter()
  
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null)
  const confirmationResult = useRef<ConfirmationResult | null>(null)

  useEffect(() => {
    if (!isUserLoading && user && !user.isAnonymous) {
      router.push("/dashboard")
    }
  }, [user, isUserLoading, router])

  useEffect(() => {
    let interval: any
    if (timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000)
    }
    return () => clearInterval(interval)
  }, [timer])

  const setupRecaptcha = () => {
    if (!recaptchaVerifier.current) {
      recaptchaVerifier.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
    }
  }

  const formatRawPhone = (val: string) => val.replace(/\D/g, '')

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (phoneNumber.length < 10 || !password) return

    setIsLoading(true)
    try {
      const raw = formatRawPhone(phoneNumber)
      const email = `82${raw.startsWith('0') ? raw.substring(1) : raw}@kst-hub.com`
      await signInWithEmailAndPassword(auth, email, password)
      toast({ title: "로그인 성공", description: "반갑습니다!" })
      router.push("/dashboard")
    } catch (error: any) {
      console.error(error)
      toast({ variant: "destructive", title: "로그인 실패", description: "번호 또는 비밀번호를 확인해 주세요." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendCode = async () => {
    if (!phoneNumber.startsWith('010') || phoneNumber.length < 10) {
      toast({ variant: "destructive", title: "번호 오류", description: "올바른 휴대폰 번호를 입력하세요." })
      return
    }

    setIsLoading(true)
    try {
      setupRecaptcha()
      const raw = formatRawPhone(phoneNumber)
      const formatted = `+82${raw.substring(1)}`
      const result = await signInWithPhoneNumber(auth, formatted, recaptchaVerifier.current!)
      confirmationResult.current = result
      setIsCodeSent(true)
      setTimer(60)
      toast({ title: "인증번호 전송", description: "휴대폰으로 전송된 6자리 번호를 입력하세요." })
    } catch (error: any) {
      console.error(error)
      toast({ variant: "destructive", title: "전송 실패", description: "잠시 후 다시 시도해 주세요." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (verificationCode.length !== 6) return

    setIsLoading(true)
    try {
      const result = await confirmationResult.current?.confirm(verificationCode)
      if (result?.user) {
        const userDoc = await getDoc(doc(db, "users", result.user.uid))
        if (!userDoc.exists()) {
          toast({ title: "환영합니다!", description: "초기 정보를 등록해 주세요." })
          router.push("/signup")
        } else {
          toast({ title: "로그인 성공", description: "반갑습니다!" })
          router.push("/dashboard")
        }
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "인증 실패", description: "인증번호가 틀렸거나 만료되었습니다." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuestLogin = () => {
    initiateAnonymousSignIn(auth)
    toast({ title: "게스트 모드", description: "강화 게임 체험을 시작합니다." })
    router.push("/games/sword")
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
      <div id="recaptcha-container"></div>
      <Card className="w-full max-w-md border-none shadow-xl bg-card rounded-[2.5rem] overflow-hidden">
        <CardHeader className="text-center p-8 bg-primary/5 border-b border-primary/5">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Phone className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-black font-headline text-primary tracking-tight">KST HUB 로그인</CardTitle>
          <CardDescription className="text-xs font-bold opacity-60">
            {loginMode === 'password' ? '휴대폰 번호와 비밀번호로 로그인하세요.' : '인증번호를 통해 안전하게 로그인하세요.'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-8 space-y-6">
          {loginMode === 'password' ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-black text-muted-foreground ml-1">휴대폰 번호</Label>
                <Input 
                  id="phone" 
                  placeholder="01012345678" 
                  type="tel"
                  className="h-12 rounded-2xl bg-muted/30 border-none focus-visible:ring-primary px-5 font-bold" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pass" className="text-xs font-black text-muted-foreground ml-1">비밀번호</Label>
                <Input 
                  id="pass" 
                  placeholder="비밀번호 입력" 
                  type="password"
                  className="h-12 rounded-2xl bg-muted/30 border-none focus-visible:ring-primary px-5 font-bold" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button className="w-full h-12 rounded-2xl font-black bg-primary shadow-md" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "로그인"}
              </Button>
              <div className="flex flex-col gap-2">
                <Button 
                  type="button"
                  variant="ghost" 
                  className="w-full text-xs font-bold opacity-60 h-8" 
                  onClick={() => setLoginMode('otp')}
                >
                  비밀번호를 모르시나요? 인증번호로 로그인
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full text-xs font-black border-accent/30 text-accent-foreground h-10 rounded-xl" 
                  onClick={handleGuestLogin}
                >
                  <Zap className="h-3 w-3 mr-2 text-accent" /> 게스트로 바로 체험하기
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-300">
              {!isCodeSent ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-muted-foreground ml-1">휴대폰 번호</Label>
                    <Input 
                      placeholder="01012345678" 
                      className="h-12 rounded-2xl bg-muted/30 border-none px-5 font-bold" 
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                  <Button className="w-full h-12 rounded-2xl font-black bg-primary" onClick={handleSendCode} disabled={isLoading || phoneNumber.length < 10}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "인증번호 받기"}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-muted-foreground ml-1">인증코드 6자리</Label>
                    <div className="relative">
                      <Input 
                        placeholder="000000" 
                        className="h-12 rounded-2xl bg-muted/30 border-none px-5 font-mono text-center tracking-[1em] text-lg font-black" 
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.substring(0, 6))}
                        required
                      />
                      {timer > 0 && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded-full">
                          {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button className="w-full h-12 rounded-2xl font-black bg-primary shadow-md" disabled={isLoading || verificationCode.length !== 6}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "인증 및 로그인"}
                  </Button>
                </form>
              )}
              <Button 
                type="button"
                variant="ghost" 
                className="w-full text-xs font-bold opacity-60" 
                onClick={() => { setLoginMode('password'); setIsCodeSent(false); }}
              >
                비밀번호 로그인으로 돌아가기
              </Button>
            </div>
          )}
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
