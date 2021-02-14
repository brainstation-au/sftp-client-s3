FROM node:12-alpine

WORKDIR /opt/code

COPY ./client ./

RUN npm ci && npm run build

ENTRYPOINT [ "node", "./dist/cli/index.js" ]
