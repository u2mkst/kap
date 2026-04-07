
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, School, ChevronLeft, Fingerprint, BadgeCheck, Loader2, Users, GraduationCap, Search } from "lucide-react"
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { doc, updateDoc, serverTimestamp, collection } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { searchSchool } from "@/lib/neis-api"

export default function ProfilePage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
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

  if (isUserLoading || isUserDataLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ChevronLeft className="mr-2 h-4 w-4" /> 뒤로 가기
      </Button>

      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
          <User className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-headline">마이페이지</h1>
          <p className="text-muted-foreground text-sm">개인 정보 및 학교 정보를 관리합니다.</p>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="border-none shadow-sm bg-white">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5" /> 기본 정보</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 opacity-70"><Fingerprint className="h-4 w-4" /> 아이디 (변경 불가)</Label>
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border border-dashed">
                <span className="font-mono text-sm font-bold text-muted-foreground">{userData?.username}</span>
                <BadgeCheck className="h-4 w-4 text-primary ml-auto" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>닉네임</Label>
              <Input value={formData.nickname} onChange={(e) => setFormData({...formData, nickname: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>성</Label><Input value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} /></div>
              <div className="space-y-2"><Label>이름</Label><Input value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><School className="h-5 w-5" /> 학교 및 선생님</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>담당 선생님</Label>
              <Select value={formData.teacherId} onValueChange={(val) => setFormData({...formData, teacherId: val})}>
                <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                <SelectContent>{teachers?.map(t => <SelectItem key={t.id} value={t.id}>{t.name} 선생님</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>학교급</Label>
              <Select value={formData.schoolType} onValueChange={(val) => setFormData({...formData, schoolType: val})}>
                <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="초등학교">초등학교</SelectItem>
                  <SelectItem value="중학교">중학교</SelectItem>
                  <SelectItem value="고등학교">고등학교</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 relative">
              <Label>학교 검색</Label>
              <div className="relative">
                <Input value={formData.schoolName} onChange={(e) => handleSchoolSearch(e.target.value)} placeholder="학교 이름" />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">{isSearching && <Loader2 className="h-3 w-3 animate-spin" />}</div>
              </div>
              {schoolResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-card border rounded-xl shadow-lg max-h-40 overflow-y-auto">
                  {schoolResults.map((s, i) => (
                    <div key={i} className="p-3 text-xs font-bold hover:bg-muted cursor-pointer" onClick={() => selectSchool(s)}>
                      {s.SCHUL_NM} ({s.LCTN_SC_NM})
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>학년</Label><Input value={formData.grade} onChange={(e) => setFormData({...formData, grade: e.target.value})} /></div>
              <div className="space-y-2"><Label>반</Label><Input value={formData.classNum} onChange={(e) => setFormData({...formData, classNum: e.target.value})} /></div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleUpdate} disabled={isLoading} className="w-full bg-primary h-12 text-lg font-bold">
          {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "변경 사항 저장"}
        </Button>
      </div>
    </div>
  )
}
