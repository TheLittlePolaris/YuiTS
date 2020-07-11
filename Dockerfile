
#Build Stage
FROM node:12.18.2-alpine3.12 as builder

WORKDIR /yui

COPY . /yui

RUN apk add --no-cache --virtual .build-deps python3 gcc g++ make curl ca-certificates git &&\
  npm install &&\
  npm run build-docker &&\
  apk del .build-deps


#Run Stage
FROM node:12.18.2-alpine3.12

WORKDIR /yui

ENV NODE_ENV=build HOME=/yui

COPY --from=builder /yui .

RUN apk add --no-cache youtube-dl

CMD ["node", "./dist/yui.js"]