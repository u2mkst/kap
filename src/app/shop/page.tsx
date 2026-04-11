
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Store, Gift, Coins, Tag, ShoppingCart } from "lucide-react"

export default function ShopPage() {
  const items = [
    { id: 1, name: "CU 3천원 모바일 상품권", price: 3000, category: "쿠폰", icon: "🎫" },
    { id: 2, name: "매점 떡볶이 교환권", price: 1500, category: "간식", icon: "🍱" },
    { id: 3, name: "학습용 보조 배터리", price: 15000, category: "학습도구", icon: "🔋" },
    { id: 4, name: "전강좌 10% 할인권", price: 5000, category: "혜택", icon: "📉" },
    { id: 5, name: "KST HUB 로고 머그컵", price: 2500, category: "굿즈", icon: "☕" },
    { id: 6, name: "1:1 멘토링 30분권", price: 8000, category: "혜택", icon: "👨‍🏫" },
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-black mb-3 font-headline text-primary flex items-center gap-3">
            <Store className="h-10 w-10" /> 포인트 샵
          </h1>
          <p className="text-muted-foreground font-medium">열심히 공부해서 모은 포인트로 선물을 교환하세요!</p>
        </div>
        <Card className="bg-accent/10 border-accent/20 px-6 py-4 flex items-center gap-4">
          <div className="p-2 bg-accent/20 rounded-full">
            <Coins className="h-6 w-6 text-accent-foreground" />
          </div>
          <div>
            <p className="text-xs font-bold text-accent-foreground opacity-80 uppercase">나의 보유 포인트</p>
            <p className="text-2xl font-black text-accent-foreground tracking-tight">1,250 P</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <Card key={item.id} className="border-none shadow-sm hover:shadow-xl transition-all group bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="h-40 bg-muted/30 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-300">
                {item.icon}
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className="text-[10px] font-bold">{item.category}</Badge>
                  <div className="flex items-center gap-1 text-primary font-black">
                    <Tag className="h-3 w-3" /> {item.price.toLocaleString()} P
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-4 h-12 line-clamp-2">{item.name}</h3>
                <Button className="w-full font-bold bg-primary hover:bg-primary/90 rounded-xl">
                  <ShoppingCart className="mr-2 h-4 w-4" /> 교환하기
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-12 border-dashed border-2 bg-muted/10">
        <CardContent className="p-8 text-center">
          <Gift className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="font-bold text-xl mb-2 text-primary">포인트는 어떻게 모으나요?</h3>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            매일 출석체크, 과제 제출, 퀴즈 정답 맞히기, 그리고 목표 학습 시간 달성을 통해 포인트를 얻을 수 있습니다.
            지치지 않는 학습을 위해 KST HUB가 드리는 작은 선물입니다!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
