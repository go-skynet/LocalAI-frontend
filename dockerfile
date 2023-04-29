# First stage
FROM node:alpine AS build
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production --silent && mv node_modules ../
COPY . .
EXPOSE 3000
RUN chown -R node /usr/src/app
USER node

# Second stage
FROM --platform=$BUILDPLATFORM node:alpine
WORKDIR /usr/src/app
COPY --from=build /usr/src/app .
EXPOSE 3000
RUN npm install --force
RUN chown -R node /usr/src/app && npm install react-scripts
USER node
CMD ["npm", "start"]