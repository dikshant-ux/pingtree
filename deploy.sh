#!/bin/bash

# Configuration
if [ -f "backend/.env" ]; then
    # Load DOMAIN from backend/.env (assuming it might be BASE_URL or FRONTEND_URL)
    # Extracting the host from BASE_URL
    DOMAIN=$(grep BASE_URL backend/.env | cut -d'=' -f2 | sed 's/https\?:\/\///' | sed 's/\/.*//')
else
    DOMAIN="js.trustedagentforyou.com"
fi
EMAIL="dikshantbhatiya21@gmail.com"

echo "🚀 Starting Production Deployment for $DOMAIN"

# 1. Start Services (Nginx will start in Port 80 mode initially)
echo "📦 Building and starting containers..."
docker compose up -d --build

# 2. Check if SSL Certificate exists
CERT_PATH="./certbot/conf/live/$DOMAIN/fullchain.pem"

if [ ! -f "$CERT_PATH" ]; then
    echo "🔐 SSL Certificate not found. Requesting from Let's Encrypt..."
    
    # Run Certbot challenge
    docker compose run --rm certbot certonly --webroot --webroot-path /var/www/certbot/ \
        -d $DOMAIN --email $EMAIL --agree-tos --no-eff-email
    
    if [ $? -eq 0 ]; then
        echo "✅ SSL Certificate successfully generated!"
        
        # 3. Enable SSL in Nginx Config
        echo "🔧 Enabling SSL in Nginx configuration..."
        # Uncomment SSL lines in nginx.conf
        sed -i 's/# listen 443 ssl/listen 443 ssl/g' ./nginx/nginx.conf
        sed -i 's/# ssl_certificate/ssl_certificate/g' ./nginx/nginx.conf
        
        # 4. Restart Nginx to apply changes
        echo "♻️ Reloading Nginx with SSL..."
        docker compose exec nginx nginx -t && docker compose restart nginx
    else
        echo "❌ SSL Generation failed. Please check your domain A records."
        exit 1
    fi
else
    echo "✅ SSL Certificate already exists. Skipping Certbot."
fi

echo "🚀 Deployment Complete! Your app should be live at https://$DOMAIN"
