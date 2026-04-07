
"use client"

import Link from "next/link"
import { BookOpen } from "lucide-react"

export function Footer() {
  return (
    <footer className="w-full border-t bg-card py-6 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold text-primary font-headline">KST HUB</span>
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            KST HUB는 학생들의 즐거운 학원 생활을 응원합니다. © 2026 KST HUB.
          </p>
          <div className="flex gap-4">
            <Link href="/dashboard" className="text-[10px] text-muted-foreground hover:text-primary transition-colors">홈</Link>
            <Link href="/plants" className="text-[10px] text-muted-foreground hover:text-primary transition-colors">나의 정원</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
