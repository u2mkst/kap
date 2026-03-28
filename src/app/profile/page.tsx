
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, School, Save, ChevronLeft, Fingerprint, BadgeCheck, ShieldAlert, Key } from "lucide-react"
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc, updateDoc, serverTimestamp, setDoc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"

export default function ProfilePage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [adminCode, setAdminCode] = useState("")

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null
    return doc(db, "users", user.uid)
  }, [user, db])

  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef)

  const adminRef = useMemoFirebase(() => {
    if (!user) return null
    return doc(db, "roles_admin", user.uid)
  }, [user, db])
  const { data: isAdminDoc } = useDoc(adminRef)

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    nickname: "",
    schoolName: "",
    grade: "",
    classNum: ""
  })

  useEffect(() => {
    if (userData) {
      setFormData({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        nickname: userData.nickname || "",
        schoolName: userData.schoolName || "",
        grade: userData.grade || "",
        classNum: userData.classNum || ""
      })
    }
  }, [userData])

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login")
    }
  }, [user, isUserLoading, router])

  const handleUpdate = async () => {
    if (!user || !userDocRef) return

    if (formData.nickname.length < 2) {
      toast({
        variant: "destructive",
        title: "닉네임 오류",
        description: "닉네임은 최소 2자 이상이어야 합니다.",
      })
      return
    }

    setIsLoading(true)
    try {
      await updateDoc(userDocRef, {
        ...formData,
        updatedAt: serverTimestamp()
      })
      toast({ title: "정보 수정 완료", description: "성공적으로 회원 정보가 업데이트되었습니다." })
    } catch (error) {
      console.error(error)
      toast({ variant: "destructive", title: "수정 실패", description: "오류가 발생했습니다." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClaimAdmin = async () => {
    if (!user) return
    if (adminCode === "ufes-admin-777") {
      setIsLoading(true)
      try {
        await setDoc(doc(db, "roles_admin", user.uid), {
          grantedViaCode: true,
          grantedAt: serverTimestamp()
        })
        toast({ title: "관리자 권한 획득!", description: "이제 관리자 시스템에 접근할 수 있습니다." })
        setAdminCode("")
      } catch (error) {
        console.error(error)
        toast({ variant: "destructive", title: "권한 획득 실패" })
      } finally {
        setIsLoading(false)
      }
    } else {
      toast({ variant: "destructive", title: "코드가 일치하지 않습니다." })
    }
  }

  if (isUserLoading || isUserDataLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
          <p className="text-muted-foreground text-sm sm:text-base">나의 정보와 학교 설정을 관리합니다.</p>
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
              <Label className="flex items-center gap-1.5">
                라운지 닉네임
              </Label>
              <Input 
                value={formData.nickname} 
                onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                placeholder="멋진학생"
                className="focus-visible:ring-primary"
              />
              <p className="text-[10px] text-muted-foreground">라운지 게시판에서 사용되는 별명입니다.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>성</Label>
                <Input 
                  value={formData.lastName} 
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})} 
                  placeholder="성"
                />
              </div>
              <div className="space-y-2">
                <Label>이름</Label>
                <Input 
                  value={formData.firstName} 
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})} 
                  placeholder="이름"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <School className="h-5 w-5 text-primary" /> 학교 정보 설정
            </CardTitle>
            <CardDescription>이 정보는 대시보드에서 급식과 시간표를 불러오는 데 사용됩니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>학교 이름</Label>
              <Input 
                placeholder="예: 서울고등학교" 
                value={formData.schoolName} 
                onChange={(e) => setFormData({...formData, schoolName: e.target.value})} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>학년</Label>
                <Input 
                  placeholder="1" 
                  value={formData.grade} 
                  onChange={(e) => setFormData({...formData, grade: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label>반</Label>
                <Input 
                  placeholder="3" 
                  value={formData.classNum} 
                  onChange={(e) => setFormData({...formData, classNum: e.target.value})} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {!isAdminDoc && (
          <Card className="border-2 border-dashed border-destructive/20 bg-destructive/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                <ShieldAlert className="h-4 w-4" /> 관리자 권한 획득 (Secret)
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <div className="relative flex-grow">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input 
                  type="password"
                  placeholder="Admin Code" 
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  className="pl-8 h-9 text-xs"
                />
              </div>
              <Button size="sm" variant="destructive" onClick={handleClaimAdmin} disabled={isLoading}>
                인증
              </Button>
            </CardContent>
          </Card>
        )}

        <Button onClick={handleUpdate} disabled={isLoading} className="w-full bg-primary h-12 text-lg font-bold">
          {isLoading ? <Save className="mr-2 h-5 w-5 animate-pulse" /> : <Save className="mr-2 h-5 w-5" />}
          {isLoading ? "저장 중..." : "변경 사항 저장"}
        </Button>
      </div>
    </div>
  )
}
