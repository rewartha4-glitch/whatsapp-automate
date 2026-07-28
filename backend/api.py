from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

from . import models, database, runner

router = APIRouter(prefix="/api")

class JourneyUpload(BaseModel):
    journeyId: str
    description: str
    phone: str
    steps: List[Dict[str, Any]]

class RunRequest(BaseModel):
    journeyId: str

@router.get("/health")
def health_check():
    return {"status": "ok"}

@router.post("/journey/upload")
def upload_journey(journey_data: JourneyUpload, db: Session = Depends(database.get_db)):
    # Automatically inject "batal" steps if not present
    if journey_data.steps:
        first_step = journey_data.steps[0]
        if not (first_step.get("action") == "sendMessage" and str(first_step.get("text", "")).lower() == "batal"):
            batal_steps = [
                {
                    "action": "sendMessage",
                    "text": "batal"
                },
                {
                    "action": "waitForResponse",
                    "expected": [
                        "Saat ini Daisy tersedia di media berikut",
                        "Silahkan pilih tombol Customer Care"
                    ]
                }
            ]
            journey_data.steps = batal_steps + journey_data.steps

    # Upsert Journey
    journey = db.query(models.Journey).filter(models.Journey.id == journey_data.journeyId).first()
    if not journey:
        journey = models.Journey(
            id=journey_data.journeyId,
            description=journey_data.description,
            phone=journey_data.phone
        )
        db.add(journey)
    else:
        journey.description = journey_data.description
        journey.phone = journey_data.phone
    
    db.commit()
    
    # Create new Version
    last_version = db.query(models.JourneyVersion)\
                     .filter(models.JourneyVersion.journey_id == journey.id)\
                     .order_by(models.JourneyVersion.version.desc())\
                     .first()
                     
    new_version_num = (last_version.version + 1) if last_version else 1
    
    version = models.JourneyVersion(
        journey_id=journey.id,
        version=new_version_num,
        steps=journey_data.steps
    )
    db.add(version)
    db.commit()
    db.refresh(version)
    
    return {"status": "success", "journeyId": journey.id, "version": version.version}

@router.post("/journey/run")
def run_journey_endpoint(req: RunRequest, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db)):
    journey = db.query(models.Journey).filter(models.Journey.id == req.journeyId).first()
    if not journey:
        raise HTTPException(status_code=404, detail="Journey not found")
        
    latest_version = db.query(models.JourneyVersion)\
                       .filter(models.JourneyVersion.journey_id == journey.id)\
                       .order_by(models.JourneyVersion.version.desc())\
                       .first()
                       
    if not latest_version:
        raise HTTPException(status_code=400, detail="Journey has no versions")
        
    # Queue the journey to run via Celery
    from .tasks import run_journey_task
    run_journey_task.delay(journey.id, latest_version.id)
    
    return {"status": "queued", "journeyId": journey.id}

@router.post("/journey/run-all")
async def run_all_journeys_api(background_tasks: BackgroundTasks):
    background_tasks.add_task(runner.run_all_journeys)
    return {"status": "success", "message": "All journeys queued for execution"}

