export type FeatureToken<T> = {
  symbol: symbol;
  type?: T; // Anchor for Typescript type inference.
};

type FeatureTokenArgs = [] | [description: string] | [isAsync: boolean, description?: string];

export function featureToken<T>(): FeatureToken<T>;
export function featureToken<T>(description: string): FeatureToken<T>;
export function featureToken<T>(isAsync: boolean, description?: string): FeatureToken<T>;

export function featureToken<T>(...args: FeatureTokenArgs): FeatureToken<T> {
  const description = args.length === 1 ? args[0] as string : args.length > 1 ? args[1] : undefined;
  // const isAsync = args.length > 1 ? args[0] : false;

  const symbol = Symbol(description);
  
  return {
    symbol
  };
}

export function activateFeature<T>(_token: FeatureToken<T>): void {
  // TODO
}

export function disactivateFeature<T>(_token: FeatureToken<T>): void {
  // TODO
}

export function loadFeature<T>(_token: FeatureToken<T>): void {
  // TODO
}

export function removeFeature<T>(_token: FeatureToken<T>): void {
  // TODO
}
