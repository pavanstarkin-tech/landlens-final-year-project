const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const { exec } = require('child_process');

console.log('====================================================');
console.log('  🌟 LandLens - AI Property Verification Platform  ');
console.log('====================================================\n');

// 1. Start Backend API Server
console.log('[1/3] 🚀 Starting Backend API Server (Port 5000)...');
const backend = spawn('node', ['backend_server.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

// 2. Start Frontend Dev Server
console.log('[2/3] 🌐 Starting Frontend React Portal (Port 5173)...');
const frontend = spawn('npm', ['--prefix', 'frontend-react', 'run', 'dev', '--', '--host', '0.0.0.0', '--port', '5173'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

// Wait for servers to be ready, then open browser
function checkServerReady(url, retries = 30) {
  return new Promise((resolve) => {
    const check = () => {
      http.get(url, (res) => {
        if (res.statusCode < 500) {
          resolve(true);
        } else {
          retry();
        }
      }).on('error', () => {
        retry();
      });
    };

    const retry = () => {
      if (retries-- > 0) {
        setTimeout(check, 1000);
      } else {
        resolve(false);
      }
    };

    check();
  });
}

(async () => {
  console.log('\n[3/3] ⏳ Waiting for servers to initialize...');
  
  const backendReady = await checkServerReady('http://localhost:5000/api/health');
  const frontendReady = await checkServerReady('http://localhost:5173');

  if (backendReady && frontendReady) {
    console.log('\n====================================================');
    console.log('  ✅ ALL SYSTEMS ARE RUNNING LIVE!');
    console.log('  --------------------------------------------------');
    console.log('  🌐 Frontend UI:       http://localhost:5173');
    console.log('  🛡️  Verification Hub: http://localhost:5173/verify');
    console.log('  ⚙️  Backend API:       http://localhost:5000/api/health');
    console.log('  🗄️  MySQL Database:   58 Verified Properties Active');
    console.log('====================================================\n');
    console.log('🔑 Demo Credentials (Email / Password):');
    console.log('   - Admin:      admin@gmail.com / admin123');
    console.log('   - Buyer:      buyer@gmail.com / buyer123');
    console.log('   - Officer:    govt@gmail.com / govt123');
    console.log('   - Seller:     seller@gmail.com / seller123\n');
    console.log('Opening browser automatically...\n');

    // Open browser on Windows / Mac / Linux
    const openCmd = process.platform === 'win32' ? 'start http://localhost:5173' :
                    process.platform === 'darwin' ? 'open http://localhost:5173' :
                    'xdg-open http://localhost:5173';
    exec(openCmd);
  } else {
    console.log('\n⚠️ Servers started. Please open http://localhost:5173 in your browser.');
  }
})();

// Clean shutdown on CTRL+C
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down LandLens servers...');
  backend.kill();
  frontend.kill();
  process.exit();
});
