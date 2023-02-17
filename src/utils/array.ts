export function concat<T>(xss: T[][]): T[] {
  return ([] as T[]).concat(...xss);
}

export function intersperse<T>(sep: T, xs: T[]): T[] {
  return concat(xs.map(x => [sep, x])).slice(1);
}