# KST HUB (KST 학생 허브)

미래를 여는 스마트 교육 플랫폼, **KST HUB**에 오신 것을 환영합니다!  
이 프로젝트는 KST 학생들을 위한 AI 학습 지원, 학교 정보 연동, 그리고 즐거운 커뮤니티 공간을 제공합니다.

## 🚀 주요 기능

### 1. AI 학습 도우미
- **학습 내용 요약**: 긴 학습 자료를 AI가 핵심 위주로 요약해 드립니다.
- **복습 프롬프트**: 학습 주제를 입력하면 심화 학습을 위한 질문 리스트를 생성합니다.

### 2. 스마트 학교 정보 (NEIS API 연동)
- **실시간 급식 조회**: 오늘과 이번 주의 급식 메뉴를 한눈에 확인하세요.
- **주간 시간표**: 학년/반 정보를 입력하면 실시간 시간표를 불러옵니다.
- **주간 이동**: 다음 주 정보까지 미리 확인할 수 있는 편리한 네비게이션을 지원합니다.

### 3. 나만의 정원 (Gamification)
- **식물 키우기**: 학습을 통해 얻은 포인트로 나만의 가상 식물을 씨앗부터 성체까지 키워보세요.

### 4. 학생 라운지 & 커뮤니티
- **인기 투표**: 우리 학원 최고의 인기 선생님을 직접 뽑아보세요.
- **행운 점수**: 매일 달라지는 오늘의 행운 점수🍀를 확인하세요.

## 🛠 기술 스택

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS
- **UI Components**: ShadCN UI, Lucide Icons
- **Backend**: Firebase (Authentication, Firestore, App Hosting)
- **AI**: Google Genkit (Gemini 2.5 Flash)

## 📁 프로젝트 구조

이 프로젝트는 **Next.js App Router** 구조를 따르고 있습니다. 주요 소스 코드는 `src/` 폴더 내에 위치합니다.

- `src/app/`: 각 페이지의 라우팅과 레이아웃 (HTML 구조는 여기서 TSX 파일로 정의됩니다)
- `src/components/`: 재사용 가능한 UI 컴포넌트
- `src/ai/`: Genkit을 이용한 AI 로직 및 프롬프트 정의
- `src/lib/`: API 연동 및 유틸리티 함수
- `src/firebase/`: 파이어베이스 초기화 및 데이터 훅

---
© 2026 KST 학생 허브 (KST HUB). All rights reserved.
