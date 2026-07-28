import os
import httpx
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

async def send_telegram_message(message: str) -> bool:
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        print("Telegram bot token or chat ID is missing.")
        return False
        
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": message,
        "parse_mode": "HTML"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            return True
        except Exception as e:
            print(f"Failed to send telegram message: {e}")
            return False

def format_success_message(journey_description: str, duration_sec: int) -> str:
    return (
        f"<b>Success</b>\n"
        f"Journey : {journey_description}\n"
        f"PASS\n"
        f"Duration : {duration_sec} sec"
    )

def format_failure_message(journey_description: str, step_index: int, expected: str, actual: str) -> str:
    return (
        f"<b>Failure</b>\n"
        f"Journey : {journey_description}\n"
        f"FAIL\n"
        f"Step : {step_index}\n"
        f"Expected\n{expected}\n"
        f"Actual\n{actual}"
    )
