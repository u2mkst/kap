
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { BookOpen, Github, Mail } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border-none shadow-xl bg-white">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <BookOpen className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold font-headline">반가워요!</CardTitle>
          <CardDescription>클래스 허브 계정으로 로그인하세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input id="email" type="email" placeholder="name@example.com" className="focus-visible:ring-primary" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">비밀번호</Label>
              <Link href="#" className="text-xs text-primary hover:underline">비밀번호를 잊으셨나요?</Link>
            </div>
            <Input id="password" type="password" className="focus-visible:ring-primary" />
          </div>
          <Button className="w-full bg-primary hover:bg-primary/90">로그인</Button>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">또는 다른 계정으로 로그인</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="w-full">
              <Github className="mr-2 h-4 w-4" /> Github
            </Button>
            <Button variant="outline" className="w-full">
              <Mail className="mr-2 h-4 w-4" /> Google
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            계정이 없으신가요?{" "}
            <Link href="/signup" className="text-primary font-semibold hover:underline">회원가입</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
