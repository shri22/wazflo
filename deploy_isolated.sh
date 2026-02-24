#!/bin/bash

# Wazflo Enterprise Production Deployment (193.203.160.3)
# Domains: wazflo.com, api.wazflo.com, app.wazflo.com

echo "🚀 Starting Enterprise Deployment Setup..."

# 1. Create isolated directories
sudo mkdir -p /var/www/wazflo_enterprise/api
sudo mkdir -p /var/www/wazflo_enterprise/web/admin
sudo mkdir -p /var/www/wazflo_enterprise/web/landing
sudo chown -R $USER:$USER /var/www/wazflo_enterprise

# 2. Firewall setup
sudo ufw allow 3001/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 3. .NET Systemd Service
cat <<EOF | sudo tee /etc/systemd/system/wazflo-api.service
[Unit]
Description=Wazflo .NET Enterprise API
After=network.target

[Service]
WorkingDirectory=/var/www/wazflo_enterprise/api
ExecStart=/usr/bin/dotnet Wazflo.Api.dll
Restart=always
RestartSec=10
Environment=ASPNETCORE_ENVIRONMENT=Production

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable wazflo-api

# 4. Nginx Multi-Domain Configuration
cat <<EOF | sudo tee /etc/nginx/sites-available/wazflo_enterprise
# 1. Admin Dashboard (app.wazflo.com)
server {
    listen 80;
    server_name app.wazflo.com;

    location / {
        root /var/www/wazflo_enterprise/web/admin;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }
}

# 2. .NET API (api.wazflo.com)
server {
    listen 80;
    server_name api.wazflo.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

# 3. Main Landing Page (wazflo.com)
server {
    listen 80;
    server_name wazflo.com www.wazflo.com;

    location / {
        root /var/www/wazflo_enterprise/web/landing;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

if [ -f /etc/nginx/sites-enabled/default ]; then
    sudo rm /etc/nginx/sites-enabled/default
fi

sudo ln -sf /etc/nginx/sites-available/wazflo_enterprise /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

echo "✅ Deployment structure and Nginx configured!"
echo "Checklist:"
echo "- API code copied to /var/www/wazflo_enterprise/api"
echo "- Admin Dashboard build (dist) copied to /var/www/wazflo_enterprise/web/admin"
echo "- Landing page copied to /var/www/wazflo_enterprise/web/landing"
echo "- Run 'dotnet publish' on the server inside the API folder"
echo "- Run 'sudo systemctl restart wazflo-api'"
