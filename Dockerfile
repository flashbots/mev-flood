# Use an official Node runtime as a parent image for the builder
FROM node:16 as builder

# Set the working directory in the builder
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install app dependencies and build the application
RUN cd core && rm -f ./src/output/wallets.json && yarn install --network-timeout 1000000 && yarn script.createWallets && yarn build && cd ..
RUN cd cli && yarn install --network-timeout 1000000 && yarn build && cd ..

# Use an official Node runtime as a parent image for the runtime stage
FROM node:16 as runtime

# Set the working directory in the runtime container to /app/cli/bin
WORKDIR /app/cli/bin

# Copy only the built application from the builder stage
COPY --from=builder /app /app

ENTRYPOINT ["./run"]
