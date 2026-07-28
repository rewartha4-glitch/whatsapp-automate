with open('seed_journeys.py', 'r') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if '"waitForResponse", "expected": "Halo Bapak/Ibu"' in line:
        line = line.replace('"Halo Bapak/Ibu"', "Atau info lainnya silahkan ketik 'CS' untuk dihubungkan ke customer care")
    elif '"waitForResponse", "expected": "Info Produk & Harga"' in line:
        line = line.replace('"Info Produk & Harga"', 'Layanan Penjualan')
    elif '"waitForResponse", "expected": "Booking Service"' in line:
        line = line.replace('"Booking Service"', 'Layanan Purna Jual')
    
    new_lines.append(line)

with open('seed_journeys.py', 'w') as f:
    f.writelines(new_lines)
