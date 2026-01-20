# 使用一个轻量级的 Nginx 镜像作为基础
FROM nginx:alpine

# 将本地构建好的 dist 目录下的所有文件复制到 Nginx 的默认网站根目录
COPY dist/ /usr/share/nginx/html

# 暴露 80 端口
EXPOSE 80

# Nginx 默认会启动，这里不需要额外的 CMD