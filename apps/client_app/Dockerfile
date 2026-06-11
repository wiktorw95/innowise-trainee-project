FROM node:22-alpine
WORKDIR /app


COPY package*.json turbo.json ./
COPY packages ./packages
COPY apps/client_app ./apps/client_app
COPY apps/core_microservice/package.json ./apps/core_microservice/package.json
COPY apps/auth_microservice/package.json ./apps/auth_microservice/package.json


RUN npm install


RUN npx turbo run build --filter=@innogram/client

# 4. Expose the port
EXPOSE 3001
ENV PORT=3001
ENV NODE_ENV=production


WORKDIR /app/apps/client_app
CMD ["npm", "run", "start"]