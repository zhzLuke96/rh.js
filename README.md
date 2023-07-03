# rh.js

[![language](https://img.shields.io/github/languages/top/zhzluke96/rh.js)](https://github.com/zhzLuke96/rh.js)

🧩 Lightweight & Powerful framework

**FEATURES:**

- Packed `main.js` only `< 15kb`
- Based on `@vue/reactivity`
- function component patterns
- Not extras syntax, all in js. 
- No VDom, always dom.
- JSX style

# Packages
| Package | Version | Size | Description |
|---------|---------|------|-------------|
| `@rhjs/core`    | ![Core Version](https://img.shields.io/github/package-json/v/zhzluke96/rh.js?filename=packages%2Fcore%2Fpackage.json&color=blue) | ![size](https://img.badgesize.io/https:/unpkg.com/@rhjs/core@latest/dist/main.module.mjs?label=gzip%20size&compression=gzip&style=plastic) | core code. |
| `@rhjs/builtin` | ![Builtin Version](https://img.shields.io/github/package-json/v/zhzluke96/rh.js?filename=packages%2Fbuiltin%2Fpackage.json&color=blue) | ![size](https://img.badgesize.io/https:/unpkg.com/@rhjs/builtin@latest/dist/main.module.mjs?label=gzip%20size&compression=gzip&style=plastic) | builtin function, such like `For` / `lazy` / `Portal`. |
| `@rhjs/tag`     | ![Tag Version](https://img.shields.io/github/package-json/v/zhzluke96/rh.js?filename=packages%2Ftag%2Fpackage.json&color=blue) | ![size](https://img.badgesize.io/https:/unpkg.com/@rhjs/tag@latest/dist/main.module.mjs?label=gzip%20size&compression=gzip&style=plastic) | Some convenient-to-use template string tools, such like `html` / `raw` / `text`. |
| `@rhjs/atomic-css`     | ![version](https://img.shields.io/github/package-json/v/zhzluke96/rh-atomic-css?color=blue) | ![size](https://img.badgesize.io/https:/unpkg.com/@rhjs/atomic-css@latest/dist/main.module.mjs?label=gzip%20size&compression=gzip&style=plastic) | tailwindcss runtime. |
| `@rhjs/query`     | 🚧 | 🚧 | Porting react-query. |

# Table of Contents

- [rh.js](#rhjs)
- [Packages](#packages)
- [Table of Contents](#table-of-contents)
- [Quick Start](#quick-start)
- [TRY IT](#try-it)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [LICENSE](#license)

<a name="quick-start"></a>

# Quick Start

```html
<script type="importmap">
{
  "imports": {
    "@rhjs/core": "https://unpkg.com/@rhjs/core@latest/dist/main.module.mjs",
    "@rhjs/builtin": "https://unpkg.com/@rhjs/builtin@latest/dist/main.module.mjs",
    "@rhjs/tag": "https://unpkg.com/@rhjs/tag@latest/dist/main.module.mjs"
  }
}
</script>
<div id="app"></div>
<script type="module">
  import { mount, createState } from "@rhjs/core";
  import { html } from "@rhjs/tag";

  const [count, setCount] = createState(0);

  mount(
    "#app",
    html`
      <h1>Hello world, @rhjs 🎉</h1>
      <button class="button-85" onclick=${() => setCount((c) => c + 1)}>
        count: ${count}
      </button>
    `
  );
</script>
```

> online in [codesandbox](https://codesandbox.io/s/vibrant-microservice-rw3kv4?file=/src/index.js)

# TRY IT
- playground: https://zhzluke96.github.io/rhjs-playground/
- template hub: 🚧
- component hub: 🚧

# Maintainers

[@zhzluke96](https://github.com/zhzLuke96)

# Contributing

Feel free to dive in! [Open an issue](https://github.com/zhzLuke96/rh.js/issues/new) or submit PRs.


# LICENSE

Code is licensed under the [Apache License 2.0](./LICENSE).
