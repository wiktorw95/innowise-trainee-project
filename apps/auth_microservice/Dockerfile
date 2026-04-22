FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY turbo.json ./

COPY apps/auth_microservice ./apps/auth_microservice
COPY packages ./packages

RUN npm install

RUN npx turbo run build --filter=@innogram/auth...

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/auth_microservice/dist ./apps/auth_microservice/dist
COPY --from=builder /app/apps/auth_microservice/package.json ./apps/auth_microservice/package.json

EXPOSE 3002

CMD ["npm", "run", "start:prod", "-w", "apps/auth_microservice"]