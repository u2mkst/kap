
"use client"

import { useState } from "react"
import { Sparkles, Send, BookOpen, ListChecks, RotateCcw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { summarizeLearningMaterial } from "@/ai/flows/summarize-learning-material"
import { generateStudyPrompts } from "@/ai/flows/generate-study-prompts"

export default function AIAssistantPage() {
  const [summaryInput, setSummaryInput] = useState("")
  const [summaryOutput, setSummaryOutput] = useState("")
  const [isSummarizing, setIsSummarizing] = useState(false)

  const [promptInput, setPromptInput] = useState("")
  const [promptOutput, setPromptOutput] = useState<string[]>([])
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false)

  const handleSummarize = async () => {
    if (!summaryInput.trim()) return
    setIsSummarizing(true)
    try {
      const result = await summarizeLearningMaterial({ learningMaterial: summaryInput })
      setSummaryOutput(result.summary)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSummarizing(false)
    }
  }

  const handleGeneratePrompts = async () => {
    if (!promptInput.trim()) return
    setIsGeneratingPrompts(true)
    try {
      const result = await generateStudyPrompts({ topic: promptInput })
      setPromptOutput(result.studyPrompts)
    } catch (error) {
      console.error(error)
    } finally {
      setIsGeneratingPrompts(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-accent/20 text-accent">
            <Sparkles className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-4xl font-bold font-headline">AI 학습 도우미</h1>
            <p className="text-muted-foreground">당신의 학습 효율을 극대화하는 인공지능 파트너입니다.</p>
          </div>
        </div>

        <Tabs defaultValue="summarize" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 p-1">
            <TabsTrigger value="summarize" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <BookOpen className="mr-2 h-4 w-4" /> 학습 내용 요약
            </TabsTrigger>
            <TabsTrigger value="prompts" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <ListChecks className="mr-2 h-4 w-4" /> 학습 프롬프트 생성
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summarize">
            <div className="grid gap-8">
              <Card className="border-none shadow-sm bg-white">
                <CardHeader>
                  <CardTitle>요약할 내용을 입력하세요</CardTitle>
                  <CardDescription>긴 텍스트나 학습 자료를 붙여넣으시면 핵심 내용을 요약해 드립니다.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="여기에 학습 자료 내용을 입력해 주세요..."
                    className="min-h-[200px] mb-4 resize-none focus-visible:ring-accent"
                    value={summaryInput}
                    onChange={(e) => setSummaryInput(e.target.value)}
                  />
                  <Button
                    onClick={handleSummarize}
                    disabled={isSummarizing || !summaryInput}
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    {isSummarizing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 요약 중...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" /> 요약하기
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {summaryOutput && (
                <Card className="border-none shadow-md bg-accent/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg">AI 요약 결과</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => setSummaryOutput("")}><RotateCcw className="h-4 w-4" /></Button>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-blue max-w-none text-foreground leading-relaxed">
                      {summaryOutput.split('\n').map((para, i) => (
                        <p key={i} className="mb-2">{para}</p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="prompts">
            <div className="grid gap-8">
              <Card className="border-none shadow-sm bg-white">
                <CardHeader>
                  <CardTitle>학습 주제를 입력하세요</CardTitle>
                  <CardDescription>복습하고 싶은 개념이나 주제를 입력하면 심화 학습을 위한 질문들을 만들어 드립니다.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder="예: 미적분의 기초, 조선시대의 경제 정책..."
                      className="flex-grow focus-visible:ring-primary"
                      value={promptInput}
                      onChange={(e) => setPromptInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleGeneratePrompts()}
                    />
                    <Button
                      onClick={handleGeneratePrompts}
                      disabled={isGeneratingPrompts || !promptInput}
                      className="bg-primary"
                    >
                      {isGeneratingPrompts ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {promptOutput.length > 0 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="font-bold text-lg">생성된 학습 질문</h3>
                    <Button variant="ghost" size="sm" onClick={() => setPromptOutput([])}><RotateCcw className="mr-2 h-4 w-4" /> 초기화</Button>
                  </div>
                  <div className="grid gap-4">
                    {promptOutput.map((prompt, index) => (
                      <Card key={index} className="border-none shadow-sm bg-white hover:border-l-4 hover:border-accent transition-all">
                        <CardContent className="p-4 flex gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                            {index + 1}
                          </span>
                          <p className="text-foreground">{prompt}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
