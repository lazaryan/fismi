import type {
  FeatureTokenSync,
  FeatureTokenAsync,
  FeatureToken,
} from './token';

import type {
  SubscribeAction,
} from './register';
import { register } from './register';

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
  bindValue<T>(token: FeatureToken<T>, value: T): void;

  subscribe<T>(token: FeatureToken<T>, callback: SubscribeAction): void;
  unsubscribe<T>(token: FeatureToken<T>, callback: SubscribeAction): void;
}

export class FeatureController implements Controller {
  private controllerToken: ControllerToken;
 
  constructor(token: ControllerToken) {
    this.controllerToken = token;
  }

  bindValue<T>(token: FeatureToken<T>, value: T): void {
    stateManager.bindControllerValue(token, this.controllerToken, value);
  }

  subscribe<T>(token: FeatureToken<T>, callback: SubscribeAction): void {

  }

  unsubscribe<T>(token: FeatureToken<T>, callback: SubscribeAction): void {

  }
}
