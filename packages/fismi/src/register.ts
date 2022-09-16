import type {
  FeatureToken,
} from './token';

export type SubscribeAction = any;

type Subsciptions = Set<SubscribeAction>;

type TokenSubsciptions = Map<symbol, Subsciptions>;

interface RegisterI {
  addToken<T>(token: FeatureToken<T>): void;
  removeToken<T>(token: FeatureToken<T>): void;

  subscribe<T>(token: FeatureToken<T>, callback: SubscribeAction): void;
  unsubscribe<T>(token: FeatureToken<T>, callback: SubscribeAction): void;
  
  clear(): void;
}

class Register implements RegisterI {
  private tokenSubsriptions: TokenSubsciptions = new Map();

  addToken<T>(token: FeatureToken<T>): void {
    this.tokenSubsriptions.set(token.symbol, new Set());
  }

  removeToken<T>(token: FeatureToken<T>): void {
    this.tokenSubsriptions.delete(token.symbol);
  }

  subscribe<T>(token: FeatureToken<T>, callback: SubscribeAction): void {
    if (!this.tokenSubsriptions.has(token.symbol)) {
      this.addToken(token);
    }

    this.tokenSubsriptions.get(token.symbol)?.add(callback);
  }

  unsubscribe<T>(token: FeatureToken<T>, callback: SubscribeAction): void {
    this.tokenSubsriptions.get(token.symbol)?.delete(callback);
  }

  clear() {
    this.tokenSubsriptions.clear();
  }
}

export const register = new Register();
