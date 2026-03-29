
"use client"

import Link from "next/link"
import { BookOpen } from "lucide-react"

export function Footer() {
  return (
    <footer className="w-full border-t bg-white py-8 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-primary font-headline">KST 학생 허브</span>
            </Link>
            <p className="mt-2 text-xs text-muted-foreground max-w-sm">
              KST 학생 허브는 학생들의 즐거운 학원 생활과 성장을 응원합니다.
            </p>
          </div>
          <div>
            <h3 className="text-[10px] font-semibold text-foreground uppercase tracking-widest">메뉴</h3>
            <ul className="mt-2 space-y-1">
              <li><Link href="/dashboard" className="text-[10px] text-muted-foreground hover:text-primary transition-colors">홈</Link></li>
              <li><Link href="/plants" className="text-[10px] text-muted-foreground hover:text-primary transition-colors">나의 정원</Link></li>
              <li><Link href="/lounge" className="text-[10px] text-muted-foreground hover:text-primary transition-colors">학생 라운지</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-[10px] font-semibold text-foreground uppercase tracking-widest">고객지원</h3>
            <ul className="mt-2 space-y-1">
              <li>
                <Link href="/support" className="text-[10px] text-muted-foreground hover:text-primary transition-colors">
                  1:1 고객센터
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-6 text-center">
          <p className="text-[10px] text-muted-foreground">
            © 2026 KST 학생 허브 (KST HUB). All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
