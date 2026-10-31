const fs = require('fs');
try {
  require('graceful-fs').gracefulify(fs);
} catch (e) {}
