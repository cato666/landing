FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src
COPY templates ./templates
COPY public ./public

RUN npm run prisma:generate

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps --production

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

COPY prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/templates ./templates
COPY --from=builder /app/public ./public

EXPOSE 3000

ENV NODE_ENV=production
CMD ["node", "dist/main.js"]

