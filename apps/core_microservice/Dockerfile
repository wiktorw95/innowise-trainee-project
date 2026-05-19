FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY turbo.json ./
COPY apps/core_microservice ./apps/core_microservice
COPY packages ./packages
RUN npm install
RUN npx turbo run build --filter=@innogram/core

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/core_microservice/dist ./apps/core_microservice/dist
COPY --from=builder /app/apps/core_microservice/package.json ./apps/core_microservice/package.json

EXPOSE 3000

CMD ["node", "apps/core_microservice/dist/apps/core_microservice/src/main.js"]