#!/bin/bash

# Wazflo Ubuntu Auto-Setup Script
# This script prepares an Ubuntu server for Wazflo (.NET 8 + Nginx)

echo "🚀 Starting Wazflo Server Setup..."

# 1. Update and install basic dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git unzip nginx

# 2. Install .NET 8
echo "📥 Installing .NET 8..."
sudo apt install -y dotnet-sdk-8.0

# 3. Install Node.js
echo "📥 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 4. Create Web Directories
echo "📂 Creating web directories..."
sudo mkdir -p /var/www/wazflo-api
sudo mkdir -p /var/www/wazflo-admin
sudo chown -R $USER:$USER /var/www/wazflo-api
sudo chown -R $USER:$USER /var/www/wazflo-admin

# 5. Setup Nginx Config Placeholder
echo "⚙️ Configuring Nginx..."
cat <<EOF | sudo tee /etc/nginx/sites-available/wazflo
server {
    listen 80;
    
    # Frontend Static Files
    location / {
        root /var/www/wazflo-admin;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    # API Reverse Proxy
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/wazflo /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo systemctl restart nginx

echo "✅ Server dependencies installed!"
echo "-------------------------------------------------------"
echo "Next Steps:"
echo "1. Upload your code to /var/www/wazflo-api and /var/www/wazflo-admin"
echo "2. Set up your SQL Server connection in appsettings.json"
echo "3. Start the API using 'dotnet run' in the API folder"
echo "-------------------------------------------------------"
