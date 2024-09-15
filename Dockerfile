FROM node:22-bookworm-slim

WORKDIR /mnc-mcc-list

COPY package.json ./

RUN npm install

COPY . .

CMD ["node", "fetch.js"]
