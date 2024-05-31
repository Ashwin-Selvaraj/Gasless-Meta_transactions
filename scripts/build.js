const { mkdirSync, copyFileSync } = require("fs");

// Create build directory if it doesn't exist
try {
  mkdirSync("./build");
} catch (err) {
  if (err.code !== "EEXIST") throw err;
}

copyFileSync("./action/index.mjs", "./build/index.js");

// Copy ForwarderAbi and deploy.json to build directory
copyFileSync("./src/forwarder.js", "./build/forwarder.js");
copyFileSync("./deploy.json", "./build/deploy.json");
