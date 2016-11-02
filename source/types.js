export type FirebaseSnapshot = any;
export type FirebaseValue = any;
export type FirebaseData = any;
export type FirebasePath = string;
export type FirebaseEvent = 'value';
export type FirebaseListener = (snapshot: FirebaseSnapshot) => void;
export type ErrorCallback = (error: ?Error) => void;

export type ThenableRefNode = RefNode & { then: Promise.prototype.then<void> };
export type RefNode = {
  child: (key: FirebasePath) => RefNode,
  set: (value: FirebaseValue, cb: ErrorCallback) => Promise<void>,
  update: (value: { [key: string]: FirebaseValue }, cb: ErrorCallback) => Promise<void>,
  push: (value: FirebaseValue, cb: ErrorCallback) => ThenableRefNode,

  on: (type: FirebaseEvent, listener: FirebaseListener, errorCb: ?ErrorCallback) => FirebaseListener,
  off: (type: FirebaseEvent, listener: FirebaseListener) => void,
};

export type Mutation = { type: 'set', path: FirebasePath, value: FirebaseValue };

export type SubscribeFn = (snapshot: FirebaseSnapshot) => void;
export type Event =
  | { type: 'subscribe', event: FirebaseEvent, path: FirebasePath, function: SubscribeFn, errorFn?: ErrorCallback }
  | { type: 'unsubscribe', event: FirebaseEvent, path: FirebasePath, function: SubscribeFn }
  | { type: 'mutate', path: FirebasePath, mutations: Mutation[], syncCallback?: ErrorCallback }
