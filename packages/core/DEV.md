
# DEV NOTE
- use yarn, not PNPM. this package cant build with pnpm...
  > `microbundle --define ...` Can't work, and no error is reported... It is estimated that the wrong rollup version depends on it, it is not easy to solve, just use yarn, do not use pnpm
- all in devDependencies, not dependencies
  > In order to reduce the generation of different versions of dependent packages, all dependencies are placed in devDependencies
