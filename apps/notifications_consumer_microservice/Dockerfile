FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY turbo.json ./

COPY apps/notifications_consumer_microservice ./apps/notifications_consumer_microservice
COPY packages ./packages

RUN npm install

RUN npx turbo run build --filter=@innogram/notifications

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/notifications_consumer_microservice/dist ./apps/notifications_consumer_microservice/dist
COPY --from=builder /app/apps/notifications_consumer_microservice/package.json ./apps/notifications_consumer_microservice/package.json

EXPOSE 3003

CMD ["npm", "run", "start:prod", "-w", "apps/notifications_consumer_microservice"]