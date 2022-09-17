import type {
  FeatureTokenSync,
  FeatureTokenAsync,
  FeatureToken,
} from './token';

import type { ControllerToken } from './controller';

export type SubscriptionTokenAction<T> = ((value: Omit<TokenState<T>, 'isActive' | 'isLoad'>) => void);
export type SubscriptionControllerAction<T> = ((value: ControllerState<T>['value']) => void);

type ControllerState<T> = {
  value: T;
  defaultValue?: T;
  isLoad: boolean;
  subscriptions: Set<any>;
};

type TokenState<T> = {
  isActive: boolean;
  subscribes: Set<SubscriptionTokenAction<T>>;
  controllerState: Map<symbol, ControllerState<T>>;
};

type StateMap = Map<symbol, TokenState<any>>;

// save token values
/**
 * [token]: [
 *  isActive: boolean,
 *  [feature_1], // controller_1_token
 *  [feature_2], // controller_2_token
 * ]
 */
export interface StateManagerI {
  addToken<T>(token: FeatureToken<T>): void;
  removeToken<T>(token: FeatureToken<T>): void;

  bindControllerValue<T>(token: FeatureToken<T>, controllerToken: ControllerToken, value: T): void;

  subscriptionToken<T>(token: FeatureToken<T>, callback: SubscriptionTokenAction<T>): void;
  unsubscriptionToken<T>(token: FeatureToken<T>, callback: SubscriptionTokenAction<T>): void;

  subscribeControllerState<T>(token: FeatureToken<T>, controllerToken: ControllerToken, callback: SubscriptionControllerAction<T>): void;
  unsubscribeControllerState<T>(token: FeatureToken<T>, controllerToken: ControllerToken, callback: SubscriptionControllerAction<T>): void;

  updateActiveToken<T>(token: FeatureToken<T>, status: boolean): void;

  clear(): void;
}

class StateManager implements StateManagerI {
  private state: StateMap = new Map();

  addToken<T>(token: FeatureToken<T>): void {
    if (this.state.has(token.symbol)) return;

    // TODO isActive
    this.state.set(token.symbol, {
      isActive: false,
      subscribes: new Set(),
      controllerState: new Map(),
    })
  }

  removeToken<T>(token: FeatureToken<T>): void {
    this.state.delete(token.symbol);
  }

  bindControllerValue<T>(token: FeatureToken<T>, controllerToken: ControllerToken, value: T, defaultValue?: T): void {
    if (!this.state.has(token.symbol)) {
      this.addToken(token);
    }

    this.state.get(token.symbol)?.controllerState.set(
      controllerToken.symbol,
      {
        value,
        defaultValue,
        isLoad: !token.isAsync,
        subscriptions: new Set(),
      },
    );
  }

  subscriptionToken<T>(token: FeatureToken<T>, callback: SubscriptionTokenAction<T>): void {
    if(!this.state.has(token.symbol)) return;

    this.state.get(token.symbol)?.subscribes.add(callback);
  }

  unsubscriptionToken<T>(token: FeatureToken<T>, callback: SubscriptionTokenAction<T>): void {
    if(!this.state.has(token.symbol)) return;

    this.state.get(token.symbol)?.subscribes.delete(callback);
  }

  subscribeControllerState<T>(token: FeatureToken<T>, controllerToken: ControllerToken, callback: SubscriptionControllerAction<T>): void {
    if(!this.state.has(token.symbol) || !this.state.get(token.symbol)?.controllerState.has(controllerToken.symbol)) return;

    this.state.get(token.symbol)?.controllerState.get(controllerToken.symbol)?.subscriptions.add(callback);
  }

  unsubscribeControllerState<T>(token: FeatureToken<T>, controllerToken: ControllerToken, callback: SubscriptionControllerAction<T>): void {
    if(!this.state.has(token.symbol) || !this.state.get(token.symbol)?.controllerState.has(controllerToken.symbol)) return;

    this.state.get(token.symbol)?.controllerState.get(controllerToken.symbol)?.subscriptions.delete(callback);
  }

  updateActiveToken<T>(token: FeatureToken<T>, status: boolean): void {
    
  }

  clear(): void {
    this.state.clear();
  }
}

export const stateManager = new StateManager();
