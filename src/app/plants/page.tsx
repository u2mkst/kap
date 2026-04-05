
"use client"

import { useMemo, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  Sprout, 
  Droplets, 
  Sun, 
  Plus, 
  Trash2,
  TrendingUp,
  Leaf,
  Loader2,
  Sparkles,
  TreeDeciduous,
  Wind,
  Gift
} from "lucide-react"
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase"
import { collection, doc, addDoc, updateDoc, increment, serverTimestamp, deleteDoc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"
import { cn } from "@/lib/utils"

export default function PlantsPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login")
    }
  }, [user, isUserLoading, router])

  const plantsRef = useMemoFirebase(() => {
    if (!user) return null
    return collection(db, "users", user.uid, "plants")
  }, [user, db])

  const { data: plants, isLoading: isPlantsLoading } = useCollection(plantsRef)

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null
    return doc(db, "users", user.uid)
  }, [user, db])
  const { data: userData } = useDoc(userDocRef)

  const handleAddPlant = () => {
    if (!user || !plantsRef || !userData || !userDocRef) return
    
    const cost = 250
    if (userData.points < cost) {
      toast({
        variant: "destructive",
        title: "포인트가 부족해요! 😢",
        description: `새로운 친구를 데려오려면 ${cost}P가 필요합니다.`,
      })
      return
    }

    setIsActionLoading("add")
    
    updateDoc(userDocRef, {
      points: increment(-cost)
    }).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'update'
      }))
    })

    const plantNames = ["희망나무", "쑥쑥이", "초록친구", "꿈나무", "행복꽃"]
    const randomName = plantNames[Math.floor(Math.random() * plantNames.length)]

    const targetSprout = Math.floor(Math.random() * 10) + 1; 
    const targetSapling = targetSprout + (Math.floor(Math.random() * 10) + 2); 
    const targetMature = targetSapling + (Math.floor(Math.random() * 11) + 5); 

    const newPlant = {
      userId: user.uid,
      plantName: randomName,
      plantType: "해바라기",
      growthStage: "Seed",
      pointsInvested: 0,
      targetSprout,
      targetSapling,
      targetMature,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    addDoc(plantsRef, newPlant)
      .then(() => {
        toast({
          title: "새로운 생명이 찾아왔어요! ✨",
          description: `"${randomName}"이(가) 정원에 심어졌습니다.`,
        })
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: plantsRef.path,
          operation: 'create',
          requestResourceData: newPlant
        }))
      })
      .finally(() => setIsActionLoading(null))
  }

  const handleGrow = (plant: any, type: 'water' | 'sun') => {
    if (!user || !userData || !userDocRef) return
    
    const growCost = 100
    if (userData.points < growCost) {
      toast({
        variant: "destructive",
        title: "포인트가 부족해요! 💧",
        description: "공부를 더 해서 포인트를 모아볼까요?",
      })
      return
    }

    setIsActionLoading(plant.id)

    updateDoc(userDocRef, {
      points: increment(-growCost)
    }).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'update'
      }))
    })

    const plantRef = doc(db, "users", user.uid, "plants", plant.id)
    const newPointsInvested = (plant.pointsInvested || 0) + growCost
    const currentActions = newPointsInvested / 100
    
    const targetSprout = plant.targetSprout || 5;
    const targetSapling = plant.targetSapling || 15;
    const targetMature = plant.targetMature || 30;

    let nextStage = "Seed"
    if (currentActions >= targetMature) nextStage = "Mature"
    else if (currentActions >= targetSapling) nextStage = "Sapling"
    else if (currentActions >= targetSprout) nextStage = "Sprout"

    updateDoc(plantRef, {
      pointsInvested: increment(growCost),
      growthStage: nextStage,
      updatedAt: serverTimestamp(),
    }).then(() => {
      if (type === 'water') {
        toast({ title: "시원한 물을 주었습니다! 💧" })
      } else {
        toast({ title: "따스한 햇살을 쬐어주었습니다! ☀️" })
      }
    }).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: plantRef.path,
        operation: 'update'
      }))
    }).finally(() => setIsActionLoading(null))
  }

  const handleHarvest = (plantId: string) => {
    if (!user || !userDocRef) return
    const reward = 2000
    setIsActionLoading(plantId)

    const plantRef = doc(db, "users", user.uid, "plants", plantId)

    updateDoc(userDocRef, {
      points: increment(reward)
    }).then(() => {
      deleteDoc(plantRef).then(() => {
        toast({
          title: "수확 완료! 🎉",
          description: `정성껏 키운 식물을 수확하여 보상으로 ${reward}P를 받았습니다!`,
        })
      })
    }).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'update'
      }))
    }).finally(() => setIsActionLoading(null))
  }

  const handleDeletePlant = (plantId: string) => {
    if (!user) return
    if (!confirm("정말 이 식물을 제거하시겠습니까? (투자한 포인트는 반환되지 않습니다.)")) return

    const plantRef = doc(db, "users", user.uid, "plants", plantId)
    deleteDoc(plantRef)
      .then(() => {
        toast({
          title: "제거 완료",
          description: "식물이 정원을 떠났습니다.",
        })
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: plantRef.path,
          operation: 'delete'
        }))
      })
  }

  const getStageInfo = (plant: any) => {
    const stage = plant.growthStage
    const currentActions = (plant.pointsInvested || 0) / 100
    
    const targetSprout = plant.targetSprout || 5;
    const targetSapling = plant.targetSapling || 15;
    const targetMature = plant.targetMature || 30;

    let emoji = "🌰"
    let label = "씨앗"
    let color = "bg-orange-500"
    let progress = 0

    switch(stage) {
      case "Seed":
        emoji = "🌰"
        label = "씨앗"
        color = "bg-orange-400"
        progress = (currentActions / targetSprout) * 100
        break
      case "Sprout":
        emoji = "🌱"
        label = "새싹"
        color = "bg-green-400"
        const sproutRange = targetSapling - targetSprout
        progress = ((currentActions - targetSprout) / (sproutRange || 1)) * 100
        break
      case "Sapling":
        emoji = "🌿"
        label = "묘목"
        color = "bg-emerald-500"
        const saplingRange = targetMature - targetSapling
        progress = ((currentActions - targetSapling) / (saplingRange || 1)) * 100
        break
      case "Mature":
        emoji = "🌳"
        label = "완성!"
        color = "bg-yellow-400"
        progress = 100
        break
    }

    const safeProgress = isNaN(progress) ? 0 : Math.min(Math.max(progress, 0), 100);

    return {
      label,
      color,
      progress: safeProgress,
      emoji
    }
  }

  if (isUserLoading || !user) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6 animate-in slide-in-from-top-4 duration-500">
        <div className="space-y-1">
          <h1 className="text-3xl font-black font-headline text-primary flex items-center gap-2">
            <TreeDeciduous className="h-8 w-8 text-emerald-600" /> 나만의 스마트 정원
          </h1>
          <p className="text-xs text-muted-foreground font-bold tracking-tight">학습 포인트로 식물을 키우고 성숙해지면 보상을 받으세요!</p>
        </div>
        <Card className="bg-card border-border px-6 py-3 flex items-center gap-4 shadow-md rounded-3xl">
          <TrendingUp className="h-5 w-5 text-primary" />
          <div>
            <p className="text-[9px] font-black text-primary/60 uppercase mb-0.5">My Points</p>
            <p className="text-xl font-black text-primary tracking-tighter">{userData?.points?.toLocaleString() || 0} P</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isPlantsLoading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary opacity-30" />
            <p className="text-xs font-bold text-muted-foreground italic">정원 불러오는 중...</p>
          </div>
        ) : (
          <>
            {plants?.map((plant, index) => {
              const stageInfo = getStageInfo(plant)
              const isMature = plant.growthStage === "Mature"
              
              const minLeft = Math.max(0, Math.ceil((100 - stageInfo.progress) / 100 * 3));
              const maxLeft = Math.max(0, Math.ceil((100 - stageInfo.progress) / 100 * 10));

              return (
                <Card key={plant.id} className={cn(
                  "border-none shadow-md hover:shadow-xl transition-all group bg-card overflow-hidden relative rounded-[2rem] animate-in zoom-in-95",
                  `duration-${200 + (index * 50)}`
                )}>
                  <div className="absolute top-3 right-3 z-20">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity rounded-full text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeletePlant(plant.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className={cn(
                    "relative h-32 flex items-center justify-center transition-colors duration-500",
                    isMature ? "bg-primary/5" : "bg-muted/30"
                  )}>
                    <div className="relative text-5xl animate-float select-none drop-shadow-md">
                      {stageInfo.emoji}
                    </div>
                    <Badge className={cn(
                      "absolute bottom-2 left-3 border-none px-3 py-0.5 font-black text-[9px] rounded-full shadow-sm",
                      stageInfo.color,
                      "text-white"
                    )}>
                      {stageInfo.label}
                    </Badge>
                  </div>

                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-1">
                      <h3 className="font-black text-xs flex items-center gap-1.5 text-primary">
                        <Leaf className="h-3 w-3" /> {plant.plantName}
                      </h3>
                      <Progress value={stageInfo.progress} className="h-1.5 bg-muted rounded-full" />
                      {!isMature && (
                        <p className="text-[9px] text-right font-bold text-muted-foreground/50">
                          다음 단계까지 약 {minLeft}~{maxLeft}회
                        </p>
                      )}
                    </div>

                    <div className="pt-1">
                      {isMature ? (
                        <Button 
                          onClick={() => handleHarvest(plant.id)}
                          disabled={isActionLoading === plant.id}
                          className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-black rounded-xl h-9 text-xs shadow-sm animate-pulse border-none"
                        >
                          {isActionLoading === plant.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Gift className="mr-2 h-4 w-4" /> 2,000P 받기</>}
                        </Button>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <Button 
                            disabled={isActionLoading === plant.id}
                            className="bg-primary text-white font-black rounded-xl h-8 text-[10px] border-none"
                            onClick={() => handleGrow(plant, 'water')}
                          >
                            {isActionLoading === plant.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Droplets className="mr-1 h-3 w-3" /> 물주기</>}
                          </Button>
                          <Button 
                            variant="outline" 
                            disabled={isActionLoading === plant.id}
                            className="border-primary/20 bg-card text-primary font-black rounded-xl h-8 text-[10px]"
                            onClick={() => handleGrow(plant, 'sun')}
                          >
                            <Sun className="mr-1 h-3 w-3 text-yellow-500" /> 햇빛
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            <Card 
              className={cn(
                "border-2 border-dashed border-muted hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center p-6 h-full min-h-[180px] rounded-[2rem] group bg-card",
                isActionLoading === "add" && "opacity-50 pointer-events-none"
              )}
              onClick={handleAddPlant}
            >
              <div className="p-3 rounded-full bg-primary/10 text-primary mb-2 group-hover:scale-110 transition-transform">
                {isActionLoading === "add" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
              </div>
              <p className="font-black text-xs text-primary">새 식물 심기</p>
              <p className="text-[9px] font-bold text-muted-foreground mt-0.5">250 포인트</p>
            </Card>
          </>
        )}
      </div>

      <div className="mt-12 max-w-xl mx-auto text-center space-y-2 p-6 bg-muted/20 rounded-3xl border border-border">
        <h2 className="text-lg font-black text-primary">나만의 정원 가이드</h2>
        <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
          각 식물은 자라는 데 필요한 정성(행동 횟수)이 랜덤하게 정해집니다!<br/>
          <span className="text-primary font-black">🌱 새싹</span>: 1~10회 | <span className="text-primary font-black">🌿 묘목</span>: 추가 2~11회 | <span className="text-primary font-black">🌳 완성</span>: 추가 5~15회<br/>
          성숙한 식물을 수확하면 <span className="text-primary font-black">2,000P</span>를 보상으로 드립니다!
        </p>
      </div>
    </div>
  )
}
