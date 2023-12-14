export const cssMinifier = (css: string) => {
  return css
    .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "")
    .replace(/\s+/g, " ")
    .replace(/:\s+/g, ":")
    .replace(/\s+;/g, ";")
    .replace(/([^\s{;])([{}])/g, "$1 $2")
    .replace(/([{}])([^\s{])/g, "$1 $2")
    .replace(/([^\s])([{}])/g, "$1 $2")
    .replace(/([{}])([^\s])/g, "$1 $2")
    .replace(/([^\s])([{}])/g, "$1 $2")
    .replace(/([{}])([^\s])/g, "$1 $2")
    .replace(/([^\s])([{}])/g, "$1 $2")
    .replace(/([{}])([^\s])/g, "$1 $2")
    .replace(/([^\s])([{}])/g, "$1 $2")
    .replace(/([{}])([^\s])/g, "$1 $2")
    .replace(/([^\s])([{}])/g, "$1 $2")
    .replace(/([{}])([^\s])/g, "$1 $2")
    .replace(/([^\s])([{}])/g, "$1 $2")
    .replace(/([{}])([^\s])/g, "$1 $2")
    .replace(/([^\s])([{}])/g, "$1 $2")
    .trim();
};
