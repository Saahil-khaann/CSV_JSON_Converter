FROM node:20-slim

WORKDIR /app

# Copy dependency configs
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

EXPOSE 5173

# Start development server with host configuration to make it accessible outside container
CMD ["npm", "run", "dev", "--", "--host"]
