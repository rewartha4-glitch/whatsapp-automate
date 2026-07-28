import sys
sys.path.append('.')
from backend import models, database
from seed_journeys import journeys

def deactivate_old():
    db = database.SessionLocal()
    active_ids = [j['journeyId'] for j in journeys]
    
    all_journeys = db.query(models.Journey).all()
    count = 0
    for j in all_journeys:
        if j.id not in active_ids:
            if j.is_active:
                j.is_active = False
                print(f"Deactivated: {j.id}")
                count += 1
        else:
            if not j.is_active:
                j.is_active = True
                print(f"Re-activated: {j.id}")
                
    db.commit()
    db.close()
    print(f"Done. Deactivated {count} old journeys.")

if __name__ == '__main__':
    deactivate_old()
