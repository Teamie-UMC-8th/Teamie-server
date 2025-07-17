# 1. Node.js 빌드
FROM node:20-alpine AS builder

WORKDIR /app
COPY . .

RUN npm ci
RUN npm run build

EXPOSE 3000
CMD ["node", "dist/main"]
