#!/bin/bash
export PATH="/home/ubuntu/.nvm/versions/node/v18.19.1/bin:$PATH"

cd /home/ubuntu/nestjs-app
sudo chown -R ubuntu:ubuntu /home/ubuntu/nestjs-app
pm2 start npm --name "api-orange-marketcap" -- start
