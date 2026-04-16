
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
import { User, School, ChevronLeft, Phone, BadgeCheck, Loader2, Search, AlertTriangle, BookOpen } from "lucide-react"
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
    } finally {
      setIsSearching(false)
    }
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
      await deleteDoc(userDocRef)
      await deleteUser(user)
      toast({ title: "회원 탈퇴 완료" })
      router.push("/")
    } catch (e: any) {
      toast({ variant: "destructive", title: "탈퇴 실패", description: "다시 로그인 후 시도해 주세요." })
    } finally {
      setIsDeleting(false)
    }
  }

  if (isUserLoading || isUserDataLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl animate-in fade-in duration-500">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6 rounded-full font-bold">
        <ChevronLeft className="mr-2 h-4 w-4" /> 뒤로 가기
      </Button>

      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
          <User className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-black font-headline text-primary">마이페이지</h1>
          <p className="text-muted-foreground text-sm font-bold">내 정보를 관리합니다.</p>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden">
          <CardHeader><CardTitle className="text-lg font-black flex items-center gap-2"><Phone className="h-5 w-5 text-primary" /> 인증 정보</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold opacity-70">로그인 휴대폰 번호</Label>
              <div className="flex items-center gap-2 p-4 bg-muted/30 rounded-2xl border border-dashed">
                <span className="font-black text-sm text-primary">{userData?.phoneNumber || "정보 없음"}</span>
                <BadgeCheck className="h-4 w-4 text-primary ml-auto" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold ml-1">라운지 닉네임</Label>
              <Input value={formData.nickname} onChange={(e) => setFormData({...formData, nickname: e.target.value})} className="rounded-xl h-11 bg-background" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden">
          <CardHeader><CardTitle className="text-lg font-black flex items-center gap-2"><School className="h-5 w-5 text-primary" /> 학교 정보</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold ml-1">학교 이름 검색</Label>
              <Input value={formData.schoolName} onChange={(e) => handleSchoolSearch(e.target.value)} className="rounded-xl h-11 bg-background" />
              {schoolResults.length > 0 && (
                <div className="bg-card border rounded-2xl shadow-xl mt-1 max-h-40 overflow-y-auto">
                  {schoolResults.map((s, i) => (
                    <div key={i} className="p-3 text-xs font-bold hover:bg-muted cursor-pointer" onClick={() => {
                      setFormData({...formData, schoolName: s.SCHUL_NM, officeCode: s.ATPT_OFCDC_SC_CODE, schoolCode: s.SD_SCHUL_CODE})
                      setSchoolResults([])
                    }}>{s.SCHUL_NM}</div>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="학년" value={formData.grade} onChange={(e) => setFormData({...formData, grade: e.target.value})} className="rounded-xl h-11 bg-background" />
              <Input placeholder="반" value={formData.classNum} onChange={(e) => setFormData({...formData, classNum: e.target.value})} className="rounded-xl h-11 bg-background" />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleUpdate} disabled={isLoading} className="w-full bg-primary h-14 text-lg font-black rounded-2xl shadow-lg">
          {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "변경 사항 저장"}
        </Button>

        <div className="pt-8 flex justify-center">
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="ghost" className="text-destructive font-bold text-xs opacity-50">회원 탈퇴</Button></AlertDialogTrigger>
            <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl bg-card">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-black text-xl">정말 탈퇴하시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription className="font-bold">모든 데이터가 삭제되며 복구할 수 없습니다.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl font-bold">취소</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount} className="rounded-xl font-black bg-destructive">탈퇴하기</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
