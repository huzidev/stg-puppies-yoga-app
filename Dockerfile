# Base image
FROM node:21-alpine AS base

RUN apk add --no-cache xdg-utils bash

EXPOSE 3000
ENV PORT=3000

# WORKDIR /app
WORKDIR /app

# ENV NODE_ENV=production

# Install dependencies
COPY package.json ./
RUN npm install

# Install required tools
RUN apk add --no-cache xdg-utils bash

RUN npm install -g @shopify/cli@latest

RUN ls

# Copy app source code
COPY . .


# Development environment
FROM base AS development
CMD ["npm", "run", "dev"]
