
"use client"

import { useMemo, useEffect } from "react"
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
  Loader2
} from "lucide-react"
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase"
import { collection, doc, addDoc, updateDoc, increment, serverTimestamp, deleteDoc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

export default function PlantsPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()

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
        title: "포인트 부족",
        description: `새 식물을 심으려면 ${cost}P가 필요합니다.`,
      })
      return
    }

    // 1. 포인트 차감 (비동기)
    updateDoc(userDocRef, {
      points: increment(-cost)
    }).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'update',
        requestResourceData: { points: userData.points - cost }
      }))
    })

    // 2. 식물 추가 (비동기)
    const newPlant = {
      userId: user.uid,
      plantName: "새로운 친구",
      plantType: "해바라기",
      growthStage: "Seed",
      pointsInvested: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    addDoc(plantsRef, newPlant)
      .then(() => {
        toast({
          title: "식물 심기 성공!",
          description: "새로운 식물이 정원에 추가되었습니다.",
        })
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: plantsRef.path,
          operation: 'create',
          requestResourceData: newPlant
        }))
      })
  }

  const handleGrow = (plantId: string, currentPoints: number) => {
    if (!user || !userData || !userDocRef) return
    
    const growCost = 100
    if (userData.points < growCost) {
      toast({
        variant: "destructive",
        title: "포인트 부족",
        description: "식물을 키우려면 100P가 필요합니다.",
      })
      return
    }

    // 1. 포인트 차감
    updateDoc(userDocRef, {
      points: increment(-growCost)
    }).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'update'
      }))
    })

    // 2. 식물 성장
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
    }).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: plantRef.path,
        operation: 'update'
      }))
    })
  }

  const handleDeletePlant = (plantId: string) => {
    if (!user) return
    if (!confirm("정말 이 식물을 제거하시겠습니까?")) return

    const plantRef = doc(db, "users", user.uid, "plants", plantId)
    deleteDoc(plantRef)
      .then(() => {
        toast({
          title: "삭제 완료",
          description: "식물을 정원에서 제거했습니다.",
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
    switch(stage) {
      case "Seed": return { label: "씨앗", image: "https://picsum.photos/seed/seed/400/400", progress: 25 }
      case "Sprout": return { label: "새싹", image: "https://picsum.photos/seed/sprout/400/400", progress: 50 }
      case "Sapling": return { label: "묘목", image: "https://picsum.photos/seed/tree/400/400", progress: 75 }
      case "Mature": return { label: "성숙", image: "https://picsum.photos/seed/sunflower/400/400", progress: 100 }
      default: return { label: "씨앗", image: "https://picsum.photos/seed/seed/400/400", progress: 0 }
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-black mb-3 font-headline text-primary flex items-center gap-3">
            <Sprout className="h-10 w-10" /> 나의 정원
          </h1>
          <p className="text-muted-foreground font-medium">열심히 공부해서 얻은 포인트로 식물을 키워보세요!</p>
        </div>
        <Card className="bg-primary/5 border-primary/10 px-6 py-4 flex items-center gap-4">
          <div className="p-2 bg-primary/20 rounded-full">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold text-primary opacity-80">사용 가능 포인트</p>
            <p className="text-2xl font-black text-primary tracking-tight">{userData?.points?.toLocaleString() || 0} P</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {isPlantsLoading ? (
          <div className="col-span-full flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
          </div>
        ) : (
          <>
            {plants?.map((plant) => {
              const stageInfo = getStageInfo(plant.growthStage)
              
              return (
                <Card key={plant.id} className="border-none shadow-sm hover:shadow-xl transition-all group bg-white overflow-hidden relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                    onClick={() => handleDeletePlant(plant.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="relative h-48 bg-muted/20 flex items-center justify-center">
                    <Image 
                      src={stageInfo.image} 
                      alt={stageInfo.label} 
                      fill 
                      className="object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                    />
                    <Badge className="absolute bottom-4 left-4 bg-primary/80 backdrop-blur-sm border-none">
                      {stageInfo.label}
                    </Badge>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <Leaf className="h-4 w-4 text-green-600" /> {plant.plantName}
                      </h3>
                      <span className="text-xs font-bold text-muted-foreground">누적 {plant.pointsInvested}P</span>
                    </div>
                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold">성장도</span>
                        <span className="font-bold text-primary">{stageInfo.progress}%</span>
                      </div>
                      <Progress value={stageInfo.progress} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        className="bg-primary hover:bg-primary/90 font-bold rounded-xl"
                        onClick={() => handleGrow(plant.id, plant.pointsInvested)}
                      >
                        <Droplets className="mr-2 h-4 w-4" /> 물 주기 (100P)
                      </Button>
                      <Button variant="outline" className="border-primary/20 hover:bg-primary/5 font-bold rounded-xl">
                        <Sun className="mr-2 h-4 w-4 text-yellow-500" /> 햇빛 쬐기
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            <Card 
              className="border-2 border-dashed border-muted hover:border-primary hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center p-12 h-full min-h-[400px]"
              onClick={handleAddPlant}
            >
              <div className="p-4 rounded-full bg-primary/10 text-primary mb-4">
                <Plus className="h-10 w-10" />
              </div>
              <h3 className="font-bold text-lg mb-1">새 식물 심기</h3>
              <p className="text-sm text-muted-foreground">500 포인트를 사용하여</p>
              <p className="text-sm text-muted-foreground">새로운 친구를 데려오세요.</p>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
