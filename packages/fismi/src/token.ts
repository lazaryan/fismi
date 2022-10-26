export type FeatureToken<T> = {
  symbol: symbol;
  type?: T;
};

export type OptionalFeatureToken<T> = FeatureToken<T> & {
  defaultValue: T;
};

export const createFeatureToken = () => {

}

export const createOptionalFeatureToken = () => {

}

export const createFabricFeatureTokens = <T>(_rootToken: FeatureToken<T>) => {

}

export const createFabricOptionalFeatureTokens = <T>(_rootToken: OptionalFeatureToken<T>) => {

}
