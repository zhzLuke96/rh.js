# rh.js

[![size badge](https://img.shields.io/github/languages/code-size/zhzluke96/rh.js?label=size)](https://github.com/zhzLuke96/rh.js)
[![language](https://img.shields.io/github/languages/top/zhzluke96/rh.js)](https://github.com/zhzLuke96/rh.js)
[![version](https://img.shields.io/github/package-json/v/zhzluke96/rh.js)](https://github.com/zhzLuke96/rh.js)

🧩 Lightweight & Powerful framework

**FEATURES:**

- Packed only `< 9kb`
- Source core code within `300` lines (including type annotations)
- Based on `@vue/reactivity`
- Easy to use function component patterns
- Not extras syntax, all in js. 
- Not required complex algo / magic, no VDom and always dom.
- JSX style, fit engineering

# Table of Contents

- [rh.js](#rhjs)
- [Table of Contents](#table-of-contents)
- [Quick Start](#quick-start)
  - [Component](#component)
- [Demos](#demos)
- [Browser Support](#browser-support)
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
  } from 'https://unpkg.com/@rhjs/rh@latest/dist/main.module.js';
  const { ref } = utils.reactivity;

  const timeStr = ref(new Date().toLocaleString());
  setInterval(() => (timeStr.value = new Date().toLocaleString()), 1000);

  const app = rh('h1', {}, tools.rt`hello world, now: ${timeStr}`);
  // app just a HTML element
  document.querySelector('#app').appendChild(app);
</script>
```

## Component

```html
<div id="app"></div>

<script type="module">
  import { rh, utils } from 'https://unpkg.com/@rhjs/rh@latest/dist/main.module.js';
  const { ref } = utils.reactivity;
  const counter = {
    setup({ defValue = 0 }) {
      const count = ref(defValue);
      return {
        count,
        inc: () => count.value++,
        dec: () => count.value--,
      };
    },
    render({ count, inc, dec }) {
      return rh(
        'div',
        {},
        rh('h1', {}, 'count: ', count),
        rh('button', { onclick: inc }, '+'),
        rh('button', { onclick: dec }, '-')
      );
    },
  };

  rh.mount('#app', counter);
  rh.mount('#app', counter);
  rh.mount('#app', counter);
</script>
```

FC

```html
<div id="app"></div>

<script type="module">
  import { rh, utils } from 'https://unpkg.com/@rhjs/rh@latest/dist/main.module.js';
  const { ref } = utils.reactivity;
  const counter = ({ defValue = 0 }) => {
    const count = ref(defValue);

    const inc = () => count.value++;
    const dec = () => count.value--;

    return () =>
      rh(
        'div',
        {},
        rh('h1', {}, 'count: ', count),
        rh('button', { onclick: inc }, '+'),
        rh('button', { onclick: dec }, '-')
      );
  };

  rh.mount('#app', counter);
  rh.mount('#app', counter);
  rh.mount('#app', counter);
</script>
```

# Demos
https://zhzluke96.github.io/rhjs-demos/

# Browser Support

Target environments are Chrome, Firefox, Safari.If you need to adapt a low-level browser environment, following PreProcessors and polyfill are recommended:

- [babel](https://github.com/babel/babel) Babel is a compiler for writing next generation JavaScript.
- [webcomponentsjs](https://github.com/webcomponents/polyfills/tree/master/packages/webcomponentsjs) v1 spec polyfills

# Related Efforts

- [lit-element](https://github.com/Polymer/lit-element) A simple base class for creating fast, lightweight web components
- [alpine](https://github.com/alpinejs/alpine) A rugged, minimal framework for composing JavaScript behavior in your markup.
- [petite-vue](https://github.com/vuejs/petite-vue) 6kb subset of Vue optimized for progressive enhancement

# Maintainers

[@zhzluke96](https://github.com/zhzLuke96)

# Contributing

Feel free to dive in! [Open an issue](https://github.com/zhzLuke96/rh.js/issues/new) or submit PRs.


# LICENSE

Code is licensed under the [Apache License 2.0](./LICENSE).
