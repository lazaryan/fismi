import type {
  FeatureToken,
} from './token';

import type {
  SubscriptionControllerAction,
} from './stateManager';
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
  bindValue<T>(token: FeatureToken<T>, value: T, defaultValue?: T): void;

  subscribe<T>(token: FeatureToken<T>, callback: SubscriptionControllerAction<T>): void;
  unsubscribe<T>(token: FeatureToken<T>, callback: SubscriptionControllerAction<T>): void;
}

export class FeatureController implements Controller {
  private controllerToken: ControllerToken;
 
  constructor(token: ControllerToken) {
    this.controllerToken = token;
  }

  bindValue<T>(token: FeatureToken<T>, value: T, defaultValue?: T): void {
    stateManager.bindControllerValue(token, this.controllerToken, value, defaultValue);
  }

  subscribe<T>(token: FeatureToken<T>, callback: SubscriptionControllerAction<T>): void {
    stateManager.subscribeControllerState(token, this.controllerToken, callback);
  }

  unsubscribe<T>(token: FeatureToken<T>, callback: SubscriptionControllerAction<T>): void {
    stateManager.unsubscribeControllerState(token, this.controllerToken, callback);
  }
}
