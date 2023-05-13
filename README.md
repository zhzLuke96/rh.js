# rh.js

[![size badge](https://img.shields.io/github/languages/code-size/zhzluke96/rh.js?label=size)](https://github.com/zhzLuke96/rh.js)
[![language](https://img.shields.io/github/languages/top/zhzluke96/rh.js)](https://github.com/zhzLuke96/rh.js)
[![version](https://img.shields.io/github/package-json/v/zhzluke96/rh.js)](https://github.com/zhzLuke96/rh.js)

🧩 Lightweight & Powerful framework

**FEATURES:**

- Packed only `< 9kb`
- Source core code within `~300` lines (including type annotations)
- Based on `@vue/reactivity`
- Easy to use function component patterns
- Not extras syntax, all in js. 
- Not required complex algo / magic, no VDom and always dom.
- JSX style, fit engineering

# Table of Contents

- [rh.js](#rhjs)
- [Table of Contents](#table-of-contents)
- [Quick Start](#quick-start)
  - [Component (with JSX)](#component-with-jsx)
  - [Function Component](#function-component)
- [More @Rhjs Details](#more-rhjs-details)
- [Related Efforts](#related-efforts)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [LICENSE](#license)

<a name="quick-start"></a>

# Quick Start

```html
<div id="app"></div>

<script type="module">
  import {
    rh,
    tools,
    utils,
  } from 'https://unpkg.com/@rhjs/rh@latest/dist/main.module.mjs';
  const { ref } = utils.reactivity;

  const timeStr = ref(new Date().toLocaleString());
  setInterval(() => (timeStr.value = new Date().toLocaleString()), 1000);

  const app = rh('h1', {}, tools.rt`hello world, now: ${timeStr}`);
  // app just a HTML element
  document.querySelector('#app').appendChild(app);
</script>
```

## Component (with JSX)
> jsx+vite+rhjs project template: https://github.com/zhzLuke96/rhjs-vite-tsx-starter

```jsx
import { rh, reactivity } from '@rhjs/rh';

const Counter = rh.component({
  setup({ defValue = 0 }) {
      const count = reactivity.ref(defValue);
      return {
        count,
        inc: () => count.value++,
        dec: () => count.value--,
      };
  },
  render({ count, inc, dec }) {
    return (
      <div>
        <h1>count: {count}</h1>
        <br/>
        <button onClick={inc}>+</button>
        <button onClick={dec}>-</button>
      </div>
    )
  }
});

rh.mount('#app', Counter);
```

> rh.component returns the original value, similar to an `identity` function, but with added TypeScript type checking.

## Function Component
```jsx
import { rh, reactivity } from '@rhjs/rh';

const Counter = ({ defValue = 0 }) => {
    const count = ref(defValue);

    const inc = () => count.value++;
    const dec = () => count.value--;

    return () => (
      <div>
        <h1>count: {count}</h1>
        <br/>
        <button onClick={inc}>+</button>
        <button onClick={dec}>-</button>
      </div>
    )
};

rh.mount('#app', Counter);
```

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
