FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY turbo.json ./
# Copy workspaces
COPY apps ./apps
COPY packages ./packages
RUN npm install
RUN npx turbo run build --filter=${APP_NAME}

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app .
CMD ["npm", "run", "start", "--workspace", "apps/${APP_NAME}"]
