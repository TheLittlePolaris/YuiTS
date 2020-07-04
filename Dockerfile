
FROM node:12.18.2-alpine3.12

WORKDIR /yui

ENV HOME=/yui \
  NODE_ENV=build

COPY . /yui

RUN apk update && apk upgrade &&\
  apk add --no-cache python2 youtube-dl &&\
  apk add --no-cache --virtual .build-deps gcc g++ make curl ca-certificates git &&\
  npm install &&\
  npm run build &&\
  apk del .build-deps

EXPOSE 80 443

CMD ["node", "./dist/yui.js"]