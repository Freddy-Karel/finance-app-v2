const { spawn } = require('child_process');
// Use pnpm exec to run local next in a cross-platform way
const cmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const child = spawn(cmd, ['exec', 'next', 'dev'], { stdio: 'inherit', shell: true });
child.on('close', (code) => process.exit(code));


