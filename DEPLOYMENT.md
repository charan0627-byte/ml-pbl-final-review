# DRIS Deployment Guide 🌐

This document provides step-by-step instructions for deploying the **Disaster Risk Intelligence System (DRIS)** so that other systems, devices, and users across the internet or local network can access the web application.

---

## Deployment Options at a Glance

| Deployment Method | Target Audience | Public Access | Cost | Setup Time |
| :--- | :--- | :--- | :--- | :--- |
| **1. Cloud Hosting (Render + Vercel)** | Global users on any device | ✅ Public HTTPS URLs | **Free** | 5 minutes |
| **2. Local Network (LAN IP)** | Devices on the same Wi-Fi/router | 🏠 Local Network Only | **Free** | 1 minute |
| **3. Instant Tunnel (Cloudflare / ngrok)** | Temporary external access | ✅ Public HTTPS URL | **Free** | 1 minute |
| **4. Full Docker Containerization** | Local or VPS server | 🐳 Docker container | **Free** | 2 minutes |

---

## 1. Cloud Hosting Deployment (Render + Vercel) 🚀

This is the recommended setup for permanent, free, public hosting accessible from any phone, laptop, or remote system anywhere in the world.

### Step 1: Deploy the FastAPI Backend to Render
1. Push your repository to **GitHub**.
2. Log in to [Render.com](https://render.com/).
3. Click **New +** -> **Blueprint**.
4. Connect your GitHub repository. Render will automatically detect the included [`render.yaml`](file:///c:/Users/pavan/ml%20pbl%20final%20review/render.yaml) file.
5. Click **Apply**.
6. Once deployed, Render will provide your public backend API URL:
   `https://dris-backend.onrender.com` (Example).

> **Note**: Test your backend health by visiting `https://dris-backend.onrender.com/health` in your browser.

---

### Step 2: Deploy the React Frontend to Vercel
1. Log in to [Vercel.com](https://vercel.com/).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository.
4. Select the `frontend` folder as the Root Directory (or leave as root; the included [`vercel.json`](file:///c:/Users/pavan/ml%20pbl%20final%20review/vercel.json) handles both!).
5. Under **Environment Variables**, add:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://dris-backend.onrender.com` (Your Render backend URL from Step 1)
6. Click **Deploy**.
7. Vercel will build and assign your free public application domain:
   `https://dris-app.vercel.app` (Example).

✅ **Done!** Share `https://dris-app.vercel.app` with any user or system to access DRIS from anywhere.

---

## 2. Local Network / LAN Access (Same Wi-Fi Network) 📶

If you want other devices (laptops, phones, tablets) on the same Wi-Fi network to access DRIS without publishing to the cloud:

1. Find your computer's local IP address:
   ```powershell
   ipconfig
   # Look for "IPv4 Address", e.g., 192.168.1.50
   ```

2. Ensure Docker containers or dev servers listen on `0.0.0.0` (already configured in DRIS!).

3. Other devices on the same Wi-Fi can now open their web browser and visit:
   `http://192.168.1.50` (or `http://<YOUR_LOCAL_IP>:80`)

> **Firewall Note**: If other devices cannot connect, allow inbound traffic on port 80 and port 8000 in Windows Defender Firewall.

---

## 3. Instant Public Access via Cloudflare Tunnel / ngrok ⚡

To quickly expose your locally running DRIS application to external users over the internet without setting up cloud servers:

### Option A: Free Cloudflare Tunnel (No account required)
```bash
npx cloudflared tunnel --url http://localhost:80
```
Cloudflare will output a temporary public HTTPS URL like:
`https://random-words.trycloudflare.com`

### Option B: ngrok
```bash
ngrok http 80
```
ngrok will provide a temporary public link like:
`https://abcd-1234.ngrok-free.app`

---

## 4. Docker & Docker Compose Setup 🐳

For local production testing or deploying on a remote Linux Virtual Private Server (VPS like AWS EC2, DigitalOcean Droplet, Linode):

```powershell
# Windows runner
.\run.ps1 docker

# Or direct Docker Compose
docker compose up --build -d
```

### Port Mappings & Services
| Service | Local URL | External Access | Description |
| :--- | :--- | :--- | :--- |
| **Frontend SPA** | `http://localhost` | `http://<SERVER_IP>:80` | Complete DRIS Dashboard & Map |
| **Backend API** | `http://localhost:8000` | `http://<SERVER_IP>:8000` | FastAPI service & Swagger docs |
| **Health Endpoint** | `http://localhost/health` | `http://<SERVER_IP>/health` | System status check |
