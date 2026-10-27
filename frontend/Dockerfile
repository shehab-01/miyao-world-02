FROM node:22-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Local: `docker compose up --watch` syncs ./src and ./public into the container
FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3000"]

FROM base AS builder
# The /api proxy target is baked into the build (next.config.ts rewrites)
ARG API_URL_INTERNAL=http://backend:8000
ENV API_URL_INTERNAL=$API_URL_INTERNAL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production: Next.js standalone server, runs as the non-root node user
FROM base AS prod
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
