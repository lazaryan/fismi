import type { FeatureToken } from './token';

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

type BaseControllerState<T> = {
  defaultValue?: T;
  processStatus: ControllerLoadStatus;
  subscriptions: Set<SubscriptionControllerAction<T>>;
  isAsync: boolean;
  token: ControllerToken;
};

type ControllerStateSync<T> = BaseControllerState<T> & {
  value: T;
  isAsync: false;
  processStatus: 'init';
}

type ControllerStateAsyncIsFail<T> = BaseControllerState<T> & {
  value?: any;
  isAsync: true;
  processStatus: 'fail';
}

type ControllerStateAsyncIsLoad<T> = BaseControllerState<T> & {
  value: T;
  isAsync: true;
  processStatus: 'done';
}

type ControllerStateAsync<T> = BaseControllerState<T> & {
  value: AsyncControllerValue<T>;
  isAsync: true;
  processStatus: 'init' | 'process';
}

type ControllerState<T> = ControllerStateSync<T> | ControllerStateAsyncIsLoad<T> | ControllerStateAsyncIsFail<T> | ControllerStateAsync<T>;

type TokenState<T> = {
  isActive: boolean;
  subscribes: Set<SubscriptionTokenAction<T>>;
  controllerState: Map<symbol, ControllerState<T>>;
};

type StateMap = Map<symbol, TokenState<any>>;

export interface StateManagerI {
  addToken<T>(token: FeatureToken<T>): void;
  removeToken<T>(token: FeatureToken<T>): void;

  bindControllerValue<T>(token: FeatureToken<T>, controllerToken: ControllerToken, value: T): void;

  subscriptionToken<T>(token: FeatureToken<T>, callback: SubscriptionTokenAction<T>): void;
  unsubscriptionToken<T>(token: FeatureToken<T>, callback: SubscriptionTokenAction<T>): void;

  subscribeControllerState<T>(token: FeatureToken<T>, controllerToken: ControllerToken, callback: SubscriptionControllerAction<T>): void;
  unsubscribeControllerState<T>(token: FeatureToken<T>, controllerToken: ControllerToken, callback: SubscriptionControllerAction<T>): void;
  unsubscribeAllControllerState<T>(token: FeatureToken<T>, controllerToken: ControllerToken): void;

  getControllerValue<T>(token: FeatureToken<T>, controllerToken: ControllerToken): T | undefined;

  loadControllerValue<T>(token: FeatureToken<T>, controllerToken: ControllerToken): void;
  loadControllersValue<T>(token: FeatureToken<T>): void;

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
        token: controllerToken,
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

  unsubscribeAllControllerState<T>(token: FeatureToken<T>, controllerToken: ControllerToken): void {
    if(!this.state.has(token.symbol) || !this.state.get(token.symbol)?.controllerState.has(controllerToken.symbol)) return;

    this.state.get(token.symbol)?.controllerState.get(controllerToken.symbol)?.subscriptions.clear();
  }

  getControllerValue<T>(token: FeatureToken<T>, controllerToken: ControllerToken): T | undefined {
    const tokenStateNow = this.state.get(token.symbol);
    if (!tokenStateNow) return undefined;

    const controllerNow = tokenStateNow.controllerState.get(controllerToken.symbol);
    if (!controllerNow) return undefined;

    if (!controllerNow.isAsync) {
      return tokenStateNow.isActive ? controllerNow.defaultValue : controllerNow.value;
    }

    if (controllerNow.processStatus === 'process' || controllerNow.processStatus === 'fail' || controllerNow.processStatus === 'init') {
      return controllerNow.defaultValue;
    }

    return controllerNow.value;
  }

  loadControllerValue<T>(token: FeatureToken<T>, controllerToken: ControllerToken): void {
    const tokenStateNow = this.state.get(token.symbol);
    if (!tokenStateNow) return;

    const controllerNow = tokenStateNow.controllerState.get(controllerToken.symbol);
    if (!controllerNow) return;

    if(controllerNow.isAsync === false || controllerNow.processStatus !== 'init') return;

    const value = (controllerNow as ControllerStateAsync<T>).value();

    if (!isPromise<value) {
      tokenStateNow.controllerState.set(controllerToken.symbol, {
        ...controllerNow,
        processStatus: 'done',
        value,
      });

      controllerNow.subscriptions.forEach((callback) => {
        const returnValue: ReturnSubscriptionControllerData<T> = !tokenStateNow.isActive
            ? { isActive: false, value: controllerNow.defaultValue }
            : { isActive: true, value: value as T };

        callback(returnValue);
      });
    
      return;
    }

    (value as Promise<T>)
      .then((response) => {
        tokenStateNow.controllerState.set(controllerToken.symbol, {
          ...controllerNow,
          processStatus: 'done',
          value: response,
        });

        const activeStatus = this.state.get(token.symbol)?.isActive ?? false;

        controllerNow.subscriptions.forEach((callback) => {
          callback({ isActive: activeStatus, value: !activeStatus ? undefined : response });
        });
      })
      .catch((error) => {
        console.error(error);

        tokenStateNow.controllerState.set(controllerToken.symbol, {
          ...controllerNow,
          processStatus: 'fail',
          value: undefined,
        });

        controllerNow.subscriptions.forEach((callback) => {
          callback({ isActive: tokenStateNow.isActive, value: undefined });
        });
      })
  }

  loadControllersValue<T>(token: FeatureToken<T>): void {
    const tokenStateNow = this.state.get(token.symbol);

    if (!tokenStateNow) return;

    tokenStateNow.controllerState.forEach((controller) => {
      this.loadControllerValue(token, controller.token);
    })
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
  
    oldState.controllerState.forEach((controllerState) => {
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

      this.loadControllerValue(token, controllerState.token);
    })
  }

  clear(): void {
    this.state.clear();
  }
}

export const stateManager = new StateManager();

export function clearStateManager() {
  stateManager.clear();
}