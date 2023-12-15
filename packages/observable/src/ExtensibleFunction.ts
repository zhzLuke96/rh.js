export class ExtensibleFunction extends Function {
  // @ts-ignore
  constructor(f: Function) {
    return Object.setPrototypeOf(f, new.target.prototype);
  }
}
