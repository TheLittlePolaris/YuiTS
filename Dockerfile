
FROM node:18.12.0-alpine3.15
WORKDIR /code_build
COPY . /code_build

RUN apk add --no-cache --virtual\
    .build-deps\
      # build tools
      python3 gcc g++ make curl\
      # erlpack
      ca-certificates git\
      # sodium
      libtool autoconf automake python2 &&\
  # runtime libs for internal usage
    apk add --no-cache youtube-dl ffmpeg

# Install sodium from source... WHAT THE F@#$???? @discord.js could you replace this thing ? It's so outdated now.

# Step 1: Make folder to build
RUN mkdir -vp /node-modules-prebuild && cd /node-modules-prebuild &&\
# Step 2: Download and extract libsodium-1.0.18
    wget https://download.libsodium.org/libsodium/releases/libsodium-1.0.18.tar.gz &&\
    tar -zxvf libsodium-1.0.18.tar.gz &&\
# Step 3: Clone sodium repo
    git clone https://github.com/paixaop/node-sodium.git && cd node-sodium &&\
# Step 4: Replace existing libsodium build with the one downloaded from source
    rm -rf ./deps/libsodium &&\
    mv /node-modules-prebuild/libsodium-1.0.18 ./deps/libsodium &&\
    rm /node-modules-prebuild/libsodium-1.0.18.tar.gz &&\
# Step 5: Install dependencies & create link for sodium
    npm install && npm link

RUN npm link sodium

RUN npm install --loglevel verbose &&\
  npm run swc:build &&\
  # Optimize image size on node_modules:
  npm prune --prod &&\
  rm package-lock.json &&\
  npm cache clean --force &&\
  # Optimize image size on libs:
  apk del .build-deps

CMD ["npm", "run", "swc:start"]