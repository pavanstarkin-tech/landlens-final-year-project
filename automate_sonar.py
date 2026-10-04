import paramiko
import time

host = "13.201.4.7"
# Try root first, if not try ec2-user or ubuntu
username = "root"
key_path = r"c:\Users\shese\Desktop\LandLense\back.pem"

print(f"Connecting to {host}...")
key = paramiko.RSAKey.from_private_key_file(key_path)

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(host, username=username, pkey=key)
except paramiko.ssh_exception.AuthenticationException:
    print("Root login failed, trying ec2-user...")
    username = "ec2-user"
    ssh.connect(host, username=username, pkey=key)

print(f"Connected as {username}!")

commands = [
    # Install Java 21 for Sonar Backend
    "sudo yum install java-21-amazon-corretto-devel -y || sudo apt-get install openjdk-21-jdk -y",
    
    # Run Backend Sonar Scan
    "cd /opt/backend && sudo mvn clean verify sonar:sonar -DskipTests -Dsonar.projectKey=landlens-backend -Dsonar.host.url=http://localhost:9000 -Dsonar.login=admin -Dsonar.password=admin || echo 'Backend scan failed or already done'",
    
    # Run Frontend Sonar Scan
    "cd /opt/frontend-react && sudo sonar-scanner -Dsonar.projectKey=landlens-frontend -Dsonar.sources=src -Dsonar.host.url=http://localhost:9000 -Dsonar.login=admin -Dsonar.password=admin || echo 'Frontend scan failed or already done'",
    
    # Setup Nginx
    "sudo yum install nginx -y || sudo apt-get install nginx -y",
    """sudo bash -c 'cat > /etc/nginx/conf.d/sonarqube.conf <<EOF
server {
    listen 80;
    server_name 13.201.4.7;

    location / {
        proxy_pass http://127.0.0.1:9000;
        proxy_set_header Host \\$host;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\$scheme;
    }
}
EOF'""",
    "sudo systemctl restart nginx",
    "sudo systemctl enable nginx"
]

for cmd in commands:
    print(f"Executing: {cmd[:50]}...")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    
    exit_status = stdout.channel.recv_exit_status()
    print(f"Exit Status: {exit_status}")
    print("STDOUT:", stdout.read().decode())
    err = stderr.read().decode()
    if err:
        print("STDERR:", err)

ssh.close()
print("All tasks completed automatically!")
