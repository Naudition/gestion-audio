const fs = require('fs');
const path = require('path');

const publicDir = path.join(process.cwd(), 'public');
const sourceFile = path.join(process.cwd(), 'node_modules/sql.js/dist/sql-wasm.wasm');
const targetFile = path.join(publicDir, 'sql-wasm.wasm');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

if (fs.existsSync(sourceFile)) {
  fs.copyFileSync(sourceFile, targetFile);
  console.log('✓ Copied sql-wasm.wasm to public/');
} else {
  console.warn('⚠ sql-wasm.wasm not found in node_modules/sql.js/dist/');
}
