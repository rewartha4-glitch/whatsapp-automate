with open('seed_journeys.py', 'r') as f:
    content = f.read()

content = content.replace(': Atau info lainnya', ': "Atau info lainnya')
content = content.replace('customer care },', 'customer care" },')
content = content.replace(': Layanan Penjualan },', ': "Layanan Penjualan" },')
content = content.replace(': Layanan Purna Jual },', ': "Layanan Purna Jual" },')

with open('seed_journeys.py', 'w') as f:
    f.write(content)
