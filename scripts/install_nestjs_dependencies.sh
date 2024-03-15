#!/bin/bash

# Set ownership to the ubuntu user
sudo chown -R ubuntu:ubuntu /home/ubuntu/nestjs-app

# Load NVM and use the correct Node version
export NVM_DIR="/home/ubuntu/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 18.19.1

cd /home/ubuntu/nestjs-app

# Install dependencies without unsafe permissions
npm install