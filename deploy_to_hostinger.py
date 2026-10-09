import os
import shutil
import zipfile
import paramiko
import time
import urllib.request

# Deployment Configuration
HOST = "193.203.185.110"
PORT = 65002
USER = "u833088220"
PASS = "Sanvith@27"
REMOTE_PATH = "/home/u833088220/domains/landlense.acheva.in/public_html"
LOCAL_DIST = r"c:\Users\shese\Desktop\LandLense - Copy\frontend-react\dist"
LOCAL_PHP = r"c:\Users\shese\Desktop\LandLense - Copy\php_backend"
PACKAGE_DIR = r"c:\Users\shese\Desktop\LandLense - Copy\deploy_package"
ZIP_FILE = r"c:\Users\shese\Desktop\LandLense - Copy\landlens_deploy.zip"

print("[1/5] Preparing deployment directory...")
if os.path.exists(PACKAGE_DIR):
    shutil.rmtree(PACKAGE_DIR)
os.makedirs(PACKAGE_DIR, exist_ok=True)

# 1. Copy Frontend build files
for item in os.listdir(LOCAL_DIST):
    s = os.path.join(LOCAL_DIST, item)
    d = os.path.join(PACKAGE_DIR, item)
    if os.path.isdir(s):
        shutil.copytree(s, d)
    else:
        shutil.copy2(s, d)
print(" - Copied React Frontend dist files.")

# 2. Copy PHP Backend files
php_folders = ['config', 'controllers', 'helpers']
for folder in php_folders:
    s = os.path.join(LOCAL_PHP, folder)
    d = os.path.join(PACKAGE_DIR, folder)
    if os.path.exists(s):
        shutil.copytree(s, d)

shutil.copy2(os.path.join(LOCAL_PHP, 'index.php'), os.path.join(PACKAGE_DIR, 'index.php'))
print(" - Copied PHP Backend engine & controllers.")

# 3. Create Production .htaccess (Unified SPA + PHP API Router)
htaccess_content = """<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # Enable CORS
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization, x-api-key, Accept, Origin, X-Requested-With"

    # Route /api/* and /actuator/* to PHP Backend
    RewriteCond %{REQUEST_URI} ^/api(/.*)?$ [NC,OR]
    RewriteCond %{REQUEST_URI} ^/actuator(/.*)?$ [NC]
    RewriteRule ^ index.php [QSA,L]

    # Serve static assets directly if they exist
    RewriteCond %{REQUEST_FILENAME} -f [OR]
    RewriteCond %{REQUEST_FILENAME} -d
    RewriteRule ^ - [L]

    # SPA Fallback: Route all frontend page navigations to index.html
    RewriteRule ^ index.html [L]
</IfModule>
"""
with open(os.path.join(PACKAGE_DIR, '.htaccess'), 'w', encoding='utf-8') as f:
    f.write(htaccess_content)
print(" - Created production .htaccess routing file.")

# 4. Zip package for fast SFTP upload
print("[2/5] Creating deployment ZIP archive...")
if os.path.exists(ZIP_FILE):
    os.remove(ZIP_FILE)

with zipfile.ZipFile(ZIP_FILE, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, _, files in os.walk(PACKAGE_DIR):
        for file in files:
            file_path = os.path.join(root, file)
            arc_name = os.path.relpath(file_path, PACKAGE_DIR)
            zf.write(file_path, arc_name)

zip_size_mb = os.path.getsize(ZIP_FILE) / (1024 * 1024)
print(f" - Archive created: {ZIP_FILE} ({zip_size_mb:.2f} MB)")

# 5. Connect SSH and Deploy
print(f"[3/5] Connecting to {HOST}:{PORT} via SSH...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, port=PORT, username=USER, password=PASS, timeout=30)

print(" - Uploading ZIP archive via SFTP...")
sftp = ssh.open_sftp()
remote_zip = f"{REMOTE_PATH}/deploy.zip"
sftp.put(ZIP_FILE, remote_zip)
sftp.close()
print(" - Upload complete.")

print("[4/5] Extracting and setting up files on server...")
cmd = f"""
cd {REMOTE_PATH}
# Backup or remove default placeholder
rm -f default.php
# Unzip deployment package
unzip -o deploy.zip
rm -f deploy.zip
# Fix permissions
chmod -R 755 .
chmod 644 .htaccess *.php *.html 2>/dev/null || true
ls -la
"""
stdin, stdout, stderr = ssh.exec_command(cmd)
out = stdout.read().decode()
err = stderr.read().decode()
print("Server output:\n", out)
if err:
    print("Server stderr:\n", err)

ssh.close()
print("[5/5] Deployment finished!")
