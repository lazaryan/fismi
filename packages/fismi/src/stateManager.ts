import type {
  FeatureToken,
} from './token';

import type { ControllerToken } from './controller';

import { isPromise } from './utils';

export type ReturnSubscriptionControllerDataIsDisactive<T> = {
  isActive: false;
  value?: T;
}

export type ReturnSubscriptionControllerDataIsActive<T> = {
  isActive: true;
  value?: T;
}

export type ReturnSubscriptionControllerData<T> = ReturnSubscriptionControllerDataIsActive<T> | ReturnSubscriptionControllerDataIsDisactive<T>;

export type SubscriptionTokenAction<T> = ((value: Pick<TokenState<T>, 'isActive'>) => void);
export type SubscriptionControllerAction<T> = ((value: ReturnSubscriptionControllerData<T>) => void);

export type ControllerLoadStatus = 'init' | 'process' | 'fail' | 'done';
export type AsyncControllerValue<T> = () => T | Promise<T>;

type ControllerStateSync<T> = {
  value: T;
  defaultValue?: T;
  isAsync: false;
  processStatus: 'init';
  subscriptions: Set<SubscriptionControllerAction<T>>;
}

type ControllerStateAsyncIsFail<T> = {
  value?: any;
  defaultValue?: T;
  isAsync: true;
  processStatus: 'fail';
  subscriptions: Set<SubscriptionControllerAction<T>>;
}

type ControllerStateAsyncIsLoad<T> = {
  value: T;
  defaultValue?: T;
  isAsync: true;
  processStatus: 'done';
  subscriptions: Set<SubscriptionControllerAction<T>>;
}

type ControllerStateAsync<T> = {
  value: AsyncControllerValue<T>;
  defaultValue?: T;
  isAsync: true;
  processStatus: 'init' | 'process';
  subscriptions: Set<SubscriptionControllerAction<T>>;
}

type ControllerState<T> = ControllerStateSync<T> | ControllerStateAsyncIsLoad<T> | ControllerStateAsyncIsFail<T> | ControllerStateAsync<T>;

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

  bindControllerValue<T, C extends ControllerState<T>>(
    token: FeatureToken<T>,
    controllerToken: ControllerToken,
    value: C['value'],
    defaultValue?: T
  ): void {
    if (!this.state.has(token.symbol)) {
      this.addToken(token);
    }

    this.state.get(token.symbol)?.controllerState.set(
      controllerToken.symbol,
      {
        value,
        defaultValue,
        isAsync: token.isAsync ?? false,
        processStatus: 'init',
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
    if(!this.state.has(token.symbol)) return;

    const oldState = this.state.get(token.symbol) as TokenState<T>;

    const newState: TokenState<T> = {
      ...oldState,
      isActive: status,
    };

    this.state.set(token.symbol, newState);

    oldState.subscribes.forEach((callback) => {
      callback({
        isActive: status,
      })
    });
  
    oldState.controllerState.forEach((controllerState, tokenSymbol) => {
      if(!controllerState.isAsync) {
        controllerState.subscriptions.forEach((callback) => {
          const returnValue: ReturnSubscriptionControllerData<T> = !status
            ? { isActive: false, value: controllerState.defaultValue }
            : { isActive: true, value: controllerState.value };

            callback(returnValue);
        });

        return;
      }
  
      if (controllerState.processStatus === 'done') {
        controllerState.subscriptions.forEach((callback) => {
          const returnValue: ReturnSubscriptionControllerData<T> = !status
            ? { isActive: false, value: controllerState.defaultValue }
            : { isActive: true, value: controllerState.value };

            callback(returnValue);
        });

        return;
      }

      if (controllerState.processStatus === 'init') {
        if (!status) {
          controllerState.subscriptions.forEach((callback) => {
            callback({ isActive: false, value: controllerState.defaultValue });
          });
        } else {
          const value = controllerState.value();

          const oldControllerState = oldState.controllerState.get(tokenSymbol) as Exclude<ReturnType<typeof oldState.controllerState.get>, undefined>;

          if (isPromise(value)) {
            oldControllerState.subscriptions.forEach((callback) => {
              callback({ isActive: true, value: oldControllerState.defaultValue });
            });

            (value as Promise<T>)
              .then((response) => {
                oldState.controllerState.set(tokenSymbol, {
                  ...oldControllerState,
                  processStatus: 'done',
                  value: response,
                } as ControllerStateAsyncIsLoad<any>); // TODO

                const activeStatus = this.state.get(token.symbol)?.isActive ?? false;

                oldControllerState.subscriptions.forEach((callback) => {
                  callback({ isActive: activeStatus, value: !activeStatus ? undefined : response });
                });
              })
              .catch(() => {
                oldState.controllerState.set(tokenSymbol, {
                  ...oldControllerState,
                  processStatus: 'fail',
                  value: undefined,
                } as ControllerStateAsyncIsFail<any>); // TODO

                oldControllerState.subscriptions.forEach((callback) => {
                  callback({ isActive: true, value: undefined });
                });
              })
          } else {
            oldState.controllerState.set(tokenSymbol, {
              ...oldControllerState,
              processStatus: 'done',
              value,
            } as ControllerStateAsyncIsLoad<any>); // TODO

            oldControllerState.subscriptions.forEach((callback) => {
              callback({ isActive: true, value: value as any}); // TODO
            });
          }
        }
      }
    })
  }

  clear(): void {
    this.state.clear();
  }
}

export const stateManager = new StateManager();
