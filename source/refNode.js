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

const refNode = (key: FirebasePath, emit: (event: Event) => void): RefNode => {
  const set = (value, cb) => {
    return emit({
      type: 'mutate',
      path: key,
      mutations: [{ type: 'set', path: '', value: value }],
      syncCallback: cb,
    });
  };
  const update = (value: { [key: string]: FirebaseValue }, cb: (error: any) => void) => {
    const mutations = Object.keys(value).map(key => {
      return { type: 'set', path: key, value: value[key] };
    });
    return emit({
      type: 'mutate',
      path: key,
      mutations: mutations,
      syncCallback: cb,
    });
  };
  const child = (childKey) => {
    return refNode(`${key}/${childKey}`, emit);
  };

  return {
    key: key,
    push: (value, cb) => {
      const id = pushId()
      const donePromise = update({ [id]: value }, cb);
      return child(id);
      //return thenableRefNode(child(id), donePromise);
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
        type: 'unsubscribe',
        path: key,
        event: event,
        function: listener,
      });
    },
  };
};

export default refNode;
