FROM node:latest

WORKDIR /usr/src/app

COPY ./package.json .

RUN npm install -g nodemon --quiet
RUN npm install --quiet

ENV NODE_ENV=development
ENV PORT=8888

EXPOSE 8888

CMD [ "nodemon", "-L", "app.js" ]
