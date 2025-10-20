const fs = require('fs');
const path = require('path');

const root = process.cwd();
const archivedDir = path.join(root, '.archived');
if (!fs.existsSync(archivedDir)) fs.mkdirSync(archivedDir);

const files = ['projet-complet.txt','tmp_fetch.js','tmp_page.html','dev.log','dev.err','dev_stdout.log','dev_stderr.log'];

files.forEach((f) => {
  try {
    const p = path.join(root, f);
    if (fs.existsSync(p)) {
      const dest = path.join(archivedDir, f);
      fs.renameSync(p, dest);
      console.log('MOVED:' + f);
    }
  } catch (e) {
    console.error('ERR:' + f + ' -> ' + String(e));
  }
});
console.log('ARCHIVE_DONE');




