
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { BookOpen } from "lucide-react"

export default function SignupPage() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border-none shadow-xl bg-white">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <BookOpen className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold font-headline">회원가입</CardTitle>
          <CardDescription>클래스 허브의 멤버가 되어 성장을 시작하세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first-name">이름</Label>
              <Input id="first-name" placeholder="홍" className="focus-visible:ring-accent" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name">성</Label>
              <Input id="last-name" placeholder="길동" className="focus-visible:ring-accent" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input id="email" type="email" placeholder="name@example.com" className="focus-visible:ring-accent" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input id="password" type="password" className="focus-visible:ring-accent" />
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox id="terms" />
            <Label htmlFor="terms" className="text-xs text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              <Link href="#" className="text-accent hover:underline">이용약관</Link> 및 <Link href="#" className="text-accent hover:underline">개인정보 처리방침</Link>에 동의합니다.
            </Label>
          </div>
          <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 mt-4">계정 생성하기</Button>
        </CardContent>
        <CardFooter className="text-center">
          <p className="text-sm text-muted-foreground w-full">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">로그인</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
