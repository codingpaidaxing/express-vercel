# 构建后端
FROM node:lts-alpine AS backend

RUN npm install pnpm -g

WORKDIR /app

# 在 service 目录内进行 COPY 操作
COPY ./package.json /app
COPY ./pnpm-lock.yaml /app

RUN pnpm install

COPY ./app

RUN pnpm build

# 最终镜像
FROM node:lts-alpine

RUN npm install pnpm -g

WORKDIR /app

# 在 service 目录内进行 COPY 操作
COPY ./package.json /app
COPY ./pnpm-lock.yaml /app

RUN pnpm install --production && rm -rf /root/.npm /root/.pnpm-store /usr/local/share/.cache /tmp/*

COPY --from=backend /app/build /app/build

EXPOSE 3002

CMD ["pnpm", "run", "prod"]
