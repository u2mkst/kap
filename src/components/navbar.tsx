
"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  BookOpen, 
  User, 
  Home, 
  Gamepad2, 
  Store, 
  Menu, 
  X,
  Sprout,
  ShieldCheck,
  LogOut
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useUser, useAuth } from "@/firebase"
import { signOut } from "firebase/auth"
import { toast } from "@/hooks/use-toast"

const navItems = [
  { name: "학생 홈", href: "/dashboard", icon: Home },
  { name: "나의 정원", href: "/plants", icon: Sprout },
  { name: "라운지", href: "/lounge", icon: Gamepad2 },
  { name: "포인트 샵", href: "/shop", icon: Store },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useUser()
  const auth = useAuth()

  const isAuthPage = pathname === "/" || pathname === "/login" || pathname === "/signup"

  const handleLogout = async () => {
    try {
      await signOut(auth)
      toast({ title: "로그아웃", description: "안전하게 로그아웃 되었습니다." })
      router.push("/login")
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href={user ? "/dashboard" : "/"} className="flex items-center space-x-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="text-xl font-black tracking-tight text-primary font-headline">STUDENT HUB</span>
            </Link>
          </div>

          {user && (
            <div className="hidden md:block">
              <div className="flex items-center space-x-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center space-x-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all hover:bg-muted",
                        isActive ? "text-primary bg-primary/10 shadow-sm" : "text-muted-foreground"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
                <div className="h-6 w-px bg-border mx-4" />
                <Link href="/admin">
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-destructive/10">
                    <ShieldCheck className="h-4 w-4 text-destructive" />
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full hover:bg-muted" 
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Link href="/dashboard">
                  <Button variant="outline" size="icon" className="rounded-full border-primary/20 hover:border-primary transition-colors">
                    <User className="h-4 w-4 text-primary" />
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {!user && (
            <div className="hidden md:flex space-x-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="font-bold">로그인</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-primary font-bold rounded-full">회원가입</Button>
              </Link>
            </div>
          )}

          {user && (
            <div className="flex md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="rounded-full">
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          )}
        </div>
      </div>

      {user && isOpen && (
        <div className="md:hidden border-t bg-background p-4 space-y-2 animate-in slide-in-from-top-4 duration-200">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center space-x-3 p-4 rounded-xl text-base font-bold transition-all",
                pathname === item.href ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          ))}
          <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-3 p-4 rounded-xl text-base font-bold text-destructive hover:bg-destructive/5"
            >
              <ShieldCheck className="h-5 w-5" />
              <span>관리자 모드</span>
            </Link>
          <div className="pt-4 border-t mt-4">
            <Button 
              variant="ghost" 
              className="w-full text-destructive font-bold justify-start px-4"
              onClick={() => {
                setIsOpen(false)
                handleLogout()
              }}
            >
              <LogOut className="h-5 w-5 mr-3" /> 로그아웃
            </Button>
          </div>
        </div>
      )}
    </nav>
  )
}
