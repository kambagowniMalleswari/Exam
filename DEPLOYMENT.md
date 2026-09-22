# Production Deployment & DevOps Operations Guide

This guide provides instructions for deploying the **Enterprise Multi-Tenant MCQ Portal** across bare-metal servers, VPS instances (AWS EC2, DigitalOcean, Hetzner), or containerized environments (Docker Compose / Kubernetes).

---

## 1. Production Architecture

```mermaid
graph LR
    User["Web Browser / Client"] -->|"HTTPS: 443"| Nginx["NGINX Reverse Proxy & SSL Termination"]
    
    subgraph Host Server
        Nginx -->|"Static Assets (HTML, CSS, JS)"| Dist["/var/www/frontend/dist"]
        Nginx -->|"Proxy /api to localhost:5000"| Node["Node.js Cluster (PM2 / Docker)"]
        Node -->|"MongoDB URI with Auth"| Mongo[("MongoDB Atlas / Replica Set")]
    end
```

---

## 2. Dockerized Deployment (Recommended)

### A. Backend Dockerfile (`backend/Dockerfile`)
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000
ENV NODE_ENV=production
CMD ["node", "server.js"]
```

### B. Frontend Dockerfile (`frontend/Dockerfile`)
```dockerfile
# Stage 1: Build static bundle
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve via high-performance NGINX
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### C. Docker Compose (`docker-compose.yml`)
```yaml
version: "3.8"

services:
  mongodb:
    image: mongo:6.0
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: portalAdmin
      MONGO_INITDB_ROOT_PASSWORD: SecureMongoPassword123!
    volumes:
      - mongo_data:/data/db
    networks:
      - internal_net

  backend:
    build: ./backend
    restart: always
    environment:
      PORT: 5000
      NODE_ENV: production
      MONGO_URI: mongodb://portalAdmin:SecureMongoPassword123!@mongodb:27017/mcq_portal?authSource=admin
      JWT_SECRET: ProductionUltraSecureSecretKeyHex987654321
      JWT_EXPIRE: 7d
      CLIENT_URL: https://examportal.example.com
    depends_on:
      - mongodb
    networks:
      - internal_net

  frontend:
    build: ./frontend
    restart: always
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    networks:
      - internal_net

volumes:
  mongo_data:

networks:
  internal_net:
    driver: bridge
```

---

## 3. Native Linux Server Deployment (PM2 + NGINX)

### Step 1: Install Dependencies
```bash
# Update package registry
sudo apt update && sudo apt upgrade -y

# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs nginx git

# Install PM2 process manager globally
sudo npm install -g pm2
```

### Step 2: Clone and Build Project
```bash
# Clone repository
cd /var/www
git clone <repository_url> mcq-portal
cd mcq-portal

# Install Backend
cd backend
npm install --production
cp .env.example .env
nano .env # Configure production MONGO_URI and JWT_SECRET

# Install and Build Frontend
cd ../frontend
npm install
npm run build
```

### Step 3: Run Backend with PM2
```bash
cd /var/www/mcq-portal/backend
pm2 start server.js --name "mcq-api" -i max
pm2 save
pm2 startup
```

### Step 4: Configure NGINX Reverse Proxy
Create configuration file `/etc/nginx/sites-available/mcq-portal`:

```nginx
server {
    listen 80;
    server_name examportal.example.com;

    # Gzip compression for high speed
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Frontend Static SPA Assets
    location / {
        root /var/www/mcq-portal/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API Reverse Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 20M;
    }
}
```

Enable site and restart NGINX:
```bash
sudo ln -s /etc/nginx/sites-available/mcq-portal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5: Install SSL with Let's Encrypt (Certbot)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d examportal.example.com
```

---

## 4. Production Security Checklist

- [x] **Secure Random JWT Secrets**: Ensure `JWT_SECRET` is at least 64 random alphanumeric characters.
- [x] **Database Isolation**: Ensure MongoDB port 27017 is bound only to `127.0.0.1` or inside an internal Docker network, never exposed to public internet.
- [x] **CORS Lockdown**: Set `CLIENT_URL` explicitly in `backend/.env` to allow incoming API calls only from your verified production domain.
- [x] **Client Sanitization**: The `/api/questions/test/:testId/student` endpoint ensures students cannot view answers via browser developer tools.
- [x] **Automated Evaluation**: Answers are graded exclusively on the server side using the ground truth database records.
- [x] **Rate Limiting**: Implement Express rate-limiting middleware on `/api/auth/login` and `/api/auth/register` to prevent credential stuffing and brute-force attacks.

---

## 5. Maintenance & Telemetry

### Monitoring PM2 Processes
```bash
pm2 status
pm2 logs mcq-api --lines 100
pm2 monit
```

### Backing up MongoDB
```bash
mongodump --uri="mongodb://..." --out="/backup/mongo_$(date +%F)"
```
