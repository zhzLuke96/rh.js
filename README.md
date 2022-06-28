# rh.js
[![size badge](https://img.shields.io/github/languages/code-size/zhzluke96/rh.js?label=size)](https://github.com/zhzLuke96/rh.js)
[![language](https://img.shields.io/github/languages/top/zhzluke96/rh.js)](https://github.com/zhzLuke96/rh.js)
[![version](https://img.shields.io/github/package-json/v/zhzluke96/rh.js)](https://github.com/zhzLuke96/rh.js)

a lightweight / reactivity web framework


**SURPRISE:**
- Packed only `5kb`
- Source code within `200` lines
- Obvious Responsiveness
- Easy to use function componentization
- Zero directive need learn
- Zero syntax need learn
- Zero pro algo need magic

# Table of Contents

- [Table of Contents](#table-of-contents)
- [Quick Start](#quick-start)
- [Playground](#playground)
- [Roadmap](#roadmap)
- [Brower Support](#brower-support)
- [Related Efforts](#related-efforts)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [LICENSE](#license)

<a name="quick-start"></a>
# Quick Start

```html
<div id="app"></div>

<script type="module">
  import rh from 'https://unpkg.com/@rhjs/rh@latest/dist/main.modern.module.js';

  const timeStr = rh.vR.ref(new Date().toLocaleString());
  setInterval(() => timeStr.value = new Date().toLocaleString(), 1000);

  rh.mount('#app', () =>
    rh('h1', {}, ...rh.rt`hello world, now: ${() => timeStr.value}`)
  );
</script>
```

## Componentized
```html
<div id="app"></div>

<script type="module">
  import rh from 'https://unpkg.com/@rhjs/rh@latest/dist/main.modern.module.js';
  const counter = {
    setup({ defValue = 0 }) {
      const count = rh.vR.ref(defValue);
      return {
        count,
        inc: () => count.value++,
        dec: () => count.value--
      };
    },
    render({ count, inc, dec }) {
      return rh(
        'div',
        {},
        rh(
          'h1',
          {},
          'count: ',
          rh(() => count.value)
        ),
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

# Playground

🚧WIP

# Roadmap

- [x] v0.0.1
- [ ] more demo
- [ ] webcomponents support
- [ ] svg support

# Brower Support

Target environments are Chrome, Firefox, Safari.If you need to adapt a low-level browser environment, following preprocessors and polyfill are recommended:

-   [babel](https://github.com/babel/babel) Babel is a compiler for writing next generation JavaScript.
-   [webcomponentsjs](https://github.com/webcomponents/polyfills/tree/master/packages/webcomponentsjs) v1 spec polyfills

# Related Efforts

-   [lit-element](https://github.com/Polymer/lit-element) A simple base class for creating fast, lightweight web components
-   [alpinejs](https://github.com/alpinejs/alpine) A rugged, minimal framework for composing JavaScript behavior in your markup.
-   [petite-vue](https://github.com/vuejs/petite-vue) 6kb subset of Vue optimized for progressive enhancement

# Maintainers

[@zhzluke96](https://github.com/zhzLuke96)

# Contributing

Feel free to dive in! [Open an issue](https://github.com/zhzLuke96/rh.js/issues/new) or submit PRs.

## publish
```
npm publish --access public
```


# LICENSE

Code is licensed under the [MIT License](./LICENSE).


