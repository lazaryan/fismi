import type { SubscriptionTokenAction } from './stateManager';
import { stateManager } from './stateManager';

export type TokenActions<T> = {
  loadFeature(): void;
  updateFeatureStatus(status: boolean): void;
  removeFeature(): void;
  subscribeChangeFeature(callback: SubscriptionTokenAction<T>): void;
  unsubscribeChangeFeature(callback: SubscriptionTokenAction<T>): void;
}

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

export type BaseFeatureToken<T> = FeatureTokenSync<T> | FeatureTokenAsync<T>;

export type FeatureToken<T> = BaseFeatureToken<T> & TokenActions<T>;

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

  const token: FeatureToken<T> = {
    symbol,
    isAsync,
    loadFeature() {
      stateManager.loadControllersValue(this);
    },
    removeFeature() {
      stateManager.removeToken(this);
    },
    updateFeatureStatus(status: boolean) {
      stateManager.updateActiveToken(this, status);
    },
    subscribeChangeFeature<T>(callback: SubscriptionTokenAction<T>) {
      stateManager.subscriptionToken(this, callback);
    },
    unsubscribeChangeFeature<T>(callback: SubscriptionTokenAction<T>) {
      stateManager.unsubscriptionToken(this, callback);
    },
  };

  stateManager.addToken(token);

  if (isActive) {
    stateManager.updateActiveToken(token, true);
  }
  
  return token;
}
