const fs = require('fs')
const path = require('path')

fs.copyFileSync(path.join(__dirname, "3rd", "node-forge.d.ts"), path.join(__dirname, "node_modules", "@types", "node-forge", "index.d.ts"))