# Use the official Node.js image as the base image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the Prisma schema and configuration files
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy the rest of the application code to the working directory
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose the port your application runs on (if applicable)
EXPOSE 3000

# Set the command to run your application
CMD ["npm", "run", "start:dev"]