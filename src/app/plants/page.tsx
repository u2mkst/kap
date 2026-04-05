
"use client"

import { useMemo, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
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
  Wind
} from "lucide-react"
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase"
import { collection, doc, addDoc, updateDoc, increment, serverTimestamp, deleteDoc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"
import { PlaceHolderImages } from "@/lib/placeholder-images"
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
    
    const cost = 500
    if (userData.points < cost) {
      toast({
        variant: "destructive",
        title: "포인트가 부족해요! 😢",
        description: `새로운 친구를 데려오려면 ${cost}P가 필요합니다.`,
      })
      return
    }

    setIsActionLoading("add")
    
    // Optimistic Point deduction
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

    const newPlant = {
      userId: user.uid,
      plantName: randomName,
      plantType: "해바라기",
      growthStage: "Seed",
      pointsInvested: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    addDoc(plantsRef, newPlant)
      .then(() => {
        toast({
          title: "새로운 생명이 찾아왔어요! ✨",
          description: `"${randomName}"이(가) 정원에 심어졌습니다. 정성껏 키워주세요!`,
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

  const handleGrow = (plantId: string, currentPoints: number, type: 'water' | 'sun') => {
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

    setIsActionLoading(plantId)

    updateDoc(userDocRef, {
      points: increment(-growCost)
    }).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'update'
      }))
    })

    const plantRef = doc(db, "users", user.uid, "plants", plantId)
    const newPointsInvested = currentPoints + growCost
    
    let nextStage = "Seed"
    if (newPointsInvested >= 1000) nextStage = "Mature"
    else if (newPointsInvested >= 500) nextStage = "Sapling"
    else if (newPointsInvested >= 200) nextStage = "Sprout"

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

  const handleDeletePlant = (plantId: string) => {
    if (!user) return
    if (!confirm("정말 이 식물을 제거하시겠습니까? (투자한 포인트는 반환되지 않습니다.)")) return

    const plantRef = doc(db, "users", user.uid, "plants", plantId)
    deleteDoc(plantRef)
      .then(() => {
        toast({
          title: "안녕, 고마웠어! 👋",
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

  const getStageInfo = (stage: string) => {
    let imageId = "plant-seed"
    let label = "씨앗"
    let color = "bg-orange-500"
    let progress = 25

    switch(stage) {
      case "Seed":
        imageId = "plant-seed"
        label = "씨앗"
        color = "bg-orange-400"
        progress = 25
        break
      case "Sprout":
        imageId = "plant-sprout"
        label = "새싹"
        color = "bg-green-400"
        progress = 50
        break
      case "Sapling":
        imageId = "plant-sapling"
        label = "묘목"
        color = "bg-emerald-500"
        progress = 75
        break
      case "Mature":
        imageId = "plant-mature"
        label = "완성!"
        color = "bg-yellow-400"
        progress = 100
        break
      default:
        imageId = "plant-seed"
        label = "씨앗"
        progress = 0
    }

    const img = PlaceHolderImages.find(p => p.id === imageId)
    return {
      label,
      color,
      progress,
      imageUrl: img?.imageUrl || "https://picsum.photos/seed/plant/400/400",
      imageHint: img?.imageHint || "plant"
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
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 animate-in slide-in-from-top-4 duration-500">
        <div className="space-y-2">
          <h1 className="text-4xl font-black font-headline text-primary flex items-center gap-3">
            <TreeDeciduous className="h-10 w-10 text-emerald-600 animate-float" /> 나만의 스마트 정원
          </h1>
          <p className="text-muted-foreground font-bold tracking-tight">학습 포인트를 모아 나만의 가상 정원을 가꾸어 보세요. 식물이 자랄수록 보람도 커집니다!</p>
        </div>
        <Card className="bg-white border-primary/10 px-8 py-5 flex items-center gap-5 shadow-xl rounded-[2rem] hover:scale-105 transition-transform">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <TrendingUp className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-1">My Points</p>
            <p className="text-3xl font-black text-primary tracking-tighter">{userData?.points?.toLocaleString() || 0} <span className="text-sm font-bold opacity-50">P</span></p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {isPlantsLoading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-30" />
            <p className="text-sm font-bold text-muted-foreground italic">정원을 불러오고 있어요...</p>
          </div>
        ) : (
          <>
            {plants?.map((plant, index) => {
              const stageInfo = getStageInfo(plant.growthStage)
              const isMature = plant.growthStage === "Mature"
              
              return (
                <Card key={plant.id} className={cn(
                  "border-none shadow-lg hover:shadow-2xl transition-all group bg-white overflow-hidden relative rounded-[2.5rem] animate-in zoom-in-95",
                  `duration-${300 + (index * 100)}`
                )}>
                  {/* Action Buttons Overlay */}
                  <div className="absolute top-4 right-4 z-20 flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded-full text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeletePlant(plant.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className={cn(
                    "relative h-56 flex items-center justify-center overflow-hidden transition-colors duration-700",
                    isMature ? "bg-gradient-to-br from-yellow-50 to-orange-50" : "bg-muted/30"
                  )}>
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                      <Wind className="h-full w-full p-12 text-muted-foreground animate-pulse-gentle" />
                    </div>
                    
                    <div className="relative h-40 w-40 animate-float">
                      <Image 
                        src={stageInfo.imageUrl} 
                        alt={stageInfo.label} 
                        fill 
                        className="object-contain p-4 group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl"
                        data-ai-hint={stageInfo.imageHint}
                      />
                    </div>

                    <Badge className={cn(
                      "absolute bottom-6 left-6 border-none px-4 py-1.5 font-black text-[10px] tracking-wider rounded-full shadow-lg animate-in slide-in-from-left-4",
                      stageInfo.color,
                      "text-white"
                    )}>
                      {isMature && <Sparkles className="h-3 w-3 inline mr-1 animate-spin-slow" />}
                      {stageInfo.label}
                    </Badge>
                  </div>

                  <CardContent className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-black text-xl flex items-center gap-2 text-primary group-hover:translate-x-1 transition-transform">
                          <Leaf className="h-5 w-5 text-emerald-500" /> {plant.plantName}
                        </h3>
                        <p className="text-[10px] font-bold text-muted-foreground ml-7">누적 정성: {plant.pointsInvested}P</p>
                      </div>
                      {isMature && <div className="p-2 bg-yellow-100 rounded-full animate-pulse"><Sparkles className="h-5 w-5 text-yellow-600" /></div>}
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">Growth Level</span>
                        <span className="text-lg font-black text-primary leading-none">{stageInfo.progress}%</span>
                      </div>
                      <Progress value={stageInfo.progress} className="h-3 bg-muted/50 overflow-hidden rounded-full shadow-inner" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Button 
                        disabled={isMature || (isActionLoading === plant.id)}
                        className="bg-primary hover:bg-primary/90 text-white font-black rounded-[1.25rem] h-12 shadow-md active:scale-95 transition-all"
                        onClick={() => handleGrow(plant.id, plant.pointsInvested, 'water')}
                      >
                        {isActionLoading === plant.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Droplets className="mr-2 h-4 w-4" /> 물 주기</>}
                      </Button>
                      <Button 
                        variant="outline" 
                        disabled={isMature || (isActionLoading === plant.id)}
                        className="border-primary/20 hover:bg-orange-50 hover:border-orange-200 font-black rounded-[1.25rem] h-12 transition-all active:scale-95"
                        onClick={() => handleGrow(plant.id, plant.pointsInvested, 'sun')}
                      >
                        <Sun className="mr-2 h-4 w-4 text-orange-500" /> 햇빛
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            <Card 
              className={cn(
                "border-4 border-dashed border-muted/50 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center p-12 h-full min-h-[480px] rounded-[2.5rem] group animate-in zoom-in-95 duration-500 delay-200",
                isActionLoading === "add" && "opacity-50 pointer-events-none"
              )}
              onClick={handleAddPlant}
            >
              <div className="p-6 rounded-[2rem] bg-primary/10 text-primary mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-inner">
                {isActionLoading === "add" ? <Loader2 className="h-12 w-12 animate-spin" /> : <Plus className="h-12 w-12" />}
              </div>
              <h3 className="font-black text-2xl mb-2 text-primary">새 식물 심기</h3>
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-muted-foreground/60">500 포인트를 사용하여</p>
                <p className="text-sm font-bold text-muted-foreground/60">새로운 친구를 데려오세요!</p>
              </div>
              <Badge variant="secondary" className="mt-8 bg-primary/5 text-primary border-none px-6 py-2 rounded-full font-black text-xs animate-pulse">
                Click to Plant
              </Badge>
            </Card>
          </>
        )}
      </div>

      {/* Info Section */}
      <div className="mt-20 max-w-2xl mx-auto text-center space-y-4 animate-in slide-in-from-bottom-8 duration-1000">
        <div className="inline-flex p-3 bg-emerald-100 rounded-full mb-2">
          <Leaf className="h-6 w-6 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-black text-primary">어떻게 성장하나요?</h2>
        <p className="text-muted-foreground font-medium leading-relaxed">
          공부를 하고 문제를 풀어서 얻은 포인트로 식물을 정성껏 보살펴주세요.<br/>
          누적 포인트가 <span className="text-primary font-black">200P(새싹)</span>, <span className="text-primary font-black">500P(묘목)</span>, <span className="text-primary font-black">1000P(성숙)</span>가 되면 모습이 변합니다!
        </p>
      </div>
    </div>
  )
}
