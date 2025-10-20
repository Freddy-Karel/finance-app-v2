const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const backupsDir = path.join(process.cwd(), '.backups');
if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir);

if (process.platform === 'win32') {
  const cmd = ` $ts=Get-Date -Format 'yyyyMMdd-HHmmss'; $dest=Join-Path -Path '${backupsDir.replace(/'/g, "''")}' -ChildPath ("backup-$($ts).zip"); Compress-Archive -Path * -DestinationPath $dest -Force -Exclude '.next','node_modules'; Write-Output $dest`;
  const res = spawnSync('powershell', ['-NoProfile', '-Command', cmd], { stdio: 'inherit', shell: false });
  process.exit(res.status || 0);
} else {
  // Unix-like: create tar.gz excluding node_modules and .next
  const ts = new Date().toISOString().replace(/[:T]/g,'-').slice(0,19).replace(/-/g,'');
  const dest = path.join(backupsDir, `backup-${ts}.tar.gz`);
  const args = ['--exclude=.next','--exclude=node_modules','-czf', dest, '.'];
  const res = spawnSync('tar', args, { stdio: 'inherit', shell: false });
  process.exit(res.status || 0);
}




