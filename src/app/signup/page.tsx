
"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Phone, School, Loader2, UserCircle, Users, GraduationCap, Lock, Search, ShieldCheck, CheckCircle2 } from "lucide-react"
import { useAuth, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth"
import { doc, setDoc, serverTimestamp, collection, getDoc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { searchSchool } from "@/lib/neis-api"

export default function SignupPage() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [isVerified, setIsVerified] = useState(false)
  const [isCodeSent, setIsCodeSent] = useState(false)
  
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
  
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null)
  const confirmationResult = useRef<ConfirmationResult | null>(null)
  const [verifiedUid, setVerifiedUid] = useState<string | null>(null)

  const teachersRef = useMemoFirebase(() => collection(db, "teachers"), [db])
  const { data: teachers } = useCollection(teachersRef)

  const setupRecaptcha = () => {
    if (!recaptchaVerifier.current) {
      recaptchaVerifier.current = new RecaptchaVerifier(auth, 'recaptcha-container-signup', {
        size: 'invisible',
      });
    }
  }

  const handleSendCode = async () => {
    if (!phoneNumber.startsWith('010') || phoneNumber.length < 10) return
    setIsLoading(true)
    try {
      setupRecaptcha()
      const formatted = `+82${phoneNumber.substring(1)}`
      const result = await signInWithPhoneNumber(auth, formatted, recaptchaVerifier.current!)
      confirmationResult.current = result
      setIsCodeSent(true)
      toast({ title: "인증번호 전송 완료" })
    } catch (error) {
      console.error(error)
      toast({ variant: "destructive", title: "전송 실패" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) return
    setIsLoading(true)
    try {
      const result = await confirmationResult.current?.confirm(verificationCode)
      if (result?.user) {
        setVerifiedUid(result.user.uid)
        setIsVerified(true)
        toast({ title: "본인 인증 성공" })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "인증 실패" })
    } finally {
      setIsLoading(false)
    }
  }

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
    if (!isVerified || !verifiedUid) {
      toast({ variant: "destructive", title: "인증 필요", description: "휴대폰 인증을 먼저 완료해 주세요." })
      return
    }
    if (!agreedToPrivacy) return

    setIsLoading(true)
    try {
      await setDoc(doc(db, "users", verifiedUid), {
        id: verifiedUid,
        phoneNumber: `+82${phoneNumber.substring(1)}`,
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
      toast({ variant: "destructive", title: "가입 실패", description: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4 bg-background">
      <div id="recaptcha-container-signup"></div>
      <Card className="w-full max-w-md border-none shadow-xl bg-card rounded-[2.5rem] overflow-hidden">
        <CardHeader className="text-center pb-2 bg-primary/5">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UserCircle className="h-10 w-10" />
          </div>
          <CardTitle className="text-2xl font-black font-headline text-primary">학생 회원가입</CardTitle>
          <CardDescription className="text-xs font-bold opacity-60">새로운 스마트 교육 생활의 시작!</CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto px-6 py-6 custom-scrollbar">
            {/* 휴대폰 인증 섹션 */}
            <div className="space-y-3 p-4 bg-muted/20 rounded-3xl border border-dashed border-primary/20">
              <h3 className="text-xs font-black flex items-center gap-2 text-primary"><Phone className="h-4 w-4" /> 본인 인증</h3>
              <div className="flex gap-2">
                <Input 
                  placeholder="01012345678" 
                  value={phoneNumber} 
                  onChange={(e) => setPhoneNumber(e.target.value)} 
                  disabled={isVerified}
                  className="rounded-xl h-10 bg-background border-none"
                />
                <Button 
                  type="button" 
                  onClick={handleSendCode} 
                  disabled={isLoading || isVerified || phoneNumber.length < 10}
                  className="shrink-0 rounded-xl h-10 px-4 text-xs font-black"
                >
                  {isCodeSent ? "재전송" : "전송"}
                </Button>
              </div>
              {isCodeSent && !isVerified && (
                <div className="flex gap-2 animate-in slide-in-from-top-2">
                  <Input 
                    placeholder="인증번호" 
                    value={verificationCode} 
                    onChange={(e) => setVerificationCode(e.target.value)} 
                    className="rounded-xl h-10 bg-background border-none"
                  />
                  <Button 
                    type="button" 
                    onClick={handleVerifyCode} 
                    disabled={isLoading}
                    className="shrink-0 rounded-xl h-10 px-4 text-xs font-black bg-accent text-accent-foreground"
                  >
                    확인
                  </Button>
                </div>
              )}
              {isVerified && (
                <div className="flex items-center gap-2 text-xs font-black text-green-600 bg-green-50 p-2 rounded-xl">
                  <CheckCircle2 className="h-4 w-4" /> 인증이 완료되었습니다.
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
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
              <Label className="text-[10px] font-black opacity-50 ml-1">닉네임</Label>
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
            <Button className="w-full h-12 font-black bg-primary rounded-2xl shadow-md" disabled={isLoading || !isVerified || !agreedToPrivacy}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "KST HUB 가입하기"}
            </Button>
            <p className="text-xs font-bold text-muted-foreground text-center">
              이미 계정이 있으신가요? <Link href="/login" className="text-primary hover:underline">로그인</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
