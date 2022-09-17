import type {
  FeatureTokenSync,
  FeatureTokenAsync,
  FeatureToken,
} from './token';

import type { ControllerToken } from './controller';

export type SubscriptionTokenAction<T> = ((value: Omit<TokenState<T>, 'isActive' | 'isLoad'>) => void);
export type SubscriptionControllerAction<T> = ((value: TokenState<T>) => void);

type ControllerState<T> = {
  value: T;
  subscriptions: Set<any>;
};

type TokenState<T> = {
  isActive: boolean;
  isLoad: boolean;
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

  clear(): void;
}

class StateManager implements StateManagerI {
  private state: StateMap = new Map();

  addToken<T>(token: FeatureToken<T>): void {
    if (this.state.has(token.symbol)) return;

    // TODO isActive
    this.state.set(token.symbol, {
      isActive: false,
      isLoad: !token.isAsync,
      subscribes: new Set(),
      controllerState: new Map(),
    })
  }

  removeToken<T>(token: FeatureToken<T>): void {
    this.state.delete(token.symbol);
  }

  bindControllerValue<T>(token: FeatureToken<T>, controllerToken: ControllerToken, value: T): void {
    if (!this.state.has(token.symbol)) {
      this.addToken(token);
    }

    this.state.get(token.symbol)?.controllerState.set(
      controllerToken.symbol,
      {
        value,
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

  clear(): void {
    this.state.clear();
  }
}

export const stateManager = new StateManager();
