import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

from . import models, api
from .database import engine

# Create database tables
models.Base.metadata.create_all(bind=engine)

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
API_PORT = int(os.getenv("API_PORT", "8000"))

app = FastAPI(title="WhatsApp Chatbot Monitoring API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api.router)

@app.on_event("startup")
def startup_event():
    from .scheduler import start_scheduler, update_schedule
    start_scheduler()
    
    # Load config from db and start
    from .database import SessionLocal
    db = SessionLocal()
    try:
        cron_config = db.query(models.Configuration).filter(models.Configuration.key == "schedule_cron").first()
        enabled_config = db.query(models.Configuration).filter(models.Configuration.key == "schedule_enabled").first()
        if cron_config and enabled_config:
            update_schedule(cron_config.value, enabled_config.value == "true")
    except Exception as e:
        print(f"Failed to load schedule from DB: {e}")
    finally:
        db.close()

@app.on_event("shutdown")
def shutdown_event():
    from .scheduler import stop_scheduler
    stop_scheduler()

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=API_PORT, reload=True)
