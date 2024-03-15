#!/bin/bash
# Update the package repository
sudo apt-get update

# Install Node.js using NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash

# Source NVM script to initialize it
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install Node.js version 18.19.1
nvm install v18.19.1
nvm use v18.19.1

# Install npm globally
npm install -g npm@latest

# Install PM2 globally
npm install pm2 -g

# Install NestJs CLI globally
npm install -g @nestjs/cli