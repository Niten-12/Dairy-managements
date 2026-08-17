FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json .
# ci, not install: builds from the lockfile so an image is reproducible and the
# dependency tree matches what CI tested.
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# The config is a template rather than a finished file so the same image runs
# under docker-compose (upstream "backend", port 80) and on a PaaS host
# (upstream on the private network, port from $PORT).
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker/nginx-port.envsh /docker-entrypoint.d/15-nginx-port.envsh
RUN chmod +x /docker-entrypoint.d/15-nginx-port.envsh

# Defaults target docker-compose. Override BACKEND_ORIGIN in the hosting
# provider — on Railway that is the backend's *.railway.internal address.
# The filter restricts envsubst to these two names, so nginx variables such as
# $uri and $host are never accidentally expanded.
# NGINX_ENTRYPOINT_LOCAL_RESOLVERS is an opt-in flag: without it the base image's
# 15-local-resolvers.envsh returns early and NGINX_LOCAL_RESOLVERS is never set,
# leaving the resolver directive unsubstituted and nginx refusing to start.
ENV BACKEND_ORIGIN=http://backend:8080 \
    NGINX_PORT=80 \
    NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1 \
    NGINX_ENVSUBST_FILTER="^(NGINX_PORT|BACKEND_ORIGIN|NGINX_LOCAL_RESOLVERS)$"

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
