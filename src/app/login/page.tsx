
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { BookOpen, Loader2 } from "lucide-react"
import { useAuth, useUser } from "@/firebase"
import { signInWithEmailAndPassword } from "firebase/auth"
import { toast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const auth = useAuth()
  const { user, isUserLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push("/dashboard")
    }
  }, [user, isUserLoading, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.toLowerCase().startsWith("ufes")) {
      toast({
        variant: "destructive",
        title: "아이디 형식이 잘못되었습니다.",
        description: "학원 아이디는 'ufes'로 시작해야 합니다.",
      })
      return
    }

    setIsLoading(true)
    try {
      const fakeEmail = `${username.toLowerCase()}@classhub.edu`
      await signInWithEmailAndPassword(auth, fakeEmail, password)
      toast({
        title: "로그인 성공",
        description: "반갑습니다!",
      })
      router.push("/dashboard")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "로그인 실패",
        description: "아이디 또는 비밀번호를 확인해주세요.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isUserLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 animate-pulse" />
            <BookOpen className="absolute inset-0 m-auto h-8 w-8 text-primary animate-bounce-slow" />
          </div>
          <p className="text-sm font-black text-primary/60 animate-pulse">KST HUB 로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border-none shadow-xl bg-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <BookOpen className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold font-headline text-foreground">KST HUB 로그인</CardTitle>
          <CardDescription>학원 전용 아이디(ufes)를 사용하세요.</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">학원 아이디</Label>
              <Input 
                id="username" 
                placeholder="ufes1234" 
                className="focus-visible:ring-primary bg-background" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input 
                id="password" 
                type="password" 
                className="focus-visible:ring-primary bg-background" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "로그인"}
            </Button>
          </CardContent>
        </form>
        <CardFooter className="flex flex-col space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            계정이 없으신가요?{" "}
            <Link href="/signup" className="text-primary font-semibold hover:underline">회원가입</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
