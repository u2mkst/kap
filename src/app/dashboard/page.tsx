
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Trophy, Clock, ChevronRight, Settings, Bell } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const enrolledCourses = [
    { id: 1, title: "실전 데이터 분석과 파이썬", progress: 65, lastAccessed: "2시간 전" },
    { id: 4, title: "생활 과학 실험실 (입문)", progress: 20, lastAccessed: "어제" },
  ]

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid gap-8 md:grid-cols-12">
        {/* Left Sidebar: Profile Info */}
        <div className="md:col-span-4 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden bg-white">
            <div className="h-24 bg-primary" />
            <CardContent className="pt-0 relative">
              <div className="flex flex-col items-center -mt-12 mb-6">
                <Avatar className="h-24 w-24 border-4 border-white shadow-md">
                  <AvatarImage src="https://picsum.photos/seed/user/100/100" />
                  <AvatarFallback>홍길동</AvatarFallback>
                </Avatar>
                <h2 className="mt-4 text-2xl font-bold font-headline">홍길동 수강생</h2>
                <p className="text-muted-foreground text-sm">hong@example.com</p>
                <div className="mt-4 flex gap-2">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">Lv.5 열혈학습자</Badge>
                  <Badge variant="outline" className="bg-accent/5 text-accent border-accent/20">우수 출석생</Badge>
                </div>
              </div>
              <div className="space-y-4">
                <Button className="w-full" variant="outline"><Settings className="mr-2 h-4 w-4" /> 프로필 수정</Button>
                <Button className="w-full" variant="ghost"><Bell className="mr-2 h-4 w-4" /> 알림 설정</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg">나의 학습 지표</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm">학습 시간</span>
                </div>
                <span className="font-bold">42시간</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span className="text-sm">완료 강좌</span>
                </div>
                <span className="font-bold">3개</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span className="text-sm">수강 중</span>
                </div>
                <span className="font-bold">2개</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Section: Main Content */}
        <div className="md:col-span-8 space-y-8">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold font-headline">수강 중인 강좌</h3>
              <Link href="/courses">
                <Button variant="link" className="text-primary">전체 강좌 보기 <ChevronRight className="ml-1 h-4 w-4" /></Button>
              </Link>
            </div>
            <div className="grid gap-6">
              {enrolledCourses.map((course) => (
                <Card key={course.id} className="border-none shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      <div className="flex-grow space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-bold">{course.title}</h4>
                          <span className="text-xs text-muted-foreground">{course.lastAccessed}</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">진도율</span>
                            <span className="font-medium text-primary">{course.progress}%</span>
                          </div>
                          <Progress value={course.progress} className="h-2" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button className="bg-primary">강좌 이어보기</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold font-headline mb-6">최근 학습 요약</h3>
            <Card className="border-none shadow-sm bg-accent/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-accent/20 text-accent">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold">데이터 분석 기초 (Chapter 3)</h4>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      파이썬의 Pandas 라이브러리를 사용한 데이터 프레임 조작법에 대해 학습했습니다. 
                      주요 개념으로는 DataFrame 필터링, 그룹화(groupby), 결측치 처리가 있었습니다...
                    </p>
                    <Link href="/ai-assistant">
                      <Button variant="link" size="sm" className="p-0 h-auto text-accent">AI 도우미와 더 복습하기</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
