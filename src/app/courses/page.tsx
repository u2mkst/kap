
"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Search, Filter, Star, Clock, BookOpen } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlaceHolderImages } from "@/lib/placeholder-images"

const ALL_COURSES = [
  { id: 1, title: "실전 데이터 분석과 파이썬", category: "IT/프로그래밍", instructor: "김민수 강사", level: "초급", duration: "12시간", rating: 4.9, students: 1240, price: "₩150,000", imageId: "course-coding" },
  { id: 2, title: "기초 영문법 완성 마스터", category: "어학", instructor: "Emily Park", level: "기초", duration: "8시간", rating: 4.8, students: 850, price: "₩120,000", imageId: "course-english" },
  { id: 3, title: "창의력 수학 사고력 교실", category: "수학", instructor: "이영희 강사", level: "중급", duration: "10시간", rating: 4.7, students: 600, price: "₩90,000", imageId: "course-math" },
  { id: 4, title: "생활 과학 실험실 (입문)", category: "과학", instructor: "박진호 박사", level: "초급", duration: "15시간", rating: 4.9, students: 2100, price: "₩110,000", imageId: "course-science" },
  { id: 5, title: "AI 인공지능 기초 입문", category: "IT/프로그래밍", instructor: "최태준 강사", level: "중급", duration: "20시간", rating: 4.6, students: 1500, price: "₩180,000", imageId: "course-coding" },
  { id: 6, title: "수능 수학 실전 모의고사", category: "수학", instructor: "정한샘 강사", level: "고급", duration: "30시간", rating: 5.0, students: 4300, price: "₩250,000", imageId: "course-math" },
]

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const filteredCourses = ALL_COURSES.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || course.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4 font-headline">전체 강좌 탐색</h1>
        <p className="text-muted-foreground">원하시는 분야의 강좌를 찾아 당신의 실력을 한 단계 높여보세요.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="강좌명 또는 강사명을 입력하세요"
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="카테고리" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 카테고리</SelectItem>
              <SelectItem value="IT/프로그래밍">IT/프로그래밍</SelectItem>
              <SelectItem value="어학">어학</SelectItem>
              <SelectItem value="수학">수학</SelectItem>
              <SelectItem value="과학">과학</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> 필터</Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCourses.map((course) => {
          const img = PlaceHolderImages.find(p => p.id === course.imageId)
          return (
            <Card key={course.id} className="overflow-hidden group hover:shadow-lg transition-all border-none shadow-sm bg-white">
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  src={img?.imageUrl || ""}
                  alt={course.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  data-ai-hint={img?.imageHint}
                />
                <Badge className="absolute top-4 left-4 bg-primary text-white border-none">{course.category}</Badge>
              </div>
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{course.rating} ({course.students}명 수강)</span>
                </div>
                <h3 className="text-xl font-bold mb-2 line-clamp-1 h-7">{course.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{course.instructor}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-6">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    <span>{course.level}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xl font-bold text-primary">{course.price}</span>
                  <Link href={`/courses/${course.id}`}>
                    <Button variant="outline" size="sm" className="rounded-full">상세보기</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-24">
          <p className="text-xl text-muted-foreground">검색 결과가 없습니다.</p>
          <Button variant="link" onClick={() => { setSearchQuery(""); setCategoryFilter("all"); }}>필터 초기화</Button>
        </div>
      )}
    </div>
  )
}
