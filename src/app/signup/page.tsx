
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { School, Loader2, UserCircle, Users, Mail, Search, CheckCircle2 } from "lucide-react"
import { useAuth, useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { doc, setDoc, serverTimestamp, collection, getDoc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { searchSchool } from "@/lib/neis-api"
import { initiateGoogleSignIn } from "@/firebase/non-blocking-login"

export default function SignupPage() {
  const { user, isUserLoading } = useUser()
  const [nickname, setNickname] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [schoolType, setSchoolType] = useState("")
  const [schoolName, setSchoolName] = useState("")
  const [officeCode, setOfficeCode] = useState("")
  const [schoolCode, setSchoolCode] = useState("")
  const [grade, setGrade] = useState("")
  const [classNum, setClassNum] = useState("")
  const [teacherId, setTeacherId] = useState("")
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false)
  
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [schoolResults, setSchoolResults] = useState<any[]>([])

  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()

  const teachersRef = useMemoFirebase(() => collection(db, "teachers"), [db])
  const { data: teachers } = useCollection(teachersRef)

  useEffect(() => {
    const checkExisting = async () => {
      if (user && !user.isAnonymous) {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          router.push("/dashboard")
        }
      }
    }
    checkExisting()
  }, [user, db, router])

  const handleSchoolSearch = async (query: string) => {
    if (query.length < 2) {
      setSchoolResults([])
      return
    }
    setIsSearching(true)
    try {
      const results = await searchSchool(query)
      setSchoolResults(results || [])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || user.isAnonymous) {
      toast({ variant: "destructive", title: "인증 필요", description: "소셜 로그인을 먼저 완료해 주세요." })
      return
    }
    if (!agreedToPrivacy) return

    setIsLoading(true)
    try {
      await setDoc(doc(db, "users", user.uid), {
        id: user.uid,
        email: user.email,
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

      toast({ title: "회원가입 완료!", description: "KST HUB에 오신 것을 환영합니다." })
      router.push("/dashboard")
    } catch (error: any) {
      console.error(error)
      toast({ variant: "destructive", title: "가입 실패", description: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  if (!user || user.isAnonymous) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md border-none shadow-xl bg-card rounded-[2.5rem] p-8 text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UserCircle className="h-10 w-10" />
          </div>
          <CardTitle className="text-2xl font-black">먼저 인증해 주세요</CardTitle>
          <CardDescription className="font-bold">
            소셜 로그인을 통해 본인 확인 후 정보를 등록할 수 있습니다.
          </CardDescription>
          <Button onClick={() => initiateGoogleSignIn(auth)} className="w-full h-12 rounded-2xl font-black bg-primary">
            Google 계정으로 시작하기
          </Button>
          <p className="text-xs font-bold text-muted-foreground">
            이미 계정이 있으신가요? <Link href="/login" className="text-primary hover:underline">로그인</Link>
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border-none shadow-xl bg-card rounded-[2.5rem] overflow-hidden">
        <CardHeader className="text-center pb-2 bg-primary/5">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UserCircle className="h-10 w-10" />
          </div>
          <CardTitle className="text-2xl font-black font-headline text-primary">학생 정보 등록</CardTitle>
          <CardDescription className="text-xs font-bold opacity-60">나머지 정보를 입력하면 가입이 완료됩니다.</CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto px-6 py-6 custom-scrollbar">
            <div className="p-4 bg-green-50 rounded-2xl border border-green-100 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div className="text-[11px] font-bold text-green-700">
                인증 완료: <span className="font-black">{user.email}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black opacity-50 ml-1">성</Label>
                <Input placeholder="김" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="rounded-xl h-10 bg-muted/10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black opacity-50 ml-1">이름</Label>
                <Input placeholder="지우" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="rounded-xl h-10 bg-muted/10" />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black opacity-50 ml-1">닉네임 (게임 등에 사용)</Label>
              <Input placeholder="멋진학생" value={nickname} onChange={(e) => setNickname(e.target.value)} required className="rounded-xl h-10 bg-muted/10" />
            </div>

            <div className="pt-2 border-t">
              <h3 className="text-xs font-black mb-3 flex items-center gap-2 text-primary"><Users className="h-4 w-4" /> 담당 선생님</h3>
              <Select onValueChange={setTeacherId} required>
                <SelectTrigger className="w-full h-10 rounded-xl bg-muted/10">
                  <SelectValue placeholder="선생님 선택" />
                </SelectTrigger>
                <SelectContent>
                  {teachers?.map((t) => <SelectItem key={t.id} value={t.id}>{t.name} 선생님</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-2 border-t">
              <h3 className="text-xs font-black mb-3 flex items-center gap-2 text-primary"><School className="h-4 w-4" /> 학교 정보</h3>
              <div className="space-y-3">
                <Select onValueChange={setSchoolType} required>
                  <SelectTrigger className="w-full rounded-xl bg-muted/10"><SelectValue placeholder="학교 종류" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="초등학교">초등학교</SelectItem>
                    <SelectItem value="중학교">중학교</SelectItem>
                    <SelectItem value="고등학교">고등학교</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Input 
                    placeholder="학교 이름 검색" 
                    onChange={(e) => handleSchoolSearch(e.target.value)} 
                    required 
                    className="rounded-xl h-10 bg-muted/10 pr-10" 
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {isSearching ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                  </div>
                  {schoolResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-card border rounded-xl shadow-lg max-h-40 overflow-y-auto">
                      {schoolResults.map((s, i) => (
                        <div 
                          key={i} 
                          className="p-3 text-xs font-bold hover:bg-muted cursor-pointer border-b"
                          onClick={() => {
                            setSchoolName(s.SCHUL_NM)
                            setOfficeCode(s.ATPT_OFCDC_SC_CODE)
                            setSchoolCode(s.SD_SCHUL_CODE)
                            setSchoolResults([])
                          }}
                        >
                          {s.SCHUL_NM} <span className="text-[10px] opacity-50">({s.LCTN_SC_NM})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="학년" value={grade} onChange={(e) => setGrade(e.target.value)} required className="rounded-xl h-10 bg-muted/10" />
                  <Input placeholder="반" value={classNum} onChange={(e) => setClassNum(e.target.value)} required className="rounded-xl h-10 bg-muted/10" />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t flex items-center gap-3">
              <Checkbox 
                id="privacy-signup" 
                checked={agreedToPrivacy} 
                onCheckedChange={(checked) => setAgreedToPrivacy(!!checked)}
              />
              <Label htmlFor="privacy-signup" className="text-[11px] font-black cursor-pointer text-muted-foreground">
                [필수] 개인정보 수집 및 이용 동의
              </Label>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4 p-6 pt-2">
            <Button className="w-full h-12 font-black bg-primary rounded-2xl shadow-md" disabled={isLoading || !agreedToPrivacy}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "KST HUB 가입 완료"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
