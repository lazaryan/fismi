/**
 * File for creating tokens.
 * 
 * The token has the ability to work with asynchronous data.
 * 
 * The token in this package is a handle for managing features.
 * It allows you to enable / disable features, subscribe to their changes,
 * and is also used to communicate with controllers
 * 
 * Each feature can have multiple controllers.
 * When a feature is turned off, they all hide their value.
 * When enabled, the value is available again.
 * If the token is asynchronous, then the controller value will start loading.
 */

import type { SubscriptionTokenAction } from './stateManager';
import { stateManager } from './stateManager';

/**
 * Pens for working with a token.
 * Allows you to change its state, as well as subscribe to its updates
 */
export type TokenActions<T> = {
  /**
   * Method to load the data of all asynchronous controllers associated with this token
   */
  loadFeature(): void;
  /**
   * Method for updating the state of the token.
   * 
   * If a feature is disabled,
   * all controllers associated with it also hide their value and only default values stick out, if any.
   * 
   * If a feature is enabled, all controllers associated with it are again available in the application.
   * If their value is asynchronous and has not yet been initialized, initialization begins.
   * 
   * @param status new Token status (active/disactive)
   */
  updateFeatureStatus(status: boolean): void;
  /**
   * Deleting all information about a given token in stateManager
   */
  removeFeature(): void;
  /**
   * Subscription method for token state update
   * @param callback The function that will be called when the activity of the token changes
   */
  subscribeChangeFeature(callback: SubscriptionTokenAction<T>): void;
  /**
   * Unsubscription method for token state update
   * @param callback The function that will be called when the activity of the token changes
   */
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

/**
 * Method for creating token
 * 
 * The token has the ability to work with asynchronous data.
 * 
 * The token in this package is a handle for managing features.
 * It allows you to enable / disable features, subscribe to their changes,
 * and is also used to communicate with controllers
 * 
 * Each feature can have multiple controllers.
 * When a feature is turned off, they all hide their value.
 * When enabled, the value is available again.
 * If the token is asynchronous, then the controller value will start loading.
 * @param args 
 * @returns {FeatureToken<T>} new Token
 */
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
