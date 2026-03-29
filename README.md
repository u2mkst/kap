# 🚀 KST HUB (KST 학생 허브)

미래를 여는 스마트 교육 플랫폼, **KST HUB**입니다.  
이 프로젝트는 **Next.js**를 기반으로 한 풀스택 애플리케이션으로, 학생들의 즐거운 학원 생활을 지원합니다.

## 🌐 서비스 배포 및 접속 방법

본 프로젝트는 **Next.js** 프레임워크를 사용하므로, 단순히 파일을 올리는 것이 아니라 '빌드' 과정이 필요합니다.

### 1. Firebase App Hosting (권장)
가장 안정적으로 모든 기능(로그인, 데이터베이스)을 사용할 수 있는 방법입니다.
- **방법**: Firebase 콘솔 -> App Hosting -> GitHub 저장소 연결 -> 자동 배포

### 2. GitHub Pages 배포
현재 저장소에 설정된 GitHub Actions를 통해 자동으로 배포됩니다.
- **설정**: GitHub 저장소 -> Settings -> Pages -> Build and deployment -> Source를 `GitHub Actions`로 설정

---

## ✨ 주요 기능

### 1️⃣ 스마트 학교 생활 (NEIS API 연동)
- **오늘의 급식**: 이번 주 급식 메뉴를 실시간으로 확인하세요.
- **주간 시간표**: 학년/반 정보에 맞춘 스마트 시간표를 지원합니다.

### 2️⃣ 게이미피케이션 (Gamification)
- **나만의 정원**: 학습 포인트를 모아 씨앗부터 나무까지 가상 식물을 키워보세요. (애니메이션 적용)
- **행운 점수**: 매일 달라지는 오늘의 행운 점수🍀를 확인하세요.

### 3️⃣ 커뮤니티 & 지원
- **선생님 인기 투표**: 우리 학원 최고의 선생님을 뽑는 즐거운 공간입니다.
- **1:1 고객센터**: 궁금한 점은 언제든 선생님께 문의하세요.

## 🛠 기술 스택
- **Framework**: Next.js 15 (App Router)
- **UI/UX**: React 19, Tailwind CSS, ShadCN UI
- **Backend**: Firebase (Auth, Firestore)

---
© 2026 KST 학생 허브 (KST HUB). All rights reserved.
