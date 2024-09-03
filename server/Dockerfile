FROM node:18-alpine As development

WORKDIR /usr/src/app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm install

COPY . .

RUN npx prisma generate

RUN pnpm run build

FROM node:18-alpine As production

WORKDIR /usr/src/app

COPY --from=development /usr/src/app/node_modules ./node_modules
COPY --from=development /usr/src/app/dist ./dist

COPY package.json ./

ENV NODE_ENV production

EXPOSE 3000

CMD ["node", "dist/main.js"]
