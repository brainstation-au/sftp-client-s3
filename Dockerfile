FROM node:alpine

WORKDIR /opt/code

COPY ./client ./

RUN npm ci && npm run build-ts

ENTRYPOINT [ "node", "./dist/cli/index.js" ]
