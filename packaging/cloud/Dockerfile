FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN adduser -D -H -u 10001 v01d && apk add --no-cache wget
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/migrations ./migrations
COPY --from=build /app/public ./public
USER 10001
EXPOSE 8080
CMD ["node", "scripts/with-app-env.mjs", "vite", "preview", "--host", "0.0.0.0", "--port", "8080"]
