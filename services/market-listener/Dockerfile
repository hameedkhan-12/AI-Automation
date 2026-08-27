FROM node:20-alpine

WORKDIR /app

RUN npm init -y && npm install ws tsx @types/ws @types/node

COPY services/market-listener/index.ts ./index.ts

EXPOSE 3001

CMD ["npx", "tsx", "index.ts"]
