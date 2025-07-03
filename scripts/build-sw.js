const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'worker', 'index.js');
const dest = path.join(__dirname, '..', 'public', 'sw.js');

fs.copyFileSync(src, dest);
console.log(`Copied ${src} to ${dest}`);

