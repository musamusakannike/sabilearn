const fs = require('fs');

try {
  require('graceful-fs').gracefulify(fs);
} catch (e) {}

if (fs.promises) {
  const origOpen = fs.promises.open;
  if (typeof origOpen === 'function') {
    fs.promises.open = async function (...args) {
      let attempts = 0;
      while (true) {
        try {
          return await origOpen.apply(this, args);
        } catch (err) {
          if (err && err.code === 'EMFILE' && attempts < 15) {
            attempts++;
            await new Promise((r) => setTimeout(r, 25 * attempts));
            continue;
          }
          throw err;
        }
      }
    };
  }

  const origReadFile = fs.promises.readFile;
  if (typeof origReadFile === 'function') {
    fs.promises.readFile = async function (...args) {
      let attempts = 0;
      while (true) {
        try {
          return await origReadFile.apply(this, args);
        } catch (err) {
          if (err && err.code === 'EMFILE' && attempts < 15) {
            attempts++;
            await new Promise((r) => setTimeout(r, 25 * attempts));
            continue;
          }
          throw err;
        }
      }
    };
  }
}
