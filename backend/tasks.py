import asyncio
from .celery_app import app
from .database import SessionLocal
from .models import Journey, JourneyVersion
from .runner import run_journey as async_run_journey

@app.task(name="backend.tasks.run_journey_task")
def run_journey_task(journey_id: str, version_id: int):
    db = SessionLocal()
    try:
        journey = db.query(Journey).filter(Journey.id == journey_id).first()
        version = db.query(JourneyVersion).filter(JourneyVersion.id == version_id).first()
        
        if not journey or not version:
            return {"status": "FAIL", "error": "Journey or Version not found"}
            
        result = asyncio.run(async_run_journey(db, journey, version, send_alert=True))
        
        return {"status": "SUCCESS", "execution_id": result.id}
    except Exception as e:
        return {"status": "FAIL", "error": str(e)}
    finally:
        db.close()
