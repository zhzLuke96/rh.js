# rh.js

[![size badge](https://img.shields.io/github/languages/code-size/zhzluke96/rh.js?label=size)](https://github.com/zhzLuke96/rh.js)
[![language](https://img.shields.io/github/languages/top/zhzluke96/rh.js)](https://github.com/zhzLuke96/rh.js)
[![version](https://img.shields.io/github/package-json/v/zhzluke96/rh.js)](https://github.com/zhzLuke96/rh.js)

🧩 Lightweight & Powerful framework

**FEATURES:**

- Packed `main.js` only `~15kb`
- Based on `@vue/reactivity`
- function component patterns
- Not extras syntax, all in js. 
- No VDom, always dom.
- JSX style

# Table of Contents

- [rh.js](#rhjs)
- [Table of Contents](#table-of-contents)
- [Quick Start](#quick-start)
- [More @Rhjs Details](#more-rhjs-details)
- [Related Efforts](#related-efforts)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [LICENSE](#license)

<a name="quick-start"></a>

# Quick Start

```html
<script type="importmap">
{
  "imports": {
    "@rhjs/core": "https://unpkg.com/@rhjs/rh@latest/dist/main.module.mjs",
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

# More @Rhjs Details
- demos page: https://zhzluke96.github.io/rhjs-demos/#demo
- playground: https://zhzluke96.github.io/rhjs-playground/

# Related Efforts

- [lit-element](https://github.com/Polymer/lit-element) A simple base class for creating fast, lightweight web components
- [alpine](https://github.com/alpinejs/alpine) A rugged, minimal framework for composing JavaScript behavior in your markup.
- [petite-vue](https://github.com/vuejs/petite-vue) 6kb subset of Vue optimized for progressive enhancement
- [solid](https://github.com/solidjs/solid) A declarative, efficient, and flexible JavaScript library for building user interfaces.

# Maintainers

[@zhzluke96](https://github.com/zhzLuke96)

# Contributing

Feel free to dive in! [Open an issue](https://github.com/zhzLuke96/rh.js/issues/new) or submit PRs.


# LICENSE

Code is licensed under the [Apache License 2.0](./LICENSE).
