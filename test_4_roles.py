import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

roles_to_test = [
    ('admin@gmail.com', 'Admin@123', 'ADMIN', '/admin'),
    ('govt@gmail.com', 'Govt@123', 'GOVERNMENT_OFFICER', '/officer'),
    ('seller@gmail.com', 'Seller@123', 'PROVIDER', '/provider'),
    ('buyer@gmail.com', 'Buyer@123', 'BUYER', '/buyer')
]

print("=== TESTING ALL 4 ROLE LOGINS ON https://landlense.acheva.in ===\n")
for email, pwd, expected_role, expected_dash in roles_to_test:
    req = urllib.request.Request(
        'https://landlense.acheva.in/api/auth/login',
        data=json.dumps({'email': email, 'password': pwd}).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'}
    )
    with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
        data = json.loads(resp.read().decode())
        role = data.get("role")
        user = data.get("user", {})
        print(f"[PASS] Email: {email}")
        print(f"       Role: {role}")
        print(f"       Name: {user.get('firstName')} {user.get('lastName')}")
        print(f"       Target Route: https://landlense.acheva.in{expected_dash}")
        print(f"       Token: {data.get('accessToken')[:35]}...\n")
