FROM node:20-alpine

WORKDIR /app

# Install system dependencies for Baileys/Puppeteer if needed (Baileys usually pure Node, but just in case)
# RUN apk add --no-cache git

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
