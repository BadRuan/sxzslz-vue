# 阶段一：构建 Vue 项目
FROM docker.1ms.run/library/node:26-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 阶段二：生成最终 Nginx 镜像
FROM docker.1ms.run/library/nginx:alpine
# 将构建产物拷贝到 Nginx 默认目录
COPY --from=builder /app/dist /usr/share/nginx/html
# 拷贝自定义 Nginx 配置（如果需要 SPA 路由回退）
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80