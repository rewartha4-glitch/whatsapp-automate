from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import asyncio

# Global scheduler instance
scheduler = AsyncIOScheduler()

def start_scheduler():
    if not scheduler.running:
        scheduler.start()

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()

async def execute_scheduled_journeys():
    from . import runner
    print("Executing scheduled journeys...")
    await runner.run_all_journeys()

def update_schedule(cron_expression: str, enabled: bool):
    # Remove existing job if any
    if scheduler.get_job("run_all_journeys_job"):
        scheduler.remove_job("run_all_journeys_job")
    
    if enabled and cron_expression:
        try:
            trigger = CronTrigger.from_crontab(cron_expression)
            scheduler.add_job(
                execute_scheduled_journeys, 
                trigger=trigger, 
                id="run_all_journeys_job",
                replace_existing=True
            )
            print(f"Schedule updated: {cron_expression}")
        except Exception as e:
            print(f"Invalid cron expression: {e}")
