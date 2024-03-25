# First stage
FROM node:lts-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm install -g serve
EXPOSE 3000
CMD ["/bin/sh", "./entrypoint.sh"]