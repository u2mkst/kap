
"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { BookOpen } from "lucide-react"
import { useAuth, useFirestore } from "@/firebase"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"

export default function SignupPage() {
  const [username, setUsername] = useState("ufes---")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.startsWith("ufes---") || username.length < 8) {
      toast({
        variant: "destructive",
        title: "아이디 형식 오류",
        description: "아이디는 'ufes---'로 시작하며 충분히 길어야 합니다.",
      })
      return
    }

    setIsLoading(true)
    try {
      const fakeEmail = `${username}@classhub.edu`
      const userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, password)
      const user = userCredential.user

      // Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        id: user.uid,
        username,
        firstName,
        lastName,
        points: 1000, // Initial points for new users
        registeredCourseIds: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      toast({
        title: "회원가입 성공!",
        description: "클래스 허브에 오신 것을 환영합니다.",
      })
      router.push("/dashboard")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "회원가입 실패",
        description: error.message || "오류가 발생했습니다.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border-none shadow-xl bg-white">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <BookOpen className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold font-headline">회원가입</CardTitle>
          <CardDescription>학원 전용 아이디로 가입하세요.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">성</Label>
                <Input 
                  id="last-name" 
                  placeholder="홍" 
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">이름</Label>
                <Input 
                  id="first-name" 
                  placeholder="길동" 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)} 
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">학원 아이디 (ufes---)</Label>
              <Input 
                id="username" 
                placeholder="ufes---" 
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
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 mt-4" disabled={isLoading}>
              {isLoading ? "가입 중..." : "계정 생성하기"}
            </Button>
          </CardContent>
        </form>
        <CardFooter className="text-center">
          <p className="text-sm text-muted-foreground w-full">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">로그인</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
