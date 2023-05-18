export function isPlainObject(obj: any) {
  return obj && typeof obj === 'object' && obj.constructor === Object;
}

export function clonePlainDeep(obj: any): any {
  if (isPlainObject(obj)) {
    const clonedObj = {} as any;
    Object.keys(obj).forEach((key) => {
      clonedObj[key] = clonePlainDeep(obj[key]);
    });
    return clonedObj;
  }

  return obj;
}
