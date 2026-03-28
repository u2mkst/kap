
"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { BookOpen, School, Loader2 } from "lucide-react"
import { useAuth, useFirestore } from "@/firebase"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"

export default function SignupPage() {
  const [username, setUsername] = useState("ufes")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [schoolName, setSchoolName] = useState("")
  const [grade, setGrade] = useState("")
  const [classNum, setClassNum] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // ufes 접두사 확인
    if (!username.toLowerCase().startsWith("ufes") || username.length < 5) {
      toast({
        variant: "destructive",
        title: "아이디 형식 오류",
        description: "아이디는 'ufes'로 시작해야 하며 최소 5자 이상이어야 합니다.",
      })
      return
    }

    setIsLoading(true)
    try {
      // 가상 이메일 생성
      const fakeEmail = `${username.toLowerCase()}@classhub.edu`
      const userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, password)
      const user = userCredential.user

      // Firestore에 학생 정보 저장
      await setDoc(doc(db, "users", user.uid), {
        id: user.uid,
        username: username.toLowerCase(),
        firstName,
        lastName,
        schoolName,
        grade,
        classNum,
        points: 1000, // 가입 축하 포인트
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      toast({
        title: "회원가입 성공!",
        description: "클래스 허브에 오신 것을 환영합니다. 1,000P가 지급되었습니다!",
      })
      router.push("/dashboard")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "회원가입 실패",
        description: error.message || "오류가 발생했습니다. 이미 존재하는 아이디일 수 있습니다.",
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
          <CardTitle className="text-2xl font-bold font-headline">학생 회원가입</CardTitle>
          <CardDescription>학원 아이디(ufes)와 학교 정보를 입력하세요.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4 max-h-[65vh] overflow-y-auto px-6 py-2 custom-scrollbar">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="last-name">성</Label>
                <Input id="last-name" placeholder="김" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="first-name">이름</Label>
                <Input id="first-name" placeholder="지우" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username">학원 아이디 (ufes)</Label>
              <Input id="username" placeholder="ufes1234" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                <School className="h-4 w-4" /> 학교 정보
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>학교 이름</Label>
                  <Input placeholder="예: 서울중학교" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>학년</Label>
                    <Input placeholder="1" value={grade} onChange={(e) => setGrade(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>반</Label>
                    <Input placeholder="3" value={classNum} onChange={(e) => setClassNum(e.target.value)} required />
                  </div>
                </div>
              </div>
            </div>

            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 mt-6" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "계정 생성하기"}
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
