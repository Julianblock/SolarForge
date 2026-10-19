FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/solar-engine/package.json packages/solar-engine/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci
COPY . .
ENV DATABASE_URL=postgresql://solarforge:solarforge@postgres:5432/solarforge
RUN npm run build -w @solarforge/web

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app /app
EXPOSE 3000
CMD ["npm", "run", "start", "-w", "@solarforge/web"]
