# 多阶段构建：构建站点 → Nginx 托管
# 用法：docker build -t apusic-docs-center . && docker run -p 8080:80 apusic-docs-center

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /srv/docs-center
EXPOSE 80
