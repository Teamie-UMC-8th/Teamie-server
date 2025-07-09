#!/bin/bash
cd /home/ubuntu/teamie

# Docker 빌드 및 재시작
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
