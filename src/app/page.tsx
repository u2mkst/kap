
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { BookOpen, KeyRound, UserCircle } from "lucide-react"
import { useUser } from "@/firebase"

export default function Home() {
  const { user, isUserLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push("/dashboard")
    }
  }, [user, isUserLoading, router])

  if (isUserLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <Card className="w-full max-w-md border-none shadow-2xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg transform -rotate-6">
            <BookOpen className="h-10 w-10" />
          </div>
          <CardTitle className="text-3xl font-bold font-headline">KST HUB 접속</CardTitle>
          <CardDescription className="text-base mt-2">KST HUB 학생 전용 공간입니다.<br/>학습과 즐거움이 가득한 곳으로 들어오세요!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 text-accent-foreground text-sm flex items-center gap-3">
            <UserCircle className="h-5 w-5" />
            <span>오늘도 당신의 성장을 응원합니다!</span>
          </div>
          <Link href="/login" className="block w-full">
            <Button className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90 shadow-md">
              <KeyRound className="mr-2 h-5 w-5" /> 로그인하여 시작하기
            </Button>
          </Link>
        </CardContent>
        <CardFooter className="justify-center border-t pt-6">
          <p className="text-sm text-muted-foreground">
            아직 회원이 아니신가요?{" "}
            <Link href="/signup" className="text-primary font-bold hover:underline">회원가입</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
