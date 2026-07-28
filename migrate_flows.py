import sys
import json
from sqlalchemy.orm import Session
try:
    from backend.database import SessionLocal, engine
    from backend import models
except ModuleNotFoundError:
    # Jika dijalankan dari dalam Docker (dimana isi backend/ ada di root /app)
    from database import SessionLocal, engine
    import models

def export_flows(filename="flows_backup.json"):
    db: Session = SessionLocal()
    try:
        journeys = db.query(models.Journey).all()
        versions = db.query(models.JourneyVersion).all()
        
        data = {
            "journeys": [
                {
                    "id": j.id,
                    "description": j.description,
                    "phone": j.phone,
                    "is_active": j.is_active,
                    "created_at": j.created_at.isoformat() if j.created_at else None
                } for j in journeys
            ],
            "versions": [
                {
                    "id": v.id,
                    "journey_id": v.journey_id,
                    "version": v.version,
                    "steps": v.steps,
                    "created_at": v.created_at.isoformat() if v.created_at else None
                } for v in versions
            ]
        }
        
        with open(filename, 'w') as f:
            json.dump(data, f, indent=4)
        print(f"Berhasil meng-export {len(journeys)} Flows ke {filename}")
    finally:
        db.close()

def import_flows(filename="flows_backup.json"):
    db: Session = SessionLocal()
    try:
        with open(filename, 'r') as f:
            data = json.load(f)
            
        print("Memulai import data...")
        
        # Import journeys
        for j_data in data.get("journeys", []):
            existing = db.query(models.Journey).filter(models.Journey.id == j_data["id"]).first()
            if not existing:
                journey = models.Journey(
                    id=j_data["id"],
                    description=j_data["description"],
                    phone=j_data["phone"],
                    is_active=j_data["is_active"]
                )
                # created_at handled by default
                db.add(journey)
                
        # Import versions
        for v_data in data.get("versions", []):
            existing = db.query(models.JourneyVersion).filter(
                models.JourneyVersion.journey_id == v_data["journey_id"],
                models.JourneyVersion.version == v_data["version"]
            ).first()
            
            if not existing:
                version = models.JourneyVersion(
                    journey_id=v_data["journey_id"],
                    version=v_data["version"],
                    steps=v_data["steps"]
                )
                db.add(version)
                
        db.commit()
        print("Selesai! Data Flows berhasil dimasukkan ke database server.")
    except FileNotFoundError:
        print(f"File {filename} tidak ditemukan!")
    except Exception as e:
        print(f"Terjadi kesalahan saat import: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Gunakan: python migrate_flows.py [export|import]")
        sys.exit(1)
        
    action = sys.argv[1].lower()
    
    # Ensure tables exist
    models.Base.metadata.create_all(bind=engine)
    
    if action == "export":
        export_flows()
    elif action == "import":
        import_flows()
    else:
        print("Perintah tidak valid. Gunakan 'export' atau 'import'")
