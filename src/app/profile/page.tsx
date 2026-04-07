
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { User, School, ChevronLeft, Fingerprint, BadgeCheck, Loader2, Users, GraduationCap, Search, AlertTriangle } from "lucide-react"
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { doc, updateDoc, serverTimestamp, collection, deleteDoc } from "firebase/firestore"
import { deleteUser } from "firebase/auth"
import { toast } from "@/hooks/use-toast"
import { searchSchool } from "@/lib/neis-api"

export default function ProfilePage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const [schoolResults, setSchoolResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null
    return doc(db, "users", user.uid)
  }, [user, db])

  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef)

  const teachersRef = useMemoFirebase(() => collection(db, "teachers"), [db])
  const { data: teachers } = useCollection(teachersRef)

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    nickname: "",
    schoolType: "",
    schoolName: "",
    officeCode: "",
    schoolCode: "",
    grade: "",
    classNum: "",
    teacherId: ""
  })

  useEffect(() => {
    if (userData) {
      setFormData({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        nickname: userData.nickname || "",
        schoolType: userData.schoolType || "",
        schoolName: userData.schoolName || "",
        officeCode: userData.officeCode || "",
        schoolCode: userData.schoolCode || "",
        grade: userData.grade || "",
        classNum: userData.classNum || "",
        teacherId: userData.teacherId || ""
      })
    }
  }, [userData])

  const handleSchoolSearch = async (query: string) => {
    setFormData({...formData, schoolName: query})
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
    setFormData({
      ...formData,
      schoolName: s.SCHUL_NM,
      officeCode: s.ATPT_OFCDC_SC_CODE,
      schoolCode: s.SD_SCHUL_CODE
    })
    setSchoolResults([])
  }

  const handleUpdate = () => {
    if (!user || !userDocRef) return
    setIsLoading(true)
    updateDoc(userDocRef, { ...formData, updatedAt: serverTimestamp() })
      .then(() => toast({ title: "정보 수정 완료" }))
      .finally(() => setIsLoading(false))
  }

  const handleDeleteAccount = async () => {
    if (!user || !userDocRef) return
    setIsDeleting(true)
    try {
      // 1. Firestore 데이터 삭제
      await deleteDoc(userDocRef)
      // 2. Auth 계정 삭제
      await deleteUser(user)
      toast({ title: "회원 탈퇴 완료", description: "그동안 이용해주셔서 감사합니다." })
      router.push("/")
    } catch (e: any) {
      console.error(e)
      if (e.code === 'auth/requires-recent-login') {
        toast({ 
          variant: "destructive", 
          title: "탈퇴 실패", 
          description: "보안을 위해 다시 로그인 후 즉시 탈퇴를 진행해 주세요." 
        })
      } else {
        toast({ 
          variant: "destructive", 
          title: "탈퇴 처리 중 오류", 
          description: "잠시 후 다시 시도해 주세요." 
        })
      }
    } finally {
      setIsDeleting(false)
    }
  }

  if (isUserLoading || isUserDataLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 animate-pulse" />
            <User className="absolute inset-0 m-auto h-8 w-8 text-primary animate-bounce-slow" />
          </div>
          <p className="text-sm font-black text-primary/60 animate-pulse">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl animate-in fade-in duration-500">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6 rounded-full font-bold hover:bg-muted">
        <ChevronLeft className="mr-2 h-4 w-4" /> 뒤로 가기
      </Button>

      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
          <User className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-black font-headline tracking-tight text-primary">마이페이지</h1>
          <p className="text-muted-foreground text-sm font-bold">개인 정보 및 학교 정보를 관리합니다.</p>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-black flex items-center gap-2">
              <User className="h-5 w-5 text-primary" /> 기본 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 opacity-70 text-xs font-bold"><Fingerprint className="h-4 w-4" /> 아이디 (변경 불가)</Label>
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-2xl border border-dashed">
                <span className="font-mono text-sm font-bold text-muted-foreground">{userData?.username}</span>
                <BadgeCheck className="h-4 w-4 text-primary ml-auto" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold ml-1">닉네임</Label>
              <Input value={formData.nickname} onChange={(e) => setFormData({...formData, nickname: e.target.value})} className="bg-background rounded-xl h-11" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold ml-1">성</Label>
                <Input value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="bg-background rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold ml-1">이름</Label>
                <Input value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="bg-background rounded-xl h-11" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-black flex items-center gap-2">
              <School className="h-5 w-5 text-primary" /> 학교 및 선생님
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold ml-1">담당 선생님</Label>
              <Select value={formData.teacherId} onValueChange={(val) => setFormData({...formData, teacherId: val})}>
                <SelectTrigger className="bg-background rounded-xl h-11"><SelectValue placeholder="선택" /></SelectTrigger>
                <SelectContent>
                  {teachers?.map(t => <SelectItem key={t.id} value={t.id} className="rounded-lg">{t.name} 선생님</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold ml-1">학교급</Label>
              <Select value={formData.schoolType} onValueChange={(val) => setFormData({...formData, schoolType: val})}>
                <SelectTrigger className="bg-background rounded-xl h-11"><SelectValue placeholder="선택" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="초등학교" className="rounded-lg">초등학교</SelectItem>
                  <SelectItem value="중학교" className="rounded-lg">중학교</SelectItem>
                  <SelectItem value="고등학교" className="rounded-lg">고등학교</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 relative">
              <Label className="text-xs font-bold ml-1">학교 검색</Label>
              <div className="relative">
                <Input value={formData.schoolName} onChange={(e) => handleSchoolSearch(e.target.value)} placeholder="학교 이름" className="bg-background rounded-xl h-11 pr-10" />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <Search className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>
              {schoolResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-card border rounded-2xl shadow-xl max-h-40 overflow-y-auto animate-in fade-in zoom-in-95">
                  {schoolResults.map((s, i) => (
                    <div key={i} className="p-3 text-xs font-bold hover:bg-muted cursor-pointer border-b last:border-none" onClick={() => selectSchool(s)}>
                      {s.SCHUL_NM} <span className="opacity-50 text-[10px]">({s.LCTN_SC_NM})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold ml-1">학년</Label>
                <Input value={formData.grade} onChange={(e) => setFormData({...formData, grade: e.target.value})} className="bg-background rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold ml-1">반</Label>
                <Input value={formData.classNum} onChange={(e) => setFormData({...formData, classNum: e.target.value})} className="bg-background rounded-xl h-11" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleUpdate} disabled={isLoading || isDeleting} className="w-full bg-primary h-14 text-lg font-black text-primary-foreground rounded-2xl shadow-lg active:scale-[0.98] transition-all">
          {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "변경 사항 저장"}
        </Button>

        <div className="pt-8 flex justify-center">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive font-bold text-xs opacity-50 hover:opacity-100 hover:bg-destructive/5 rounded-full px-4">
                회원 탈퇴
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl bg-card">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-black text-xl flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6 text-destructive" /> 정말 탈퇴하시겠습니까?
                </AlertDialogTitle>
                <AlertDialogDescription className="font-bold text-sm leading-relaxed text-muted-foreground">
                  탈퇴 시 모든 포인트, 출석 기록, 개인 정보가 영구적으로 삭제되며 복구할 수 없습니다. 
                  계속하시겠습니까?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel className="rounded-xl font-bold border-none bg-muted hover:bg-muted/80">취소</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteAccount}
                  className="rounded-xl font-black bg-destructive text-white hover:bg-destructive/90"
                >
                  탈퇴하기
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
