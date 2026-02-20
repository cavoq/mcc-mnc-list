FROM node:22-bookworm-slim

ENV NODE_ENV=production \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_UPDATE_NOTIFIER=false

WORKDIR /mnc-mcc-list

COPY package*.json ./

# `fetch.js` requires `jsdom`, which currently lives in devDependencies.
RUN npm install --include=dev --omit=optional && npm cache clean --force

COPY --chown=node:node . .

USER node

CMD ["node", "fetch.js"]
