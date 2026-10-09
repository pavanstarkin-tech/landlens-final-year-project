import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

urls = [
    'https://landlense.acheva.in/',
    'https://landlense.acheva.in/api/health',
    'https://landlense.acheva.in/api/properties',
    'https://landlense.acheva.in/api/analytics',
    'https://landlense.acheva.in/api/verification/timeline'
]

print("=== VERIFYING LIVE DEPLOYMENT ON https://landlense.acheva.in ===")
for u in urls:
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=ctx, timeout=12) as resp:
            body = resp.read().decode('utf-8', errors='ignore')
            ct = resp.headers.get('Content-Type', '')
            print(f"[HTTP {resp.status}] {u}")
            if 'json' in ct:
                data = json.loads(body)
                if isinstance(data, list):
                    print(f"   Response: List of {len(data)} items")
                    if len(data) > 0 and 'title' in data[0]:
                        print(f"   First Item: {data[0].get('title')}")
                else:
                    print(f"   Response Object: {data}")
            else:
                print(f"   Response HTML Size: {len(body)} bytes")
    except Exception as e:
        print(f"[ERROR] {u}: {e}")
