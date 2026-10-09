import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('193.203.185.110', port=65002, username='u833088220', password='Sanvith@27')

htaccess_content = """DirectoryIndex index.html index.php
<IfModule mod_rewrite.c>
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

sftp = ssh.open_sftp()
with sftp.file('/home/u833088220/domains/landlense.acheva.in/public_html/.htaccess', 'w') as f:
    f.write(htaccess_content)
sftp.close()
ssh.close()
print("Remote .htaccess updated successfully!")
