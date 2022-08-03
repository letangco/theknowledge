FROM node:8.16.2-alpine3.10

RUN rm -rf /var/lib/apt/lists/* && apk update
RUN apk add bash vim git busybox-extras python make g++
RUN npm config set unsafe-perm true
RUN npm install -g nodemon pm2 yarn cross-env

RUN mkdir -p /app
WORKDIR /app

# Copy app files into app folder
COPY . /app
RUN npm install \
    && ls -la /app
VOLUME /app

# Clear old entrypoint
RUN rm -rf /usr/local/bin/docker-entrypoint.sh
COPY docker-entrypoint.sh /usr/local/bin/
RUN sed -i -e 's/\r$//' /usr/local/bin/docker-entrypoint.sh \
    && chmod +x /usr/local/bin/docker-entrypoint.sh && ln -s /usr/local/bin/docker-entrypoint.sh /
ENTRYPOINT ["docker-entrypoint.sh"]

EXPOSE 8001
