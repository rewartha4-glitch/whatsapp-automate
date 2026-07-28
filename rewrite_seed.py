import json

with open('seed_journeys.py', 'r') as f:
    lines = f.readlines()

expected_map = {
    "hai": "Halo Bapak/Ibu",
    "menu": "Halo Bapak/Ibu",
    "IOB": "Saat ini Sahabat Daihatsu berada pada menu Informasi Outlet & Bengkel",
    "Informasi Umum": "Outlet dan Bengkel",
    "1": "Saat ini Sahabat Daihatsu",
    "Layanan Penjualan": "Info Produk & Harga",
    "Info Produk & Harga": "All New Ayla",
    "All New Ayla": "Saat ini Sahabat Daihatsu berada pada menu Informasi Produk",
    "Minta Penawaran": "Silakan mengisi Form",
    "Simulasi Kredit": "Saat ini Sahabat Daihatsu berada pada menu Simulasi Kredit",
    "Permintaan Test Drive": "Silahkan pilih tombol",
    "Layanan Purna Jual": "Booking Service",
    "Booking Service": "Silahkan pilih jenis booking",
    "Daihatsu Mobile Service": "Outlet dengan DMS",
    "Outlet dengan DMS": "Outlet terdekat yang melayani",
    "Booking DMS": "Apakah benar dengan Bapak/Ibu",
    "Biaya Service": "Mohon diinformasikan model mobil",
    "Info Layanan Service": "Berikut Daisy infokan layanan",
    "Aksesories": "Silahkan klik tombol"
}

out_lines = []
last_sent_text = ""

for line in lines:
    if '"action": "sendMessage"' in line:
        parts = line.split('"text": "')
        if len(parts) > 1:
            last_sent_text = parts[1].split('"')[0]
        out_lines.append(line)
    elif '"action": "waitReply"' in line:
        expected = expected_map.get(last_sent_text, "Halo Bapak/Ibu")
        new_line = line.replace('"waitReply"', f'"waitForResponse", "expected": "{expected}"')
        out_lines.append(new_line)
    else:
        out_lines.append(line)

with open('seed_journeys.py', 'w') as f:
    f.writelines(out_lines)

print("Rewrite complete.")
