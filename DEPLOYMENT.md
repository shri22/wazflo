# Ubuntu Deployment Guide for Wazflo

This guide explains how to deploy the **Wazflo .NET API** and **React Admin Panel** to an Ubuntu 22.04/24.04 server.

## 1. Prerequisites on Ubuntu Server
Run these commands on your Ubuntu server to install the necessary runtimes:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install .NET 8 SDK & Runtime
sudo apt install -y dotnet-sdk-8.0

# Install Nginx
sudo apt install -y nginx

# Install Node.js (for building frontend if needed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

## 2. Setting up SQL Server on Linux
If you don't have a database yet, you can install SQL Server for Linux:
```bash
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | sudo tee /etc/apt/trusted.gpg.d/microsoft.asc
sudo add-apt-repository "$(wget -qO- https://packages.microsoft.com/config/ubuntu/22.04/mssql-server-2022.list)"
sudo apt update
sudo apt install -y mssql-server
# Follow prompts to set SA password
sudo /opt/mssql/bin/mssql-conf setup
```

## 3. Deploying the Backend (.NET API)
1. **Upload your code** to `/var/www/wazflo-api`.
2. **Publish the app:**
   ```bash
   cd /var/www/wazflo-api
   dotnet publish -c Release -o ./publish
   ```
3. **Configure Systemd Service:**
   Create `/etc/systemd/system/wazflo-api.service`:
   ```ini
   [Unit]
   Description=Wazflo .NET API
   After=network.target

   [Service]
   WorkingDirectory=/var/www/wazflo-api/publish
   ExecStart=/usr/bin/dotnet Wazflo.Api.dll
   Restart=always
   RestartSec=10
   KillSignal=SIGINT
   SyslogIdentifier=wazflo-api
   Environment=ASPNETCORE_ENVIRONMENT=Production
   Environment=DOTNET_PRINT_TELEMETRY_MESSAGE=false

   [Install]
   WantedBy=multi-user.target
   ```
4. **Start Service:**
   ```bash
   sudo systemctl enable wazflo-api
   sudo systemctl start wazflo-api
   ```

## 4. Deploying the Frontend (React Admin)
1. **Update .env:** Change `VITE_API_URL` to your server's domain or IP.
2. **Build:**
   ```bash
   cd admin-panel
   npm install
   npm run build
   ```
3. **Move to web root:**
   ```bash
   sudo mkdir -p /var/www/wazflo-admin
   sudo cp -r dist/* /var/www/wazflo-admin/
   ```

## 5. Configure Nginx (Reverse Proxy)
Create `/etc/nginx/sites-available/wazflo`:
```nginx
server {
    listen 8081; # Use a specific port to avoid disturbing existing projects on port 80
    server_name 193.203.160.3;

    # Frontend
    location / {
        root /var/www/wazflo/admin;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API Proxy
    location /api/ {
        proxy_pass http://localhost:5001; # Point to the .NET API port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Enable and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/wazflo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```
