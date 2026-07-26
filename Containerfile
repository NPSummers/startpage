FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=6746

COPY --chown=node:node package.json server.js index.html manifest.json favicon.ico aureallogo.png pop.mp3 ./
COPY --chown=node:node app-assets ./app-assets
COPY --chown=node:node plugins ./plugins
COPY --chown=node:node vc-ap-d2a57d ./vc-ap-d2a57d

USER node

EXPOSE 6746

CMD ["node", "server.js"]
