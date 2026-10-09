import paramiko
import json

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('193.203.185.110', port=65002, username='u833088220', password='Sanvith@27')

php_code = """<?php
require_once '/home/u833088220/domains/landlense.acheva.in/public_html/config/database.php';
$conn = Database::getConnection();
if ($conn) {
    $roles = $conn->query("SELECT * FROM roles")->fetchAll();
    $users = $conn->query("SELECT u.id, u.email, u.first_name, u.last_name, r.name as role FROM users u LEFT JOIN roles r ON u.role_id = r.id LIMIT 20")->fetchAll();
    echo json_encode(['roles' => $roles, 'users' => $users], JSON_PRETTY_PRINT);
} else {
    echo json_encode(['error' => 'No DB connection']);
}
"""

sftp = ssh.open_sftp()
with sftp.file('/home/u833088220/domains/landlense.acheva.in/public_html/test_users.php', 'w') as f:
    f.write(php_code)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("php /home/u833088220/domains/landlense.acheva.in/public_html/test_users.php && rm -f /home/u833088220/domains/landlense.acheva.in/public_html/test_users.php")
out = stdout.read().decode()
err = stderr.read().decode()
print("OUTPUT:\n", out)
if err:
    print("ERR:\n", err)
ssh.close()
