# Bruno Credits - NBFC Mobile Web Platform

Powered by **Vistas Tecnolabs Finance Limited** (RBI Registered NBFC).

## Deployment Architecture

- **Frontend**: Hosted on **Vercel** (`https://<your-project>.vercel.app`)
- **Backend API**: Hosted on **Render** (`https://<your-service>.onrender.com`)
- **Payment Gateway**: Ready for Cashfree / Razorpay / PhonePe integration

### 1. Frontend on Vercel
1. In Vercel dashboard, click **"Add New..."** -> **"Project"**.
2. Select the repository **`apexloan-app`** from your GitHub account.
3. Root Directory: leave as default (`./`).
4. Framework Preset: **Other**.
5. Click **Deploy**. Vercel will serve all clean routes (`/login`, `/apply`, `/dashboard`).

### 2. Backend on Render
1. In Render dashboard, click **"New +"** -> **"Web Service"**.
2. Connect your GitHub repository **`apexloan-app`**.
3. Set **Root Directory**: `backend`
4. **Build Command**: `npm install`
5. **Start Command**: `npm start`
6. Click **Deploy Web Service**.
