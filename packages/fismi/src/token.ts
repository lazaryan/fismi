import type {
  SubscriptionTokenAction,
} from './stateManager';
import { stateManager } from './stateManager';

export type FeatureTokenSync<T> = {
  symbol: symbol;
  type?: T; // Anchor for Typescript type inference.
  isAsync?: false;
};

export type FeatureTokenAsync<T> = {
  symbol: symbol;
  type?: Promise<T>; // Anchor for Typescript type inference.
  isAsync: true;
};

export type FeatureToken<T> = FeatureTokenSync<T> | FeatureTokenAsync<T>;

type FeatureTokenArgs = [] | [isActive: boolean] | [isActive: boolean, description: string] | [isActive: boolean, isAsync: boolean, description?: string];

export function featureToken<T>(): FeatureToken<T>;
export function featureToken<T>(isActive: boolean): FeatureToken<T>;
export function featureToken<T>(isActive: boolean, description: string): FeatureToken<T>;
export function featureToken<T>(isActive: boolean, isAsync: boolean, description?: string): FeatureToken<T>;

export function featureToken<T>(...args: FeatureTokenArgs): FeatureToken<T> {
  const isActive = !args.length ? false : args[0];
  const description = args.length === 2 ? args[1] as string : args.length > 2 ? args[2] : undefined;
  const isAsync = args.length > 2 ? args[1] as boolean : false;

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

  stateManager.addToken(token);
  
  return token;
}

export function loadFeature<T>(_token: FeatureToken<T>): void {
  // TODO
}

export function updateFeatureStatus<T>(token: FeatureToken<T>, status: boolean): void {
  // TODO
}

export function removeFeature<T>(token: FeatureToken<T>): void {
  stateManager.removeToken(token);
}

export function subscribeChangeFeature<T>(token: FeatureToken<T>, callback: SubscriptionTokenAction<T>): void {
  stateManager.subscriptionToken(token, callback);
}

export function unsubscribeChangeFeature<T>(token: FeatureToken<T>, callback: SubscriptionTokenAction<T>): void {
  stateManager.unsubscriptionToken(token, callback);
}
