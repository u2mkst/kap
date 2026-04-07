
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, School, Loader2, UserCircle, Users, GraduationCap, Lock, Search } from "lucide-react"
import { useAuth, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, serverTimestamp, collection } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { searchSchool } from "@/lib/neis-api"

export default function SignupPage() {
  const [username, setUsername] = useState("ufes")
  const [nickname, setNickname] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [schoolType, setSchoolType] = useState("")
  const [schoolName, setSchoolName] = useState("")
  const [officeCode, setOfficeCode] = useState("")
  const [schoolCode, setSchoolCode] = useState("")
  const [grade, setGrade] = useState("")
  const [classNum, setClassNum] = useState("")
  const [teacherId, setTeacherId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  const [schoolSearchQuery, setSchoolSearchQuery] = useState("")
  const [schoolResults, setSchoolResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()

  const teachersRef = useMemoFirebase(() => collection(db, "teachers"), [db])
  const { data: teachers } = useCollection(teachersRef)

  const handleSchoolSearch = async (query: string) => {
    setSchoolSearchQuery(query)
    if (query.length < 2) {
      setSchoolResults([])
      return
    }
    setIsSearching(true)
    try {
      const results = await searchSchool(query)
      setSchoolResults(results || [])
    } catch (e) {
      console.error(e)
    } finally {
      setIsSearching(false)
    }
  }

  const selectSchool = (s: any) => {
    setSchoolName(s.SCHUL_NM)
    setOfficeCode(s.ATPT_OFCDC_SC_CODE)
    setSchoolCode(s.SD_SCHUL_CODE)
    setSchoolSearchQuery(s.SCHUL_NM)
    setSchoolResults([])
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.toLowerCase().startsWith("ufes") || username.length < 5) {
      toast({ variant: "destructive", title: "아이디 형식 오류", description: "아이디는 'ufes'로 시작해야 합니다." })
      return
    }

    if (password.length < 6) {
      toast({ variant: "destructive", title: "비밀번호 오류", description: "최소 6자 이상이어야 합니다." })
      return
    }

    if (!schoolCode) {
      toast({ variant: "destructive", title: "학교 선택 필수", description: "검색을 통해 학교를 선택해 주세요." })
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
        officeCode,
        schoolCode,
        grade,
        classNum,
        teacherId,
        points: 1000,
        hasCompletedTutorial: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      toast({ title: "회원가입 성공!", description: "환영합니다!" })
      router.push("/dashboard")
    } catch (error: any) {
      toast({ variant: "destructive", title: "회원가입 실패", description: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border-none shadow-xl bg-card rounded-[2rem] overflow-hidden">
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
                <Label className="text-xs font-bold ml-1">성</Label>
                <Input placeholder="김" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="rounded-xl h-10 bg-muted/20 border-none" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold ml-1">이름</Label>
                <Input placeholder="지우" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="rounded-xl h-10 bg-muted/20 border-none" />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs font-bold ml-1">라운지 닉네임</Label>
              <Input placeholder="멋진학생" value={nickname} onChange={(e) => setNickname(e.target.value)} required className="rounded-xl h-10 bg-muted/20 border-none" />
            </div>

            <div className="space-y-1.5 pt-2 border-t">
              <Label className="text-xs font-bold ml-1">학원 아이디 (ufes로 시작)</Label>
              <Input placeholder="ufes1234" value={username} onChange={(e) => setUsername(e.target.value)} required className="rounded-xl h-10 bg-muted/20 border-none" />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs font-bold flex items-center gap-1"><Lock className="h-3 w-3" /> 비밀번호</Label>
              <Input type="password" placeholder="••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="rounded-xl h-10 bg-muted/20 border-none" />
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-xs font-black mb-3 flex items-center gap-2 text-primary"><Users className="h-4 w-4" /> 담당 선생님 선택</h3>
              <Select onValueChange={setTeacherId} required>
                <SelectTrigger className="w-full h-10 rounded-xl bg-muted/20 border-none">
                  <SelectValue placeholder="담당 선생님을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {teachers?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name} 선생님</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-xs font-black mb-3 flex items-center gap-2 text-primary"><School className="h-4 w-4" /> 학교 정보</h3>
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
                <div className="space-y-1.5 relative">
                  <Label className="text-xs font-bold ml-1">학교 이름 검색</Label>
                  <div className="relative">
                    <Input 
                      placeholder="학교 이름을 입력하세요" 
                      value={schoolSearchQuery} 
                      onChange={(e) => handleSchoolSearch(e.target.value)} 
                      required 
                      className="rounded-xl h-10 bg-muted/20 border-none pr-10" 
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </div>
                  </div>
                  {schoolResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-card border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {schoolResults.map((s, i) => (
                        <div 
                          key={i} 
                          className="p-3 text-xs font-bold hover:bg-muted cursor-pointer border-b last:border-none"
                          onClick={() => selectSchool(s)}
                        >
                          {s.SCHUL_NM} <span className="text-[10px] font-medium opacity-50">({s.LCTN_SC_NM})</span>
                        </div>
                      ))}
                    </div>
                  )}
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
            <Button className="w-full h-12 font-black bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-md" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "KST HUB 시작하기"}
            </Button>
            <p className="text-xs font-bold text-muted-foreground">
              이미 계정이 있으신가요? <Link href="/login" className="text-primary hover:underline">로그인</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
