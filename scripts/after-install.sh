#!/bin/bash

# Set the PATH variable to include the directory where pm2 is located
export PATH="/home/ubuntu/.nvm/versions/node/v18.19.1/bin:$PATH"

cd /home/ubuntu/nestjs-app

# Stop all PM2 processes (if any)
if pm2 list | grep -q "^\s*[0-9]"; then
    pm2 stop all
    pm2 delete all
else
    echo "No PM2 processes found."
fi
