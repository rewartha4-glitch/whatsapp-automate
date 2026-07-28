import os
import json
import uuid
import asyncio
import subprocess
from datetime import datetime
from sqlalchemy.orm import Session
from . import models, telegram

AUTOMATION_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'automation'))

async def run_journey(db: Session, journey: models.Journey, journey_version: models.JourneyVersion, send_alert: bool = True):
    execution_id = str(uuid.uuid4())
    
    # 1. Create Execution Record
    execution = models.JourneyExecution(
        id=execution_id,
        journey_id=journey.id,
        version_id=journey_version.id,
        status="RUNNING",
        start_time=datetime.utcnow()
    )
    db.add(execution)
    db.commit()
    
    # 2. Write Journey JSON to temp file
    journey_data = {
        "journeyId": journey.id,
        "description": journey.description,
        "phone": journey.phone,
        "steps": journey_version.steps
    }
    
    temp_json_path = os.path.join(AUTOMATION_DIR, f"{execution_id}.json")
    with open(temp_json_path, "w") as f:
        json.dump(journey_data, f)
        
    try:
        # 3. Run Playwright automation via subprocess
        # Assuming the TypeScript code is compiled to dist/runner.js
        cmd = ["node", "dist/runner.js", temp_json_path, execution_id]
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=AUTOMATION_DIR,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await process.communicate()
        
        # 4. Parse Output
        try:
            result = json.loads(stdout.decode().strip())
        except Exception as e:
            result = {
                "status": "FAIL",
                "error": f"Failed to parse runner output: {e}\nStderr: {stderr.decode()}"
            }
        
        # 5. Update Execution Record
        execution.end_time = datetime.utcnow()
        execution.status = result.get("status", "FAIL")
        execution.duration_ms = result.get("durationMs", 0)
        execution.video_path = result.get("videoPath")
        execution.trace_path = result.get("tracePath")
        
        # 6. Save Steps
        steps_result = result.get("steps", [])
        failed_step = None
        
        for idx, step_data in enumerate(steps_result):
            step = models.JourneyExecutionStep(
                execution_id=execution.id,
                step_index=idx + 1,
                action=step_data.get("action"),
                expected=json.dumps(step_data.get("expected")) if isinstance(step_data.get("expected"), (list, dict)) else step_data.get("expected"),
                actual=json.dumps(step_data.get("actual")) if isinstance(step_data.get("actual"), (list, dict)) else step_data.get("actual"),
                status=step_data.get("status", "FAIL"),
                screenshot_path=step_data.get("screenshotPath"),
                duration_ms=step_data.get("durationMs", 0)
            )
            db.add(step)
            
            if step.status == "FAIL":
                failed_step = step
                
        db.commit()
        
        # 7. Send Telegram Notification
        if send_alert:
            if execution.status == "PASS":
                msg = telegram.format_success_message(journey.description, int((execution.duration_ms or 0) / 1000))
                await telegram.send_telegram_message(msg)
            else:
                if failed_step:
                    msg = telegram.format_failure_message(
                        journey.description,
                        failed_step.step_index,
                        failed_step.expected or "-",
                        failed_step.actual or result.get("error", "-")
                    )
                else:
                    msg = telegram.format_failure_message(
                        journey.description,
                        0,
                        "-",
                        result.get("error", "Unknown Error")
                    )
                await telegram.send_telegram_message(msg)
            
    finally:
        if os.path.exists(temp_json_path):
            os.remove(temp_json_path)
            
    return execution

async def run_all_journeys():
    from .database import SessionLocal
    import time
    db = SessionLocal()
    try:
        start_time = time.time()
        # Get all active journeys
        journeys = db.query(models.Journey).filter(models.Journey.is_active == True).order_by(models.Journey.id).all()
        
        results = []
        for index, journey in enumerate(journeys):
            latest_version = db.query(models.JourneyVersion)\
                               .filter(models.JourneyVersion.journey_id == journey.id)\
                               .order_by(models.JourneyVersion.version.desc())\
                               .first()
            if not latest_version:
                continue
                
            execution = await run_journey(db, journey, latest_version, send_alert=False)
            results.append((execution, journey))
            
            # Delay 5 seconds between runs to prevent overload, except for the last one
            if index < len(journeys) - 1:
                await asyncio.sleep(5)
                
        end_time = time.time()
        total_time_sec = int(end_time - start_time)
        mins, secs = divmod(total_time_sec, 60)
        time_str = f"{mins}m {secs}s" if mins > 0 else f"{secs}s"

        # Generate summary
        total = len(results)
        failed_executions = [(ex, j) for ex, j in results if ex.status != "PASS"]
        
        if not failed_executions:
            msg = f"✅ SUMMARY: ALL FLOWS AMAN ({total}/{total} sukses)\n⏱️ Total Waktu: {time_str}"
        else:
            msg = f"❌ SUMMARY: Terdapat kegagalan! ({total - len(failed_executions)}/{total} sukses)\n⏱️ Total Waktu: {time_str}\n\nFlow yang gagal:"
            for ex, j in failed_executions:
                msg += f"\n- {j.description}"
                
        await telegram.send_telegram_message(msg)
        
        # --- Auto Zip Screenshots ---
        import zipfile
        import glob
        from datetime import datetime
        
        screenshots_dir = os.path.join(AUTOMATION_DIR, '..', 'screenshots')
        timestamp_str = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        zip_filename = os.path.join(screenshots_dir, f"batch_screenshots_{timestamp_str}.zip")
        
        png_files = [f for f in glob.glob(os.path.join(screenshots_dir, "*.png")) if "qr_code.png" not in f]
        
        if png_files:
            try:
                with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
                    for file in png_files:
                        zipf.write(file, os.path.basename(file))
                
                # Clean up raw PNGs after zipping to save space
                for file in png_files:
                    os.remove(file)
                print(f"Successfully zipped {len(png_files)} screenshots into {zip_filename}")
            except Exception as e:
                print(f"Failed to zip screenshots: {e}")
        
    except Exception as e:
        print(f"Error in run_all_journeys: {e}")
    finally:
        db.close()


