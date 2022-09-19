/**
 * A file for creating a controller and working with it.
 * 
 * The controller is used to bind features to data.
 * If the feature is active, the controller returns the value attached to it.
 * If it is not active, the default value or undefined sticks out
 * 
 * The controller is able to work with asynchronous data. When the feature is activated,
 * if a function that returns a promise was passed to the value, then the download will begin
 */

import type { FeatureToken } from './token';

import type { SubscriptionControllerAction } from './stateManager';
import { stateManager } from './stateManager';

export type ControllerToken = {
  symbol: symbol;
}

export function controllerToken(description?: string): ControllerToken {
  return {
    symbol: Symbol(description),
  }
}

export interface Controller {
  /**
   * Method for linking a feature with data via a controller
   * 
   * @param token Feature Token
   * @param value Controller State value
   * @param defaultValue default value if feature is disactive or value is promise (processing)
   */
  bindValue<T>(token: FeatureToken<T>, value: T, defaultValue?: T): void;

  /**
   * Method for getting the current value of the controller for the given feature.
   * If the feature is disabled, the default value is returned.
   * 
   * @param token Feature Token
   */
  get<T>(token: FeatureToken<T>): T | undefined;

  /**
   * Method for subscribing to update the state of the feature data.
   * Updates are called when the state of the token changes,
   * and also if the value was lazy (for all stages of loading)
   * 
   * @param token Feature Token
   * @param callback 
   */
  subscribe<T>(token: FeatureToken<T>, callback: SubscriptionControllerAction<T>): void;
  /**
   * Method for unsubscribing to update the state of the feature data.
   * @param token Feature Token
   * @param callback 
   */
  unsubscribe<T>(token: FeatureToken<T>, callback: SubscriptionControllerAction<T>): void;
  /**
   * Unsubscribe from all feature updates
   * @param token Feature Token
   */
  unsubscribeAll<T>(token: FeatureToken<T>): void;

  /**
   * Clear all dates in class and unsubscribes all events
   */
  clear(): void;
}

export class FeatureController implements Controller {
  private controllerToken: ControllerToken;
  private subscribesToken: Set<FeatureToken<any>> = new Set();
 
  constructor(token?: ControllerToken) {
    this.controllerToken = token || controllerToken();
  }

  bindValue<T>(token: FeatureToken<T>, value: T, defaultValue?: T): void {
    stateManager.bindControllerValue(token, this.controllerToken, value, defaultValue);
  }

  get<T>(token: FeatureToken<T>): T | undefined {
    return stateManager.getControllerValue(token, this.controllerToken);
  }

  subscribe<T>(token: FeatureToken<T>, callback: SubscriptionControllerAction<T>): void {
    this.subscribesToken.add(token);
    stateManager.subscribeControllerState(token, this.controllerToken, callback);
  }

  unsubscribe<T>(token: FeatureToken<T>, callback: SubscriptionControllerAction<T>): void {
    this.subscribesToken.delete(token);
    stateManager.unsubscribeControllerState(token, this.controllerToken, callback);
  }

  unsubscribeAll<T>(token: FeatureToken<T>): void {
    stateManager.unsubscribeAllControllerState(token, this.controllerToken);
  }

  clear(): void {
    this.subscribesToken.forEach((token) => this.unsubscribeAll(token));
    this.subscribesToken.clear();
  }
}
