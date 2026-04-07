
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, School, Loader2, UserCircle, Users, GraduationCap, Lock } from "lucide-react"
import { useAuth, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, serverTimestamp, collection } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"

export default function SignupPage() {
  const [username, setUsername] = useState("ufes")
  const [nickname, setNickname] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [schoolType, setSchoolType] = useState("")
  const [schoolName, setSchoolName] = useState("")
  const [grade, setGrade] = useState("")
  const [classNum, setClassNum] = useState("")
  const [teacherId, setTeacherId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()

  const teachersRef = useMemoFirebase(() => collection(db, "teachers"), [db])
  const { data: teachers } = useCollection(teachersRef)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 유효성 검사
    if (!username.toLowerCase().startsWith("ufes") || username.length < 5) {
      toast({
        variant: "destructive",
        title: "아이디 형식 오류",
        description: "아이디는 'ufes'로 시작해야 하며 최소 5자 이상이어야 합니다.",
      })
      return
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "비밀번호가 너무 짧아요",
        description: "비밀번호는 최소 6자 이상으로 설정해 주세요.",
      })
      return
    }

    if (nickname.length < 2) {
      toast({
        variant: "destructive",
        title: "닉네임 오류",
        description: "닉네임은 최소 2자 이상이어야 합니다.",
      })
      return
    }

    if (!schoolType) {
      toast({
        variant: "destructive",
        title: "학교급 선택 필수",
        description: "초등, 중등, 고등 중 하나를 선택해 주세요.",
      })
      return
    }

    if (!teacherId) {
      toast({
        variant: "destructive",
        title: "선생님 선택 필수",
        description: "담당 선생님을 선택해 주세요.",
      })
      return
    }

    setIsLoading(true)
    try {
      const fakeEmail = `${username.toLowerCase()}@classhub.edu`
      const userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, password)
      const user = userCredential.user

      await setDoc(doc(db, "users", user.uid), {
        id: user.uid,
        username: username.toLowerCase(),
        nickname,
        firstName,
        lastName,
        schoolType,
        schoolName,
        grade,
        classNum,
        teacherId,
        points: 1000,
        hasCompletedTutorial: false, // 신규 유저 튜토리얼 대상
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      toast({
        title: "회원가입 성공!",
        description: `${nickname}님, 환영합니다! 1,000P가 지급되었습니다.`,
      })
      router.push("/dashboard")
    } catch (error: any) {
      let errorMessage = "회원가입 중 오류가 발생했습니다."
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "이미 사용 중인 아이디입니다."
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "비밀번호가 너무 약합니다. 6자 이상으로 설정해 주세요."
      }

      toast({
        variant: "destructive",
        title: "회원가입 실패",
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UserCircle className="h-10 w-10" />
          </div>
          <CardTitle className="text-2xl font-black font-headline tracking-tight text-primary">학생 회원가입</CardTitle>
          <CardDescription className="text-xs font-bold opacity-60">KST HUB의 새로운 학생이 되어보세요!</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto px-6 py-4 custom-scrollbar">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="last-name" className="text-xs font-bold ml-1">성</Label>
                <Input id="last-name" placeholder="김" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="rounded-xl h-10 bg-muted/20 border-none" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="first-name" className="text-xs font-bold ml-1">이름</Label>
                <Input id="first-name" placeholder="지우" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="rounded-xl h-10 bg-muted/20 border-none" />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="nickname" className="text-xs font-bold ml-1">라운지 닉네임</Label>
              <Input id="nickname" placeholder="멋진학생" value={nickname} onChange={(e) => setNickname(e.target.value)} required className="rounded-xl h-10 bg-muted/20 border-none" />
            </div>

            <div className="space-y-1.5 pt-2 border-t">
              <Label htmlFor="username" className="text-xs font-bold ml-1">학원 아이디 (ufes로 시작)</Label>
              <Input id="username" placeholder="ufes1234" value={username} onChange={(e) => setUsername(e.target.value)} required className="rounded-xl h-10 bg-muted/20 border-none" />
            </div>
            
            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" title="6자 이상 입력 필수" className="text-xs font-bold flex items-center gap-1">
                  <Lock className="h-3 w-3" /> 비밀번호
                </Label>
                <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">최소 6자 이상</span>
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="rounded-xl h-10 bg-muted/20 border-none"
              />
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-xs font-black mb-3 flex items-center gap-2 text-primary">
                <Users className="h-4 w-4" /> 담당 선생님 선택
              </h3>
              <Select onValueChange={setTeacherId} required>
                <SelectTrigger className="w-full h-10 rounded-xl bg-muted/20 border-none">
                  <SelectValue placeholder="담당 선생님을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {teachers?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name} 선생님</SelectItem>
                  ))}
                  {(!teachers || teachers.length === 0) && (
                    <SelectItem value="none" disabled>등록된 선생님이 없습니다.</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-xs font-black mb-3 flex items-center gap-2 text-primary">
                <School className="h-4 w-4" /> 학교 정보
              </h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold ml-1 flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5" /> 학교급</Label>
                  <Select onValueChange={setSchoolType} required>
                    <SelectTrigger className="w-full rounded-xl bg-muted/20 border-none">
                      <SelectValue placeholder="학교 종류 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="초등학교">초등학교</SelectItem>
                      <SelectItem value="중학교">중학교</SelectItem>
                      <SelectItem value="고등학교">고등학교</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold ml-1">학교 이름</Label>
                  <Input placeholder="예: 서울중학교" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} required className="rounded-xl h-10 bg-muted/20 border-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold ml-1">학년</Label>
                    <Input placeholder="1" value={grade} onChange={(e) => setGrade(e.target.value)} required className="rounded-xl h-10 bg-muted/20 border-none" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold ml-1">반</Label>
                    <Input placeholder="3" value={classNum} onChange={(e) => setClassNum(e.target.value)} required className="rounded-xl h-10 bg-muted/20 border-none" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 p-6 pt-2">
            <Button className="w-full h-12 font-black bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-md active:scale-95 transition-transform" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "KST HUB 시작하기"}
            </Button>
            <p className="text-xs font-bold text-muted-foreground">
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="text-primary hover:underline">로그인 하러가기</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
