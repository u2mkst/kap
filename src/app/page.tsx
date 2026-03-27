
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, BookOpen, Star, Sparkles, Users, GraduationCap } from "lucide-react"
import { PlaceHolderImages } from "@/lib/placeholder-images"

export default function Home() {
  const heroImg = PlaceHolderImages.find(img => img.id === "hero-education")
  const courses = [
    { id: 1, title: "실전 데이터 분석과 파이썬", category: "프로그래밍", rating: 4.9, price: "₩150,000", imageId: "course-coding" },
    { id: 2, title: "기초 영문법 완성 마스터", category: "언어", rating: 4.8, price: "₩120,000", imageId: "course-english" },
    { id: 3, title: "창의력 수학 사고력 교실", category: "수학", rating: 4.7, price: "₩90,000", imageId: "course-math" },
  ]

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative h-[600px] w-full overflow-hidden bg-primary flex items-center">
        <Image
          src={heroImg?.imageUrl || ""}
          alt="Hero"
          fill
          className="object-cover opacity-20"
          priority
          data-ai-hint="modern classroom"
        />
        <div className="container relative z-10 mx-auto px-4 text-white">
          <div className="max-w-3xl">
            <Badge className="mb-4 bg-accent text-accent-foreground border-none px-4 py-1">새로운 학습의 시작</Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 font-headline leading-tight">
              당신의 성장을 위한 <br /> 최적의 교육 공간, 클래스 허브
            </h1>
            <p className="text-lg md:text-xl mb-8 text-primary-foreground/90 max-w-xl">
              검증된 강사진과 체계적인 커리큘럼, 그리고 혁신적인 AI 학습 도우미를 통해 당신의 목표를 더 빠르고 확실하게 달성하세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/courses">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold px-8">
                  강좌 둘러보기 <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/ai-assistant">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8">
                  AI 학습 도우미 체험
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-primary">5,000+</p>
              <p className="text-sm text-muted-foreground">누적 수강생</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">120+</p>
              <p className="text-sm text-muted-foreground">전문 강사진</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">350+</p>
              <p className="text-sm text-muted-foreground">개설 강좌</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">98%</p>
              <p className="text-sm text-muted-foreground">학습 만족도</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 font-headline">왜 클래스 허브인가요?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">우리는 단순한 지식 전달을 넘어 최상의 학습 경험을 제공하기 위해 노력합니다.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-white">
              <CardContent className="pt-8 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <Sparkles className="h-8 w-8" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">AI 개인화 학습</h3>
                <p className="text-muted-foreground">AI 학습 도우미가 당신의 수준과 관심사에 맞춰 학습 프롬프트와 요약을 제공합니다.</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-white">
              <CardContent className="pt-8 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="p-3 rounded-full bg-accent/10 text-accent">
                    <Users className="h-8 w-8" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">실시간 피드백</h3>
                <p className="text-muted-foreground">전문 강사와의 실시간 소통을 통해 궁금한 점을 즉시 해결하고 학습 효율을 높이세요.</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-white">
              <CardContent className="pt-8 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <GraduationCap className="h-8 w-8" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">체계적인 커리큘럼</h3>
                <p className="text-muted-foreground">기초부터 실전까지 빈틈없이 설계된 커리큘럼으로 탄탄한 실력을 쌓을 수 있습니다.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Recommended Courses */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-4 font-headline">추천 인기 강좌</h2>
              <p className="text-muted-foreground">지금 가장 많은 학생들이 선택한 강좌들을 확인해보세요.</p>
            </div>
            <Link href="/courses">
              <Button variant="ghost" className="text-primary hover:text-primary/80">전체 보기 <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => {
              const img = PlaceHolderImages.find(p => p.id === course.imageId)
              return (
                <Card key={course.id} className="overflow-hidden group hover:border-primary transition-all">
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      src={img?.imageUrl || ""}
                      alt={course.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      data-ai-hint={img?.imageHint}
                    />
                    <Badge className="absolute top-4 left-4 bg-white/90 text-primary border-none">{course.category}</Badge>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{course.rating}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-2 line-clamp-1">{course.title}</h3>
                    <div className="flex items-center justify-between mt-6">
                      <span className="text-lg font-bold text-primary">{course.price}</span>
                      <Link href={`/courses/${course.id}`}>
                        <Button variant="outline" size="sm">상세보기</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="rounded-3xl bg-primary p-12 text-center text-white relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 font-headline">지금 바로 시작하고 혜택을 받으세요!</h2>
              <p className="text-lg mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
                첫 가입 시 모든 강좌 10% 할인 쿠폰과 무료 AI 학습 도우미 이용권을 증정합니다.
              </p>
              <Link href="/signup">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 px-10">
                  무료로 가입하기
                </Button>
              </Link>
            </div>
            <div className="absolute top-0 right-0 h-full w-full opacity-10 pointer-events-none">
               <BookOpen className="h-64 w-64 absolute -bottom-10 -right-10 rotate-12" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
