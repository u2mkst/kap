
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, School, Save, ChevronLeft, Fingerprint, BadgeCheck, ShieldAlert, Key, Loader2, Eye, EyeOff, Users, GraduationCap } from "lucide-react"
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { doc, updateDoc, serverTimestamp, setDoc, collection } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

export default function ProfilePage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [adminCode, setAdminCode] = useState("")
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [showCode, setShowCode] = useState(false)

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null
    return doc(db, "users", user.uid)
  }, [user, db])

  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef)

  const teachersRef = useMemoFirebase(() => collection(db, "teachers"), [db])
  const { data: teachers } = useCollection(teachersRef)

  const configRef = useMemoFirebase(() => {
    if (!user) return null
    return doc(db, "metadata", "config")
  }, [user, db])
  const { data: configData } = useDoc(configRef)

  const adminRef = useMemoFirebase(() => {
    if (!user) return null
    return doc(db, "roles_admin", user.uid)
  }, [user, db])
  const { data: isAdminDoc } = useDoc(adminRef)

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    nickname: "",
    schoolType: "",
    schoolName: "",
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
        grade: userData.grade || "",
        classNum: userData.classNum || "",
        teacherId: userData.teacherId || ""
      })
    }
  }, [userData])

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login")
    }
  }, [user, isUserLoading, router])

  const handleUpdate = () => {
    if (!user || !userDocRef) return
    setIsLoading(true)
    const updateData = { ...formData, updatedAt: serverTimestamp() }
    updateDoc(userDocRef, updateData)
      .then(() => toast({ title: "정보 수정 완료" }))
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'update',
          requestResourceData: updateData
        })
        errorEmitter.emit('permission-error', permissionError)
      })
      .finally(() => setIsLoading(false))
  }

  const handleClaimAdmin = () => {
    if (!user || !configData) return
    const secret = configData.adminSecret || "ufes-admin-777"
    if (adminCode === secret) {
      setIsLoading(true)
      const targetAdminRef = doc(db, "roles_admin", user.uid)
      const claimData = { grantedViaCode: true, grantedAt: serverTimestamp() }
      setDoc(targetAdminRef, claimData)
        .then(() => {
          toast({ title: "관리자 권한 획득!", description: "이제 시스템 관리가 가능합니다." })
          setAdminCode("")
          setShowAdminPanel(false)
        })
        .finally(() => setIsLoading(false))
    } else {
      toast({ variant: "destructive", title: "코드가 일치하지 않습니다." })
    }
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
          <p className="text-muted-foreground text-sm">개인 정보 및 담당 선생님을 관리합니다.</p>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" /> 기본 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 opacity-70">
                <Fingerprint className="h-4 w-4" /> 학원 아이디 (변경 불가)
              </Label>
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border border-dashed">
                <span className="font-mono text-sm font-bold text-muted-foreground">{userData?.username}</span>
                <BadgeCheck className="h-4 w-4 text-primary ml-auto" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>라운지 닉네임</Label>
              <Input value={formData.nickname} onChange={(e) => setFormData({...formData, nickname: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>성</Label>
                <Input value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>이름</Label>
                <Input value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> 담당 선생님 관리
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select 
              value={formData.teacherId} 
              onValueChange={(val) => setFormData({...formData, teacherId: val})}
            >
              <SelectTrigger className="w-full h-11">
                <SelectValue placeholder="담당 선생님을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {teachers?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name} 선생님</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <School className="h-5 w-5 text-primary" /> 학교 정보 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5" /> 학교급</Label>
              <Select 
                value={formData.schoolType} 
                onValueChange={(val) => setFormData({...formData, schoolType: val})}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="학교 종류 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="초등학교">초등학교</SelectItem>
                  <SelectItem value="중학교">중학교</SelectItem>
                  <SelectItem value="고등학교">고등학교</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>학교 이름</Label>
              <Input placeholder="예: 서울고등학교" value={formData.schoolName} onChange={(e) => setFormData({...formData, schoolName: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>학년</Label>
                <Input value={formData.grade} onChange={(e) => setFormData({...formData, grade: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>반</Label>
                <Input value={formData.classNum} onChange={(e) => setFormData({...formData, classNum: e.target.value})} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleUpdate} disabled={isLoading} className="w-full bg-primary h-12 text-lg font-bold">
          {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "변경 사항 저장"}
        </Button>

        {!isAdminDoc && (
          <div className="pt-10">
            {!showAdminPanel ? (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-muted-foreground hover:bg-transparent"
                onClick={() => setShowAdminPanel(true)}
              >
                권한 획득이 필요하신가요?
              </Button>
            ) : (
              <Card className="border-2 border-dashed border-destructive/20 bg-destructive/5 animate-in fade-in duration-300">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                    <ShieldAlert className="h-4 w-4" /> 관리자 코드 인증
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowAdminPanel(false)}>닫기</Button>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <div className="relative flex-grow">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input 
                      type={showCode ? "text" : "password"}
                      placeholder="Admin Code" 
                      value={adminCode}
                      onChange={(e) => setAdminCode(e.target.value)}
                      className="pl-8 h-9 text-xs"
                    />
                    <button 
                      onClick={() => setShowCode(!showCode)} 
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showCode ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </button>
                  </div>
                  <Button size="sm" variant="destructive" onClick={handleClaimAdmin} disabled={isLoading}>
                    인증
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
