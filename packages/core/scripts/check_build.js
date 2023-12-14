const fs = require('fs');
const path = require('path');

const dist_dir = path.join(__dirname, '../dist');
const dist_files = fs
  .readdirSync(dist_dir)
  .filter((x) => /(\.js|\.mjs)^/.test(x))
  .map((x) => path.join(dist_dir, x));

for (const file of dist_files) {
  const content = fs.readFileSync(file);
  if (content.includes('process.env.NODE_ENV')) {
    console.warn(
      `OOPS!bad build found:\n${file}\n\nplease run: rm -rf ./node_modules && yarn && yarn build\n\n`
    );
    process.exit(1);
  }
}

/**
 * TODO migrate to ts-up build tools
 */
