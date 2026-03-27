
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Trophy, 
  Clock, 
  Utensils, 
  Gift, 
  Zap, 
  Gamepad2, 
  CalendarDays,
  Flame
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const points = 1250;
  const streak = 7;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* 상단 환영 메시지 & 포인트 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
            <AvatarImage src="https://picsum.photos/seed/student/100/100" />
            <AvatarFallback>홍길동</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold font-headline">반가워요, 길동님! 👋</h1>
            <div className="flex gap-2 mt-1">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                <Flame className="h-3 w-3 mr-1 text-orange-500 fill-orange-500" /> {streak}일 연속 출석
              </Badge>
              <Badge variant="secondary" className="bg-accent/10 text-accent-foreground border-none">
                Lv.5 열혈학습자
              </Badge>
            </div>
          </div>
        </div>
        <Card className="bg-primary text-primary-foreground border-none shadow-lg px-6 py-3 flex items-center gap-4">
          <div className="p-2 bg-white/20 rounded-full">
            <Gift className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs opacity-80">보유 포인트</p>
            <p className="text-xl font-black">{points.toLocaleString()} P</p>
          </div>
          <Link href="/shop">
            <Button size="sm" variant="secondary" className="ml-2 font-bold text-xs bg-white text-primary hover:bg-white/90">
              상점가기
            </Button>
          </Link>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* 학습 요약 & 진행도 */}
        <div className="md:col-span-8 space-y-6">
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500 fill-yellow-500" /> 이어지는 학습
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-xl bg-muted/30 border border-muted flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-bold">실전 데이터 분석과 파이썬</p>
                  <p className="text-xs text-muted-foreground">3단원: 데이터 시각화 (진행중)</p>
                </div>
                <div className="w-32 space-y-2">
                  <div className="flex justify-between text-[10px]">
                    <span>진도율</span>
                    <span className="font-bold text-primary">65%</span>
                  </div>
                  <Progress value={65} className="h-1.5" />
                </div>
                <Button size="sm" className="ml-4 bg-primary rounded-full">계속하기</Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm bg-white group hover:bg-accent/5 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-md flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-primary" /> 오늘의 급식/간식
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2 bg-muted/20 p-3 rounded-lg">
                  <p className="font-medium text-primary">🍱 점심 메뉴</p>
                  <p className="text-muted-foreground">불고기 덮밥, 콩나물국, 계란말이, 김치</p>
                  <p className="font-medium text-accent mt-2">🍰 오후 간식</p>
                  <p className="text-muted-foreground">초코 츄러스 & 우유</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white group hover:bg-accent/5 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-md flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5 text-accent" /> 미니 게임존
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-sm font-medium mb-3">오늘의 영단어 퀴즈!</p>
                  <Button variant="outline" size="sm" className="rounded-full w-full border-accent/30 text-accent hover:bg-accent/10">
                    지금 도전하고 100P 받기
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 오른쪽 사이드: 랭킹 & 일정 */}
        <div className="md:col-span-4 space-y-6">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500 fill-yellow-500" /> 이달의 학습왕 랭킹
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "박지성", time: "152시간", rank: 1 },
                { name: "홍길동(나)", time: "142시간", rank: 2 },
                { name: "이강인", time: "128시간", rank: 3 },
              ].map((user) => (
                <div key={user.name} className={`flex items-center justify-between p-2 rounded-lg ${user.rank === 2 ? 'bg-primary/5 border border-primary/10' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className={`font-black text-sm w-4 ${user.rank === 1 ? 'text-yellow-600' : user.rank === 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                      {user.rank}
                    </span>
                    <span className="text-sm font-medium">{user.name}</span>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">{user.time}</span>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground text-xs mt-2">전체 랭킹 보기</Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" /> 주요 학원 일정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="bg-primary/10 text-primary p-2 rounded-lg text-center min-w-[50px]">
                  <p className="text-[10px] font-bold">FEB</p>
                  <p className="text-lg font-black">28</p>
                </div>
                <div>
                  <p className="text-sm font-bold">기말 모의고사</p>
                  <p className="text-xs text-muted-foreground">오후 2시 - 대강의실</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="bg-accent/10 text-accent-foreground p-2 rounded-lg text-center min-w-[50px]">
                  <p className="text-[10px] font-bold">MAR</p>
                  <p className="text-lg font-black">02</p>
                </div>
                <div>
                  <p className="text-sm font-bold">신학기 파티 & 피자데이</p>
                  <p className="text-xs text-muted-foreground">오후 5시 - 학생 라운지</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
