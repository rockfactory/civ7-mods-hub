declare const __brand: unique symbol;

type Brand<B> = { [__brand]: B };
type Branded<T, B> = T & Brand<B>;

export function createBranded<T, B>(value: T): Branded<T, B> {
  return value as Branded<T, B>;
}
