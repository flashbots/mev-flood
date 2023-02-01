# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy app dependencies
COPY package.json ./
COPY package-lock.json ./


# Install app dependencies
RUN yarn install

# Copy app source code
COPY . .


# Build the app
RUN yarn build


# Run stage
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/dist ./

# Run the demon
CMD ["yarn", "$CMD", "$ARGS"]
