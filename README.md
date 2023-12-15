# 🧩 rh.js

[![language](https://img.shields.io/github/languages/top/zhzluke96/rh.js)](https://github.com/zhzLuke96/rh.js)

🧩 lightweight & powerful framework

**FEATURES:**

- Packed `main.js` only `<~ 13kb` (gzip)
- Not extras syntax, all in js. 
- Less virtual dom, always real dom.
- Hooks without any restrictions.
- Extremely high performance, most renders do not require diff.
- Develop applications in any style, `react` `vue` `solid` `rxjs` even `elm` style.
- Ubiquitous responsiveness, even across clients and across endpoints (WIP)

# Packages
| Package | Version | Size | Description |
|---------|---------|------|-------------|
| `@rhjs/core`    | ![version](https://img.shields.io/github/package-json/v/zhzluke96/rh.js?filename=packages/core/package.json&color=blue) | ![size](https://img.badgesize.io/https:/unpkg.com/@rhjs/core@latest/dist/main.module.mjs?label=gzip/size&compression=gzip&style=plastic) | core code. |
| `@rhjs/hooks`     | ![version](https://img.shields.io/github/package-json/v/zhzluke96/rh.js?filename=packages/hooks/package.json&color=blue) | ![size](https://img.badgesize.io/https:/unpkg.com/@rhjs/hooks@latest/dist/main.module.mjs?label=gzip/size&compression=gzip&style=plastic) | hooks, such as `createEffect` `createState` ... |
| `@rhjs/builtin` | ![version](https://img.shields.io/github/package-json/v/zhzluke96/rh.js?filename=packages/builtin/package.json&color=blue) | ![size](https://img.badgesize.io/https:/unpkg.com/@rhjs/builtin@latest/dist/main.module.mjs?label=gzip/size&compression=gzip&style=plastic) | builtin function, such like `For` / `lazy` / `Portal`. |
| `@rhjs/tag`     | ![version](https://img.shields.io/github/package-json/v/zhzluke96/rh.js?filename=packages/tag/package.json&color=blue) | ![size](https://img.badgesize.io/https:/unpkg.com/@rhjs/tag@latest/dist/main.module.mjs?label=gzip/size&compression=gzip&style=plastic) | Some convenient-to-use template string tools, such like `html` / `raw` / `text`. |
| `@rhjs/hyper`     | ![version](https://img.shields.io/github/package-json/v/zhzluke96/rh.js?filename=packages/hyper/package.json&color=blue) | ![size](https://img.badgesize.io/https:/unpkg.com/@rhjs/hyper@latest/dist/main.module.mjs?label=gzip/size&compression=gzip&style=plastic) | Building components functionally. |
| `@rhjs/observable`     | ![version](https://img.shields.io/github/package-json/v/zhzluke96/rh.js?filename=packages/observable/package.json&color=blue) | ![size](https://img.badgesize.io/https:/unpkg.com/@rhjs/observable@latest/dist/main.module.mjs?label=gzip/size&compression=gzip&style=plastic) | Minimalist rxjs-like. |
| `@rhjs/atomic-css`     | ![version](https://img.shields.io/github/package-json/v/zhzluke96/rh-atomic-css?color=blue) | ![size](https://img.badgesize.io/https:/unpkg.com/@rhjs/atomic-css@latest/dist/main.module.mjs?label=gzip/size&compression=gzip&style=plastic) | tailwindcss runtime. |
| `@rhjs/query`     | 🚧 | 🚧 | Porting react-query. |

# Table of Contents

- [🧩 rh.js](#-rhjs)
- [Packages](#packages)
- [Table of Contents](#table-of-contents)
- [Quick Start](#quick-start)
  - [smallest hello world](#smallest-hello-world)
  - [More reactivity](#more-reactivity)
- [TRY IT](#try-it)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [LICENSE](#license)

<a name="quick-start"></a>

# Quick Start
## smallest hello world
```html
<script type="importmap">
{
  "imports": {
    "@rhjs/core": "https://unpkg.com/@rhjs/core@latest/dist/main.module.mjs",
    "@rhjs/hooks": "https://unpkg.com/@rhjs/hooks@latest/dist/main.module.mjs",
    "@rhjs/tag": "https://unpkg.com/@rhjs/tag@latest/dist/main.module.mjs"
  }
}
</script>
<div id="app"></div>
<script type="module">
import { html } from "@rhjs/tag";

document.body.append(
  html`
    <h1>Hello world, @rhjs 🎉</h1>
  `
)
</script>
```

## More reactivity
```html
<script type="importmap">
{
  "imports": {
    "@rhjs/core": "https://unpkg.com/@rhjs/core@latest/dist/main.module.mjs",
    "@rhjs/hooks": "https://unpkg.com/@rhjs/hooks@latest/dist/main.module.mjs",
    "@rhjs/tag": "https://unpkg.com/@rhjs/tag@latest/dist/main.module.mjs"
  }
}
</script>
<div id="app"></div>
<script type="module">
  import { mount } from "@rhjs/core";
  import { createState } from "@rhjs/hooks";
  import { html } from "@rhjs/tag";

  const [count, setCount] = createState(0);

  mount(
    "#app",
    html`
      <h1>Hello world, @rhjs 🎉</h1>
      <button onclick=${() => setCount((c) => c + 1)}>
        count: ${count}
      </button>
    `
  );
</script>
```

> online in [codesandbox](https://codesandbox.io/p/sandbox/rh-js-hello-world-rw3kv4?file=%2Fsrc%2Findex.js)

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
