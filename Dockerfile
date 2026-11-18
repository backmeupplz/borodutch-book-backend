FROM oven/bun:1.4.4-slim AS bun

FROM node:22.23.5-bookworm-slim AS build
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache,sharing=locked bun install --frozen-lockfile --backend=copyfile
COPY . .
RUN bun run build

# Runtime: production dependencies only (eslint/tsc-watch and their trees stay out of the image)
FROM node:22.23.5-bookworm-slim
WORKDIR /app
COPY package.json bun.lock ./
RUN --mount=type=bind,from=bun,source=/usr/local/bin/bun,target=/usr/local/bin/bun \
  --mount=type=cache,target=/root/.bun/install/cache,sharing=locked \
  bun install --frozen-lockfile --production --backend=copyfile
COPY . .
COPY --from=build /app/dist dist
ENV NODE_ENV=production
CMD ["node", "dist/server.js"]
