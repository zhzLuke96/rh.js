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
  import {mount, createState} from "@rhjs/core";
  import {html} from "@rhjs/tag";

  const [count, setCount] = createState(0);
  
  mount('#app', html`
    <h1>Counter</h1>
    <button onclick=${() => setCount(c => c + 1)}>${count}</button>
  `);
</script>
```
