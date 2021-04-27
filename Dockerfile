
#Build Stage
FROM node:12.18.2-alpine3.12

WORKDIR /yui

COPY . .

RUN echo "<=========== Install build dependencies ===============>" &&\
  apk add --no-cache --virtual .build-deps python3 gcc g++ make curl ca-certificates git &&\
  echo "<=========== Install node_modules packages ===============>" &&\
  npm install &&\
  echo "<=========== Build Yui ===============>" &&\
  npm run build-docker &&\
  echo "<=========== Remove virtual dependencies ===============>" &&\
  apk del .build-deps &&\
  echo "<=========== Add runtime service youtube-dl ===============>" &&\
  apk add youtube-dl &&\
  ls -la


CMD ["node", "./dist/yui.js"]


#Run Stage
# FROM node:12.18.2-alpine3.12

# WORKDIR /yui

# COPY --from=builder ["/yui/dist", "./dist"]
# COPY --from=builder ["/yui/node_modules", "./node_modules"]
# COPY [".env.build" , "./"]

# RUN apk add --no-cache youtube-dl

# CMD ["node", "./dist/yui.js"]