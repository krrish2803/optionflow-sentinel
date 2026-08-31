# Local Setup Guide

Follow these steps to run OptionFlow Sentinel on your local machine.

## Prerequisites
*   Node.js (v18+)
*   Python 3.9+
*   MongoDB (running on `localhost:27017`)
*   Redis (running on `localhost:6379`)

## 1. Backend Setup
1. Navigate to the backend directory: `cd backend`
2. Create a virtual environment: `python3 -m venv venv`
3. Activate the environment: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Create a `.env` file containing your security keys and `NVIDIA_API_KEY`.
6. Start the FastAPI server: `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
7. Start the Celery worker (in a separate terminal): `celery -A app.worker.celery_app worker --loglevel=info`

## 2. Frontend Setup
1. Navigate to the root directory (where `package.json` is located).
2. Install dependencies: `npm install`
3. Start the Vite dev server: `npm run dev`
4. Open `http://localhost:3000` in your browser!