@router.post("/journey/cancel/{execution_id}")
def cancel_execution(execution_id: str, db: Session = Depends(database.get_db)):
    execution = db.query(models.JourneyExecution).filter(models.JourneyExecution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
        
    if execution.status == "RUNNING":
        import subprocess
        from datetime import datetime
        try:
            # The execution_id is passed as an argument to the node script, so pkill -f will find it
            subprocess.call(['pkill', '-f', execution_id])
            execution.status = "CANCELLED"
            execution.end_time = datetime.utcnow()
            db.commit()
            return {"status": "success", "message": "Execution cancelled"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
            
    return {"status": "success", "message": "Execution is not running"}

@router.post("/journey/validate")
def validate_journey(journey_data: JourneyUpload):
    # Basic validation of steps format
    if not journey_data.steps:
        return {"valid": False, "error": "Journey has no steps"}
    return {"valid": True}

@router.get("/journeys")
def get_journeys(db: Session = Depends(database.get_db)):
    journeys = db.query(models.Journey).filter(models.Journey.is_active == True).order_by(models.Journey.created_at.desc()).all()
    result = []
    for j in journeys:
        latest_version = db.query(models.JourneyVersion)\
                           .filter(models.JourneyVersion.journey_id == j.id)\
                           .order_by(models.JourneyVersion.version.desc())\
                           .first()
        result.append({
            "id": j.id,
            "description": j.description,
            "phone": j.phone,
            "created_at": j.created_at,
            "version": latest_version.version if latest_version else 0,
            "step_count": len(latest_version.steps) if latest_version and latest_version.steps else 0
        })
    return result

@router.get("/journey/{journey_id}")
def get_journey_detail(journey_id: str, db: Session = Depends(database.get_db)):
    journey = db.query(models.Journey).filter(models.Journey.id == journey_id, models.Journey.is_active == True).first()
    if not journey:
        raise HTTPException(status_code=404, detail="Journey not found")
        
    latest_version = db.query(models.JourneyVersion)\
                       .filter(models.JourneyVersion.journey_id == journey.id)\
                       .order_by(models.JourneyVersion.version.desc())\
                       .first()
                       
    return {
        "id": journey.id,
        "description": journey.description,
        "phone": journey.phone,
        "steps": latest_version.steps if latest_version else []
    }

@router.delete("/journey/{journey_id}")
def delete_journey(journey_id: str, db: Session = Depends(database.get_db)):
    journey = db.query(models.Journey).filter(models.Journey.id == journey_id).first()
    if not journey:
        raise HTTPException(status_code=404, detail="Journey not found")
        
    journey.is_active = False
    db.commit()
    return {"status": "success", "message": "Journey deleted"}

@router.get("/history")
def get_history(db: Session = Depends(database.get_db), limit: int = 10):
    executions = db.query(models.JourneyExecution).order_by(models.JourneyExecution.start_time.desc()).limit(limit).all()
    return [
        {
            "id": ex.id,
            "journey_id": ex.journey_id,
            "version_id": ex.version_id,
            "status": ex.status,
            "start_time": ex.start_time,
            "end_time": ex.end_time,
            "duration_ms": ex.duration_ms,
            "worker_id": ex.worker_id,
            "video_path": ex.video_path,
            "trace_path": ex.trace_path
        }
        for ex in executions
    ]

@router.get("/history/{execution_id}")
def get_history_detail(execution_id: str, db: Session = Depends(database.get_db)):
    execution = db.query(models.JourneyExecution).filter(models.JourneyExecution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    steps = db.query(models.JourneyExecutionStep).filter(models.JourneyExecutionStep.execution_id == execution_id).order_by(models.JourneyExecutionStep.step_index).all()
    
    return {
        "execution": {
            "id": execution.id,
            "journey_id": execution.journey_id,
            "status": execution.status,
            "start_time": execution.start_time,
            "end_time": execution.end_time,
            "duration_ms": execution.duration_ms
        },
        "steps": [
            {
                "id": step.id,
                "step_index": step.step_index,
                "action": step.action,
                "status": step.status,
                "error_message": step.error_message,
                "start_time": step.start_time,
                "end_time": step.end_time,
                "duration_ms": step.duration_ms,
                "screenshot_path": step.screenshot_path
            }
            for step in steps
        ]
    }

class ScheduleRequest(BaseModel):
    cron: str
    enabled: bool

@router.get("/schedule")
def get_schedule(db: Session = Depends(database.get_db)):
    cron_config = db.query(models.Configuration).filter(models.Configuration.key == "schedule_cron").first()
    enabled_config = db.query(models.Configuration).filter(models.Configuration.key == "schedule_enabled").first()
    
    return {
        "cron": cron_config.value if cron_config else "0 * * * *",
        "enabled": enabled_config.value == "true" if enabled_config else False
    }

@router.post("/schedule")
def update_schedule_endpoint(req: ScheduleRequest, db: Session = Depends(database.get_db)):
    # Upsert cron
    cron_config = db.query(models.Configuration).filter(models.Configuration.key == "schedule_cron").first()
    if not cron_config:
        cron_config = models.Configuration(key="schedule_cron", value=req.cron)
        db.add(cron_config)
    else:
        cron_config.value = req.cron
        
    # Upsert enabled
    enabled_config = db.query(models.Configuration).filter(models.Configuration.key == "schedule_enabled").first()
    if not enabled_config:
        enabled_config = models.Configuration(key="schedule_enabled", value="true" if req.enabled else "false")
        db.add(enabled_config)
    else:
        enabled_config.value = "true" if req.enabled else "false"
        
    db.commit()
    
    # Update running scheduler
    from .scheduler import update_schedule
    update_schedule(req.cron, req.enabled)
    
    return {"status": "success"}

@router.get("/worker")
def get_workers(db: Session = Depends(database.get_db)):
    workers = db.query(models.Worker).all()
    return workers

@router.post("/session/start")
def start_session():
    from .tasks import start_session_task
    start_session_task.delay()
    return {"status": "started"}

@router.get("/session/status")
def get_session_status():
    import os
    import json
    
    automation_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'automation'))
    status_file = os.path.join(automation_dir, 'login_status.json')
    
    if os.path.exists(status_file):
        with open(status_file, "r") as f:
            try:
                return json.load(f)
            except:
                return {"status": "STARTING", "qr": None}
    return {"status": "STOPPED", "qr": None}

@router.post("/session/stop")
def stop_session():
    from .tasks import stop_session_task
    stop_session_task.delay()
    return {"status": "stopped"}

@router.post("/session/logout")
def logout_session():
    from .tasks import logout_session_task
    logout_session_task.delay()
    return {"status": "logging_out"}

