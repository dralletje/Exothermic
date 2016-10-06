// @flow

import pushId from './pushId';

import type {
  RefNode, ThenableRefNode,
  Event, FirebasePath,
  FirebaseValue,
} from './types';

const thenableRefNode = (node: RefNode, promise: Promise<void>): ThenableRefNode => {
  return {
    ...node,
    then: promise.then.bind(promise),
  };
};

const addCallbackToPromise = <T>(promise: Promise<T>, cb: (error: ?Error, value: ?T) => void): Promise<T> => {
  promise
    .then(x => cb && cb(null, x))
    .catch(error => cb && cb(error, null))
  return promise;
};

const refNode = (key: FirebasePath, emit: (event: Event) => Promise<void>): RefNode => {
  const set = (value, cb) => {
    return addCallbackToPromise(emit({
      type: 'set',
      path: key,
      value: value,
    }), cb);
  };
  const update = (value: FirebaseValue, cb: (error: any) => void) => {
    return addCallbackToPromise(emit({
      type: 'update',
      path: key,
      value: value
    }), cb);
  };
  const child = (childKey) => {
    return refNode(`${key}/${childKey}`, emit);
  };

  return {
    key: key,
    push: (value, cb) => {
      const id = pushId()
      const donePromise = update({ [id]: value }, cb);
      return thenableRefNode(child(id), donePromise);
    },
    remove: (cb) => {
      return set(null, cb);
    },
    child: child,
    update: update,
    set: set,

    on: (event, listener, errorcb) => {
      emit({
        type: 'subscribe',
        path: key,
        event: event,
        function: listener,
        errorFn: errorcb,
      });
      return listener;
    },

    off: (event, listener) => {
      emit({
        type: 'subscribe',
        path: key,
        event: event,
        function: listener,
      });
    },
  };
};

export default refNode;
