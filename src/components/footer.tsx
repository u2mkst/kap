
"use client"

import Link from "next/link"
import { BookOpen } from "lucide-react"

export function Footer() {
  return (
    <footer className="w-full border-t bg-white py-12 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-primary font-headline">학생 전용 허브</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-sm">
              클래스 허브는 학생들의 즐거운 학원 생활과 성장을 응원합니다.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">메뉴</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">홈</Link></li>
              <li><Link href="/plants" className="text-sm text-muted-foreground hover:text-primary transition-colors">나의 정원</Link></li>
              <li><Link href="/lounge" className="text-sm text-muted-foreground hover:text-primary transition-colors">학생 라운지</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">고객지원</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/support" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  1:1 고객센터 (문의하기)
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 클래스 허브 (Class Hub). All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
