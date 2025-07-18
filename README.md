## 프로젝트 개요

협업의 진행과 기록, AI 포트폴리오 정리까지 지원하는 대학생 맞춤형 협업툴</br>
**Teamie**의 서버 레포지토리입니다.

## 기술 스택

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/nestjs-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![JWT](https://img.shields.io/badge/jwt-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![MySQL](https://img.shields.io/badge/mysql-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Redis](https://img.shields.io/badge/redis-FF4438?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

## 실행 방법

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## 컨벤션

### 브랜치 컨벤션

```
- main
    - 실제 배포 CI/CD용 branch
- dev
    - 개발 CI/CD용 branch
- feature
    - 기능 구현용 branch
    - 반드시 `develop`에서 뻗어나와 `develop`으로 `merge` 되어야한다.
```

### 커밋 컨벤션

- 본문은 한 줄 당 72자 내로 작성.

```
Issue_종류: 구현 내용

커밋 관련 설명

ex) feat: 로그인 구현

카카오톡 소셜 로그인 구현
서버 자체 JWT 기술 사용
```

### PR 컨벤션

- **PR 작성 시 API의 테스트 결과를 스크린샷으로 포함하도록 한다.**
- `dev` branch로의 `merge`는 1명 이상의 Approve가 필요함.
- 머지 전략으로 `Squash and Merge` 사용
- `merge` 이후 개발용 브랜치 삭제

```
[Issue_종류] 구현_내용

ex) [Feature] 로그인 구현
```

### 패키지 컨벤션

- 도메인 기반(Domain-Driven Design, DDD)의 레이어드 아키텍처

```
- common : 애플리케이션 전반의 공통 로직(인터셉터, ENUM 등)
- config : 환경변수 및 설정 파일
- modules : 애플리케이션의 비즈니스 로직을 포함하는 도메인별 모듈
  - {domain}
    - controllers : 외부 요청을 받아 처리
    - dtos : 데이터 전송 객체(request & response)
    - services : 도메인의 비즈니스 로직 구현
    - repositories : DB와의 상호작용
    - entities : DB와 매핑되는 도메인 모델 정의
    - modules : NestJS 모듈 정의 파일
    - {sub-domain} : 상위 도메인과 연관된 하위 도메인
- infra : 외부 시스템과 연동되는 코드를 포함
```

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
