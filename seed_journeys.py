import httpx
import asyncio
import json

BASE_URL = "http://localhost:8000/api/journey/upload"
PHONE_NUMBER = "62216505555"

journeys = [
    {
        "journeyId": "FLOW_01_HAI",
        "description": "1. HAI",
        "phone": PHONE_NUMBER,
        "steps": [
            { "action": "sendMessage", "text": "hai" },
            { "action": "waitForResponse", "expected": "Halo Bapak/Ibu" },
            { "action": "validate", "type": "contains", "expected": "Halo Bapak/Ibu Dilfa ketemu lagi nih sama Daisy!" },
            { "action": "takeScreenshot" }
        ]
    },
    {
        "journeyId": "FLOW_02_INFORMASI_UMUM",
        "description": "2. MENU => Informasi Umum",
        "phone": PHONE_NUMBER,
        "steps": [
            { "action": "sendMessage", "text": "menu" },
            { "action": "waitForResponse", "expected": "Atau info lainnya silahkan ketik 'CS' untuk dihubungkan ke customer care" },
            { "action": "sendMessage", "text": "IOB" },
            { "action": "waitForResponse", "expected": "Saat ini Sahabat Daihatsu berada pada menu Informasi Outlet & Bengkel" },
            { "action": "validate", "type": "contains", "expected": "Saat ini Sahabat Daihatsu berada pada menu Informasi Outlet & Bengkel" },
            { "action": "takeScreenshot" }
        ]
    },
    {
        "journeyId": "FLOW_03_INFO_PRODUK_IPH",
        "description": "3. Info Produk & Harga",
        "phone": "62216505555",
        "steps": [
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
            },
            {
                "action": "sendMessage",
                "text": "IPH"
            },
            {
                "action": "waitForResponse",
                "expected": "Saat ini Sahabat Daihatsu berada pada menu Informasi Produk & Harga"
            },
            {
                "action": "validate",
                "type": "contains",
                "expected": "Saat ini Sahabat Daihatsu berada pada menu Informasi Produk & Harga"
            },
            {
                "action": "takeScreenshot"
            }
        ]
    },
    {
        "journeyId": "FLOW_04_Minta_Penawaran_MPE",
        "description": "4. Minta Penawaran",
        "phone": "62216505555",
        "steps": [
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
            },
            {
                "action": "sendMessage",
                "text": "MPE"
            },
            {
                "action": "waitForResponse",
                "expected": "Saat ini Sahabat Daihatsu berada pada menu Minta Penawaran"
            },
            {
                "action": "validate",
                "type": "contains",
                "expected": "Saat ini Sahabat Daihatsu berada pada menu Minta Penawaran"
            },
            {
                "action": "takeScreenshot"
            }
        ]
    },
    {
        "journeyId": "FLOW_05_SimulasiKredit_SIK",
        "description": "5. Simulasi Kredit",
        "phone": "62216505555",
        "steps": [
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
            },
            {
                "action": "sendMessage",
                "text": "SIK"
            },
            {
                "action": "waitForResponse",
                "expected": "Saat ini Sahabat Daihatsu berada pada menu Simulasi Kredit"
            },
            {
                "action": "validate",
                "type": "contains",
                "expected": "Saat ini Sahabat Daihatsu berada pada menu Simulasi Kredit"
            },
            {
                "action": "takeScreenshot"
            }
        ]
    },
    {
        "journeyId": "FLOW_06_Permintaan_Test_Drive_PTD",
        "description": "6. Permintaan Test Drive",
        "phone": "62216505555",
        "steps": [
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
            },
            {
                "action": "sendMessage",
                "text": "PTD"
            },
            {
                "action": "waitForResponse",
                "expected": "Saat ini Sahabat Daihatsu berada pada menu Permintaan Test Drive"
            },
            {
                "action": "validate",
                "type": "contains",
                "expected": "Saat ini Sahabat Daihatsu berada pada menu Permintaan Test Drive"
            },
            {
                "action": "takeScreenshot"
            }
        ]
    },
    {
        "journeyId": "FLOW_07_Booking_service_BOS",
        "description": "7. Booking Service",
        "phone": "62216505555",
        "steps": [
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
            },
            {
                "action": "sendMessage",
                "text": "BOS"
            },
            {
                "action": "waitForResponse",
                "expected": "Silahkan pilih jenis booking service yang Bapak/ Ibu Dilfa inginkan"
            },
            {
                "action": "validate",
                "type": "contains",
                "expected": "Silahkan pilih jenis booking service yang Bapak/ Ibu Dilfa inginkan"
            },
            {
                "action": "takeScreenshot"
            }
        ]
    },
    {
        "journeyId": "FLOW_08_Daihatsu_mobile_DMS",
        "description": "8. Daihatsu Mobile Service",
        "phone": "62216505555",
        "steps": [
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
            },
            {
                "action": "sendMessage",
                "text": "DMS"
            },
            {
                "action": "waitForResponse",
                "expected": "Daihatsu Mobile Service (DMS) adalah layanan yang diberikan untuk customer yang tidak sempat datang ke bengkel resmi Daihatsu"
            },
            {
                "action": "validate",
                "type": "contains",
                "expected": "Daihatsu Mobile Service (DMS) adalah layanan yang diberikan untuk customer yang tidak sempat datang ke bengkel resmi Daihatsu"
            },
            {
                "action": "takeScreenshot"
            }
        ]
    },
    {
        "journeyId": "FLOW_09_harga_service_BIS",
        "description": "9. Informasi Harga Servis",
        "phone": "62216505555",
        "steps": [
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
            },
            {
                "action": "sendMessage",
                "text": "BIS"
            },
            {
                "action": "waitForResponse",
                "expected": "Saat ini Sahabat Daihatsu berada pada menu Informasi Harga Servis"
            },
            {
                "action": "validate",
                "type": "contains",
                "expected": "Saat ini Sahabat Daihatsu berada pada menu Informasi Harga Servis"
            },
            {
                "action": "takeScreenshot"
            }
        ]
    },
    {
        "journeyId": "FLOW_10_Cek_service_CHS",
        "description": "10. Cek Service History",
        "phone": "62216505555",
        "steps": [
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
            },
            {
                "action": "sendMessage",
                "text": "CHS"
            },
            {
                "action": "waitForResponse",
                "expected": "Saat ini Sahabat Daihatsuku berada pada menu Cek Service History"
            },
            {
                "action": "validate",
                "type": "contains",
                "expected": "Saat ini Sahabat Daihatsuku berada pada menu Cek Service History"
            },
            {
                "action": "takeScreenshot"
            }
        ]
    },
    {
        "journeyId": "FLOW_11_Layanan_service_ILS",
        "description": "11. Layanan Service",
        "phone": "62216505555",
        "steps": [
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
            },
            {
                "action": "sendMessage",
                "text": "ILS"
            },
            {
                "action": "waitForResponse",
                "expected": "Berikut Daisy infokan layanan service yang dapat Sahabat Daihatsu lakukan di bengkel, antara lain"
            },
            {
                "action": "validate",
                "type": "contains",
                "expected": "Berikut Daisy infokan layanan service yang dapat Sahabat Daihatsu lakukan di bengkel, antara lain"
            },
            {
                "action": "takeScreenshot"
            }
        ]
    },
    {
        "journeyId": "FLOW_12_Aksesoris_AKS",
        "description": "12. Aksesoris",
        "phone": "62216505555",
        "steps": [
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
            },
            {
                "action": "sendMessage",
                "text": "AKS"
            },
            {
                "action": "waitForResponse",
                "expected": "Aksesoris model mobil apa yang Bapak/ibu Dilfa cari?"
            },
            {
                "action": "validate",
                "type": "contains",
                "expected": "Aksesoris model mobil apa yang Bapak/ibu Dilfa cari?"
            },
            {
                "action": "takeScreenshot"
            }
        ]
    }
]

async def seed_data():
    async with httpx.AsyncClient() as client:
        for journey in journeys:
            print(f"Uploading {journey['journeyId']}...")
            try:
                res = await client.post(BASE_URL, json=journey)
                res.raise_for_status()
                print(f"Success: {res.json()}")
            except Exception as e:
                print(f"Failed to upload {journey['journeyId']}: {e}")

if __name__ == "__main__":
    asyncio.run(seed_data())
