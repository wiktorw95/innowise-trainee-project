FROM node:22-alpine AS pruner
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune client_app --docker

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./
RUN npm install

COPY --from=pruner /app/out/full/ .
RUN npx turbo run build --filter=@innogram/client

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/client_app/.next/standalone ./
COPY --from=builder /app/apps/client_app/.next/static ./apps/client_app/.next/static
COPY --from=builder /app/apps/client_app/public ./apps/client_app/public

EXPOSE 3001

CMD ["node", "apps/client_app/server.js"]