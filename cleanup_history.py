import os
from datetime import datetime, timedelta
from backend.database import SessionLocal
from backend.models import JourneyExecution, JourneyExecutionStep, ExecutionAttachment

# Konfigurasi: Hapus data yang lebih tua dari berapa hari?
DAYS_TO_KEEP = 30 
AUTOMATION_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), 'automation'))

def delete_physical_file(filepath):
    if filepath and os.path.exists(filepath):
        try:
            os.remove(filepath)
            print(f"Deleted file: {filepath}")
        except Exception as e:
            print(f"Gagal menghapus file {filepath}: {e}")

def cleanup_old_history():
    db = SessionLocal()
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=DAYS_TO_KEEP)
        print(f"Mencari data sebelum {cutoff_date}...")

        # Ambil eksekusi yang lama
        old_executions = db.query(JourneyExecution).filter(JourneyExecution.start_time < cutoff_date).all()
        
        if not old_executions:
            print("Tidak ada data lama yang perlu dihapus.")
            return

        print(f"Ditemukan {len(old_executions)} eksekusi history lama. Memulai proses penghapusan...")

        for execution in old_executions:
            # 1. Hapus file fisik (Video & Trace)
            delete_physical_file(execution.video_path)
            delete_physical_file(execution.trace_path)
            
            # 2. Ambil dan hapus data & file langkah (Steps)
            steps = db.query(JourneyExecutionStep).filter(JourneyExecutionStep.execution_id == execution.id).all()
            for step in steps:
                delete_physical_file(step.screenshot_path)
                db.delete(step)
            
            # 3. Ambil dan hapus attachment jika ada
            attachments = db.query(ExecutionAttachment).filter(ExecutionAttachment.execution_id == execution.id).all()
            for att in attachments:
                delete_physical_file(att.path)
                db.delete(att)

            # 4. Hapus data Execution itu sendiri
            db.delete(execution)

        db.commit()
        print(f"✅ Berhasil menghapus {len(old_executions)} history beserta file fisiknya.")

    except Exception as e:
        db.rollback()
        print(f"❌ Terjadi kesalahan saat cleanup: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_old_history()
