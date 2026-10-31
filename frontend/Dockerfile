FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:stable-alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/docker-entrypoint.sh /usr/local/bin/frontend-entrypoint

RUN chmod +x /usr/local/bin/frontend-entrypoint

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/frontend-entrypoint"]
CMD ["nginx", "-g", "daemon off;"]
