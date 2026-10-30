# OmniLearn - Multimodal Study Assistant 🎓

An autonomous multimodal AI workspace that synthesizes information scattered across PDF readings, recorded lecture audio, and whiteboard photos into unified study guides, practice quizzes, and an interactive 3D Knowledge Hub.

---

## 🚀 Key Features

1. **Multimodal Media Ingestion**:
   - Upload and process documents (`.pdf`), lecture audio recordings (`.mp3`, `.wav`), and whiteboard photos (`.png`, `.jpg`).
   - Built-in Voice Audio Recorder to dictate study notes and lecture clips directly from the browser.
2. **Gemini 3.8 Flash Multimodal Synthesis**:
   - Cross-references what was said in the audio with what was written in the textbook and drawn on the whiteboard.
   - Explicit inline source citations (`[Backpropagation_Foundations.pdf]`, `[Lecture_04_Optimization_Notes.mp3]`).
   - Generates structured exam study guides and interactive practice quizzes with immediate grading.
3. **Interactive 3D Knowledge Hub (Three.js)**:
   - Procedural 8-component Holographic Neural Core with ACESFilmic PBR studio lighting and exponential damping camera.
   - Procedural 3D Media Nodes for each file type with orbital positions, laser connections, and raycast inspection.
   - Ergonomic collapsible bottom control dock (camera presets, exploded separation slider, spin rate, and filter).
4. **Secure Authentication & Data Storage**:
   - JWT authentication with bcrypt password hashing and Zod schema validations.
   - Full Mongoose data models for `User` and `Workspace`.
   - Built-in fallback persistent data store for instant frictionless local execution without external database dependencies.

---

## 🛠 Tech Stack

- **Frontend**: React 19, Vite, React Router v7, Tailwind CSS, Axios, Lucide Icons, Three.js
- **Backend**: Node.js, Express.js, Multer (multipart uploads), Zod (request validation), JWT, bcryptjs, Mongoose
- **AI Engine**: Google Gemini API (`@google/genai`) with `gemini-3.8-flash`

---

## 💻 Local Setup & Execution

1. **Clone & Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env` file or configure via AI Studio Secrets:
   ```env
   GEMINI_API_KEY="your-gemini-api-key"
   JWT_SECRET="your-jwt-secret-key"
   MONGO_URI="" # Optional: MongoDB Atlas connection string
   PORT=3000
   ```

3. **Start the Application**:
   ```bash
   npm run dev
   ```
   The application runs on `http://localhost:3000`.

---

## 🚢 Deployment Guide

### 1. Database: MongoDB Atlas
1. Create a free M0 cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a database user and whitelist network access (`0.0.0.0/0`).
3. Copy your connection string into `MONGO_URI`.

### 2. Backend: Render / Cloud Run
1. Create a **Web Service** on [Render](https://render.com).
2. Set Environment to `Node`.
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`
5. Configure environment variables (`GEMINI_API_KEY`, `JWT_SECRET`, `MONGO_URI`).

### 3. Frontend: Vercel
1. Import repository to [Vercel](https://vercel.com).
2. Framework Preset: `Vite`.
3. Set Root Directory to `./` and Build Command to `npm run build`.
4. Configure proxy rewrites in `vercel.json` pointing `/api/*` and `/uploads/*` to your backend URL.
