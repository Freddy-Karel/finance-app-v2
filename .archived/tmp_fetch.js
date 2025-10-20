const http = require('http');
http.get('http://localhost:3000/dashboard', res => {
  console.log('STATUS:' + res.statusCode);
  let d = '';
  res.on('data', c => d += c.toString());
  res.on('end', () => {
    console.log(d.slice(0,1200));
    process.exit(0);
  });
}).on('error', err => { console.error('ERR:' + err.message); process.exit(1); });
