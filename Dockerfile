FROM node:24-bookworm-slim

ENV NODE_ENV=production \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_UPDATE_NOTIFIER=false

WORKDIR /mnc-mcc-list

RUN npm install --global pnpm@10.34.5
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --chown=node:node fetch.js mcc-mnc-list.json status-codes.json ./
# The updater writes temporary files in its working directory.
RUN chown node:node /mnc-mcc-list
USER node

CMD ["node", "fetch.js"]
