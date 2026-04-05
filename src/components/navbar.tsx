
"use client"

import { usePathname, useRouter } from "next/navigation"
import { 
  BookOpen, 
  Home, 
  Gamepad2, 
  Menu, 
  X,
  Sprout,
  ShieldCheck,
  LogOut,
  UserCircle,
  Sun,
  Moon
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useUser, useAuth, useDoc, useFirestore, useMemoFirebase } from "@/firebase"
import { signOut } from "firebase/auth"
import { doc, updateDoc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import LinkNext from "next/link"

const navItems = [
  { name: "홈", href: "/dashboard", icon: Home },
  { name: "나의 정원", href: "/plants", icon: Sprout },
  { name: "라운지", href: "/lounge", icon: Gamepad2 },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useUser()
  const auth = useAuth()
  const db = useFirestore()

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null
    return doc(db, "users", user.uid)
  }, [user, db])
  const { data: userData } = useDoc(userDocRef)

  const adminRef = useMemoFirebase(() => {
    if (!user) return null
    return doc(db, "roles_admin", user.uid)
  }, [user, db])
  const { data: isAdminDoc } = useDoc(adminRef)

  const handleLogout = async () => {
    try {
      await signOut(auth)
      toast({ title: "로그아웃", description: "안전하게 로그아웃 되었습니다." })
      router.push("/login")
    } catch (error) {
      console.error(error)
    }
  }

  const toggleTheme = async () => {
    if (!userDocRef || !userData) return
    const newTheme = userData.theme === 'dark' ? 'light' : 'dark'
    try {
      await updateDoc(userDocRef, { theme: newTheme })
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center">
            <LinkNext href={user ? "/dashboard" : "/"} className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <BookOpen className="h-4 w-4" />
              </div>
              <span className="text-lg font-black tracking-tight text-primary font-headline">KST HUB</span>
            </LinkNext>
          </div>

          {user && (
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <LinkNext
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all hover:bg-muted",
                      isActive ? "text-primary bg-primary/10" : "text-muted-foreground"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                    <span>{item.name}</span>
                  </LinkNext>
                )
              })}
              <div className="h-4 w-px bg-border mx-2" />
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full hover:bg-muted mr-1" 
                onClick={toggleTheme}
                title="테마 변경"
              >
                {userData?.theme === 'dark' ? <Sun className="h-4 w-4 text-yellow-500" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
              </Button>

              {isAdminDoc && (
                <LinkNext href="/admin">
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-destructive/10">
                    <ShieldCheck className="h-4 w-4 text-destructive" />
                  </Button>
                </LinkNext>
              )}
              <LinkNext href="/profile">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
                  <UserCircle className="h-4 w-4 text-muted-foreground" />
                </Button>
              </LinkNext>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full hover:bg-muted" 
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          )}

          {!user && (
            <div className="hidden md:flex space-x-2">
              <LinkNext href="/login">
                <Button variant="ghost" size="sm" className="text-xs font-bold">로그인</Button>
              </LinkNext>
              <LinkNext href="/signup">
                <Button size="sm" className="bg-primary font-bold rounded-full text-xs text-white">회원가입</Button>
              </LinkNext>
            </div>
          )}

          {user && (
            <div className="flex md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="rounded-full h-8 w-8">
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          )}
        </div>
      </div>

      {user && isOpen && (
        <div className="md:hidden border-t bg-background p-3 space-y-1 animate-in slide-in-from-top-4 duration-200">
          {navItems.map((item) => (
            <LinkNext
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center space-x-3 p-3 rounded-lg text-sm font-bold transition-all",
                pathname === item.href ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
            </LinkNext>
          ))}
          
          <div
            onClick={() => {
              toggleTheme()
              setIsOpen(false)
            }}
            className="flex items-center space-x-3 p-3 rounded-lg text-sm font-bold text-muted-foreground hover:bg-muted cursor-pointer"
          >
            {userData?.theme === 'dark' ? <Sun className="h-4 w-4 text-yellow-500" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
            <span>{userData?.theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}</span>
          </div>

          <LinkNext
            href="/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center space-x-3 p-3 rounded-lg text-sm font-bold text-muted-foreground hover:bg-muted"
          >
            <UserCircle className="h-4 w-4" />
            <span>마이페이지</span>
          </LinkNext>
          {isAdminDoc && (
            <LinkNext
              href="/admin"
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-3 p-3 rounded-lg text-sm font-bold text-destructive hover:bg-destructive/5"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>관리자 모드</span>
            </LinkNext>
          )}
          <div className="pt-2 border-t mt-2">
            <Button 
              variant="ghost" 
              className="w-full text-destructive font-bold justify-start px-3 h-10 text-sm"
              onClick={() => {
                setIsOpen(false)
                handleLogout()
              }}
            >
              <LogOut className="h-4 w-4 mr-3" /> 로그아웃
            </Button>
          </div>
        </div>
      )}
    </nav>
  )
}
