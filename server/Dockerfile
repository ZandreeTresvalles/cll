# CLL Lazada API — production image
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy application source
COPY . .

ENV NODE_ENV=production
# Render injects PORT at runtime; default to 5000 locally
ENV PORT=5000
EXPOSE 5000

CMD ["node", "server.js"]
