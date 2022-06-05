FROM node:latest

WORKDIR /usr/src/app

COPY ./package*.json ./

RUN npm update -g npm
RUN npm install -g nodemon --quiet
RUN npm install --quiet

EXPOSE 3000

CMD [ "npm", "start"]
