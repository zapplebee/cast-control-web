FROM oven/bun:1.3.5

WORKDIR /app

COPY package.json ./
RUN bun install --production

COPY src ./src
RUN bun run build:client

EXPOSE 3000

CMD ["bun", "run", "start"]
