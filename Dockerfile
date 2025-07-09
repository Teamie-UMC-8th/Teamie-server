# 1. Node.js 빌드
FROM node:18-slim

WORKDIR /app
COPY . .

RUN npm install
RUN npm run build

EXPOSE 3000
CMD ["node", "dist/main"]
