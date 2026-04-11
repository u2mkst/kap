
"use client"

import { useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Sprout, Gamepad2, UserCircle, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser } from "@/firebase"

export function BottomNav() {
  const pathname = usePathname()
  const { user } = useUser()

  if (!user) return null

  const items = [
    { name: "홈", href: "/dashboard", icon: Home },
    { name: "정원", href: "/plants", icon: Sprout },
    { name: "스포츠", href: "/sports", icon: Trophy },
    { name: "라운지", href: "/lounge", icon: Gamepad2 },
    { name: "프로필", href: "/profile", icon: UserCircle },
  ]

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-md md:hidden">
      <div className="bg-card/90 backdrop-blur-md border shadow-2xl rounded-full h-14 flex items-center justify-around px-2">
        {items.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href} className={cn(
              "flex flex-col items-center justify-center gap-0.5 transition-all flex-1",
              isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-primary"
            )}>
              <item.icon className="h-5 w-5" />
              <span className="text-[8px] font-black">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
