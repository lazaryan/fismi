import { register } from './register';

export type FeatureTokenSync<T> = {
  symbol: symbol;
  type?: T; // Anchor for Typescript type inference.
  isAsync?: false;
};

export type FeatureTokenAsync<T> = {
  symbol: symbol;
  type?: T; // Anchor for Typescript type inference.
  isAsync: true;
};

export type FeatureToken<T> = FeatureTokenSync<T> | FeatureTokenAsync<T>;

type FeatureTokenArgs = [] | [description: string] | [isAsync: boolean, description?: string];

export function featureToken<T>(): FeatureToken<T>;
export function featureToken<T>(description: string): FeatureToken<T>;
export function featureToken<T>(isAsync: boolean, description?: string): FeatureToken<T>;

export function featureToken<T>(...args: FeatureTokenArgs): FeatureToken<T> {
  const description = args.length === 1 ? args[0] as string : args.length > 1 ? args[1] : undefined;
  const isAsync = args.length > 1 ? args[0] as boolean : false;

  const symbol = Symbol(description);

  let token: FeatureToken<T>;

  if (isAsync) {
    token = {
      symbol,
      isAsync,
    }
  }
  
  token = {
    symbol,
  };

  register.addToken(token);
  
  return token;
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
