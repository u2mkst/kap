
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Gamepad2, 
  MessageSquare, 
  Users, 
  Sparkles, 
  Share2, 
  Music,
  Heart
} from "lucide-react"

export default function LoungePage() {
  const posts = [
    { id: 1, author: "스터디광", content: "오늘 다들 열공중인가요? 전 졸려서 라운지 왔어요 ㅠ", likes: 12, comments: 4, tag: "자유" },
    { id: 2, author: "초코우유", content: "이번 기말 모의고사 범위 다들 아시는 분!", likes: 5, comments: 8, tag: "질문" },
    { id: 3, author: "매점단골", content: "오늘 오후 간식 츄러스 대박 맛있음!! 두 번 드세요", likes: 24, comments: 3, tag: "맛집" },
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black mb-3 font-headline text-primary">STUDENT LOUNGE</h1>
        <p className="text-muted-foreground font-medium">학습 사이사이, 즐거움을 채우는 우리들만의 공간</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* 왼쪽: 커뮤니티 */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" /> 실시간 라운지 톡
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-primary font-bold">글쓰기</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="p-4 rounded-2xl bg-muted/20 border border-muted/30 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-primary">{post.author}</span>
                      <Badge variant="outline" className="text-[10px] h-4 py-0">{post.tag}</Badge>
                    </div>
                    <span className="text-[10px] text-muted-foreground">방금 전</span>
                  </div>
                  <p className="text-sm mb-4 leading-relaxed">{post.content}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
                      <Heart className="h-3 w-3" /> {post.likes}
                    </button>
                    <button className="flex items-center gap-1 hover:text-primary transition-colors">
                      <MessageSquare className="h-3 w-3" /> {post.comments}
                    </button>
                    <button className="ml-auto hover:text-primary">
                      <Share2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* 오른쪽: 즐길거리 */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-gradient-to-br from-accent/20 to-primary/10 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Music className="h-5 w-5 text-accent-foreground" /> 학습 노동요
              </CardTitle>
              <CardDescription className="text-xs">집중력을 높여주는 플레이리스트</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-white/40 hover:bg-white/60 cursor-pointer">
                  <div className="h-8 w-8 bg-primary/20 rounded-full flex items-center justify-center">▶</div>
                  <span className="text-xs font-bold">Lo-fi 스터디 비트 (1시간)</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-white/40 hover:bg-white/60 cursor-pointer">
                  <div className="h-8 w-8 bg-accent/20 rounded-full flex items-center justify-center">▶</div>
                  <span className="text-xs font-bold">빗소리 ASMR 백색소음</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> 스터디 매칭
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center py-6">
              <div className="mb-4 flex justify-center">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <Sparkles className="h-8 w-8" />
                </div>
              </div>
              <p className="text-xs font-medium text-muted-foreground mb-4">혼자 공부하기 지루할 땐,<br/>온라인 자습실에 입장하세요!</p>
              <Button size="sm" className="w-full bg-primary font-bold rounded-full shadow-lg shadow-primary/20">참여하기</Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-accent text-accent-foreground">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">이번 주 행운의 한마디</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs italic font-medium">"지금 당신이 흘리는 땀방울은 미래의 달콤한 열매가 될 거예요. 오늘 간식은 초코 츄러스니까 힘내세요!"</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
