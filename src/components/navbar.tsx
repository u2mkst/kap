
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, User, Home, Search, MessageSquare, Menu, X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "홈", href: "/", icon: Home },
  { name: "강좌 탐색", href: "/courses", icon: Search },
  { name: "AI 학습 도우미", href: "/ai-assistant", icon: MessageSquare },
]

export function Navbar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg">
                <BookOpen className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold tracking-tight text-primary font-headline">클래스 허브</span>
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:text-primary",
                      isActive ? "text-primary bg-primary/10" : "text-muted-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
              <div className="h-6 w-px bg-border mx-2" />
              <Link href="/login">
                <Button variant="ghost" size="sm">로그인</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-primary hover:bg-primary/90">회원가입</Button>
              </Link>
              <Link href="/dashboard" className="ml-2">
                <Button variant="outline" size="icon" className="rounded-full border-primary/20">
                  <User className="h-4 w-4 text-primary" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t bg-background p-4 space-y-2 animate-in slide-in-from-top-4 duration-200">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center space-x-3 p-3 rounded-lg text-base font-medium transition-colors",
                pathname === item.href ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          ))}
          <div className="pt-4 flex flex-col space-y-2">
            <Link href="/login" onClick={() => setIsOpen(false)}>
              <Button variant="outline" className="w-full">로그인</Button>
            </Link>
            <Link href="/signup" onClick={() => setIsOpen(false)}>
              <Button className="w-full">회원가입</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
