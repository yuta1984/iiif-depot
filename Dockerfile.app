FROM node:20-alpine

WORKDIR /app

# Install ImageMagick with JPEG/PNG/TIFF support
RUN apk add --no-cache \
    imagemagick \
    imagemagick-jpeg \
    imagemagick-tiff \
    libjpeg-turbo \
    libpng \
    tiff

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Remove devDependencies after build
RUN npm prune --production

# Create data directories and set ownership to non-root node user
RUN mkdir -p /data/db /data/images/original /data/images/ptiff \
    && chown -R node:node /data /app

USER node

EXPOSE 3000

CMD ["node", "dist/index.js"]
