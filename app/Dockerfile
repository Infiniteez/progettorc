FROM node:latest

WORKDIR /usr/src/app

COPY ./package.json .

RUN npm install -g nodemon --quiet
RUN npm install --quiet

ENV NODE_ENV=development
ENV PORT=3000

EXPOSE 3000

CMD [ "npm", "start" ]
