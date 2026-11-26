FROM node:24-alpine AS build
WORKDIR /app
COPY client/package.json client/package-lock.json client/
RUN npm ci --prefix client
COPY server/package.json server/package-lock.json server/
RUN npm ci --prefix server
COPY client client
COPY server server
RUN npm run build --prefix client && npm run build --prefix server

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY server/package.json server/package-lock.json server/
RUN npm ci --omit=dev --prefix server
COPY --from=build /app/server/dist server/dist
COPY --from=build /app/client/dist client/dist
COPY server/demo server/demo
WORKDIR /app/server
RUN mkdir -p uploads logs && chown -R node:node uploads logs
USER node
EXPOSE 4000
CMD ["node", "dist/index.js"]
