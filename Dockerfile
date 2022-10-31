FROM node:18.12.0-alpine3.15

WORKDIR /code_build

COPY . .

RUN apk add --no-cache --virtual\
      .build-deps\
      # build tools
        python3 gcc g++ make curl\
      # sodium
        ca-certificates git libtool autoconf automake python2 &&\
  # runtime libs for internal usage
    apk add --no-cache youtube-dl ffmpeg &&\

# Install sodium from source... WHAT THE F@#$???? @discord.js could you replace this thing ? It's so outdated now.
# https://github.com/paixaop/node-sodium/issues/175

# Step 1: Make folder to build
    mkdir -vp /node-modules-prebuild && cd /node-modules-prebuild &&\
# Step 2: Download and extract libsodium-1.0.18
    wget https://download.libsodium.org/libsodium/releases/libsodium-1.0.18.tar.gz &&\
    tar -zxvf libsodium-1.0.18.tar.gz && rm /node-modules-prebuild/libsodium-1.0.18.tar.gz &&\
# Step 3: Clone sodium repo
    git clone https://github.com/paixaop/node-sodium.git && cd node-sodium &&\
# Step 4: Replace existing libsodium build with the one downloaded from source
    rm -rf ./deps/libsodium &&\
    mv /node-modules-prebuild/libsodium-1.0.18 ./deps/libsodium &&\
# Step 5: Install dependencies & create link for sodium
    npm install && npm install --omit=dev && npm cache clean --force && npm link &&\
# Step 6: Optimize image size
    rm -rf test example docs COMTRIBUTING.md README.md package-lock.json .[!.]* &&\
# Code build start
    cd /code_build &&\
    npm link sodium &&\
    npm install &&\
    npm run swc:build &&\
# Optimize image size on node_modules:
    npm install --omit=dev &&\
    rm package-lock.json &&\
    npm cache clean --force &&\
    # Optimize image size on libs:
    apk del .build-deps

CMD ["npm", "run", "swc:start"]