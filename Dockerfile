
FROM node:16.13-alpine3.12
WORKDIR /code_build
COPY . /code_build
RUN \
  apk add --no-cache --virtual\
    .build-deps\
      # build tools
      python3 gcc g++ make curl\
      # erlpack
      ca-certificates git\
      # sodium deps
      libtool autoconf automake\
    &&\
  npm install &&\
  npm run build:docker &&\
  # Optimize image size on node_modules:
  rm -r ./node_modules &&\
  rm package-lock.json &&\
  npm install --only=prod &&\
  npm cache clean --force &&\
  # runtime libs for internal usage
  apk add --no-cache youtube-dl ffmpeg &&\
  # Optimize image size on libs:
  apk del .build-deps

CMD ["node", "./dist/yui.js"]