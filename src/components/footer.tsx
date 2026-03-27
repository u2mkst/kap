
import Link from "next/link"
import { BookOpen } from "lucide-react"

export function Footer() {
  return (
    <footer className="w-full border-t bg-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-primary font-headline">클래스 허브</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-sm">
              우리는 당신의 꿈을 응원합니다. 최신 AI 기술과 전문 강사진이 함께하는 차세대 교육 플랫폼에서 당신의 잠재력을 발휘하세요.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">메뉴</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="/courses" className="text-sm text-muted-foreground hover:text-primary transition-colors">강좌 탐색</Link></li>
              <li><Link href="/ai-assistant" className="text-sm text-muted-foreground hover:text-primary transition-colors">AI 학습 도우미</Link></li>
              <li><Link href="/notices" className="text-sm text-muted-foreground hover:text-primary transition-colors">공지사항</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">고객지원</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">문의하기</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">이용약관</Link></li>
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
