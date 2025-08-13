# 1. Node.js 빌드
FROM node:20-alpine AS builder

WORKDIR /app

# 의존성만 먼저 복사
COPY package*.json ./

# BuildKit 캐시 마운트 (npm 캐시 재사용)
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# 나머지 소스 복사
COPY . .

#빌드
RUN npm run build

EXPOSE 3000
CMD ["node", "dist/main"]
