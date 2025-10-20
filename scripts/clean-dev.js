const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const nextDir = path.join(root, '.next');
try{
  if(fs.existsSync(nextDir)){
    console.log('Removing .next...');
    if(process.platform === 'win32'){
      spawnSync('powershell', ['-Command', `Remove-Item -Recurse -Force '${nextDir}'`], { stdio: 'inherit' });
    } else {
      spawnSync('rm', ['-rf', nextDir], { stdio: 'inherit' });
    }
  }
}catch(e){ console.error('Failed to remove .next', e); }

console.log('Starting dev server...');
const child = spawnSync('node', ['./scripts/dev.js'], { stdio: 'inherit', shell: true });
process.exit(child.status || 0);




