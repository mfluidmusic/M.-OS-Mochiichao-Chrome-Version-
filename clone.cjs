const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  let entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    let srcPath = path.join(src, entry.name);
    let destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  copyDir('./src', './Chrome_v2/src');
  
  // Create other required directories
  ['public', 'components', 'store', 'assets'].forEach(dir => {
      fs.mkdirSync(path.join('./Chrome_v2', dir), { recursive: true });
  });

  let indexHtml = fs.readFileSync('./index.html', 'utf-8');
  indexHtml = indexHtml.replace('/src/main.tsx', '/Chrome_v2/src/main.tsx');
  fs.writeFileSync('./index.html', indexHtml);
  
  let viteConfig = fs.readFileSync('./vite.config.ts', 'utf-8');
  // Update vite config resolve alias if it exists
  viteConfig = viteConfig.replace("'@': path.resolve(__dirname, '.')", "'@': path.resolve(__dirname, './Chrome_v2/src')");
  fs.writeFileSync('./vite.config.ts', viteConfig);
  
  console.log("Successfully cloned src to Chrome_v2 and updated index.html");
} catch (e) {
  console.error(e);
}
