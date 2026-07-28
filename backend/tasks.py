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

@app.task(name="backend.tasks.start_session_task")
def start_session_task():
    import subprocess
    import os
    import json
    
    automation_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'automation'))
    status_file = os.path.join(automation_dir, 'login_status.json')
    
    with open(status_file, "w") as f:
        json.dump({"status": "STARTING", "qr": None}, f)
        
    subprocess.Popen(['node', 'dist/login-api.js'], cwd=automation_dir)

@app.task(name="backend.tasks.stop_session_task")
def stop_session_task():
    import subprocess
    import os
    import json
    try:
        subprocess.call(['pkill', '-f', 'login-api.js'])
    except:
        pass
        
    automation_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'automation'))
    status_file = os.path.join(automation_dir, 'login_status.json')
    with open(status_file, "w") as f:
        json.dump({"status": "STOPPED", "qr": None}, f)

@app.task(name="backend.tasks.logout_session_task")
def logout_session_task():
    import subprocess
    import os
    import json
    import shutil
    try:
        subprocess.call(['pkill', '-f', 'login-api.js'])
    except:
        pass
        
    automation_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'automation'))
    status_file = os.path.join(automation_dir, 'login_status.json')
    session_dir = os.path.join(automation_dir, 'storage', 'browser-session')
    
    if os.path.exists(session_dir):
        shutil.rmtree(session_dir, ignore_errors=True)
        
    with open(status_file, "w") as f:
        json.dump({"status": "STOPPED", "qr": None}, f)
