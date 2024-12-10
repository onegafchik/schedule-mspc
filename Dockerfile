FROM node:lts-alpine as build

COPY package.json package.json
RUN npm install

COPY . .

CMD ["npm", "run", "start"]