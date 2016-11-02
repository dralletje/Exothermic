// @flow

import { get, last, set, difference } from 'lodash';
import { Observable, Subject } from 'rxjs';
import { createStore, applyMiddleware } from 'redux';

import refNode from './refNode';
import DataSnapshot from './datasnapshot';

import type {
  RefNode, ThenableRefNode,
  Event, FirebasePath,
  FirebaseValue, FirebaseData,
} from './types';

type Transform<T> = (value: T) => T;

const id = x => x;
export const compose = <T>(xs: Transform<T>[]): Transform<T> => {
  return (xs.reduce((acc, fn) => {
    return (x) => acc(fn(x))
  }, id): any);
};

const matchPathParents = (path: string[]): RegExp =>
  new RegExp(`^${path.map(x => `($|\/${x})`).join('')}`);

const matchPathParentsAndChildren = (path: string[]): RegExp =>
  new RegExp(`^${path.map(x => `($|\/${x})`).join('')}.*`);

const splitPath = (path: string): string[] =>
  path.split('/').filter(x => x !== '');

// const possibleEvents = ['value']
// const rootKey = Symbol('Root of the state tree')
// const rawEvents = ['set', 'update', 'subscription', 'unsubscription'];

const callEvent = (data: FirebaseData, event: Event, callWhenUndefined = false) => {
  let path = splitPath(event.path);
  let value = path.length === 0 ? data : get(data, path);

  if (value === undefined && !callWhenUndefined) {
    return;
  }

  event.function(DataSnapshot({
    ref: null,
    key: last(path),
    value: value === undefined ? null : value,
  }), event);
};

type EventHandler = (event: Event, data: FirebaseData) => any;

type Store = {
  dispatch: (e: Event) => void,
  getState: () => FirebaseData,
  subscribe: (fn: () => void) => void,
}

export let attachRefNode = (store: Store) => {
  return refNode('', event => {
    store.dispatch(event);
  });
}

export let addSubscriptionsToStore = (store: Store, letMeKnow: ?(() => {}) = null) => {
  let subscriptions = [];

  let sameSubscriptionAs = eventToCompareWith => event =>
    eventToCompareWith.path === event.path && eventToCompareWith.function === event.function
  let not = fn => x => !fn(x);

  // Subscribe to the actions
  store.subscribe(() => {
    // This will get the newest data and the event that triggered it.
    let { data, lastEvent: event } = store.getState();

    if (event === undefined || event.path === undefined) {
      return;
    }

    let oldSubscriptionPaths = subscriptions.map(x => x.path);
    if (event.type === 'subscribe') {
      if (subscriptions.find(sameSubscriptionAs(event))) {
        // This combination of function and path is already a subscriptions:
        // We don't want double subscriptions like that.
        return;
      }

      // If there is no thing listening for global subscriptions,
      // just act as a simple store and call the function directly
      let callWhenUndefined = !letMeKnow;
      callEvent(data, event, callWhenUndefined);

      // Add subscription
      subscriptions = [...subscriptions, event];
      // And compare it and sent the change
      let nextSubscriptionPaths = subscriptions.map(x => x.path);
      let added = difference(nextSubscriptionPaths, oldSubscriptionPaths);

      if (letMeKnow && added.length !== 0) {
        letMeKnow({
          type: 'subscription:added',
          paths: added,
        });
      }
    }

    if (event.type === 'unsubscribe') {
      // Remove the subscription
      subscriptions = subscriptions
        .filter(not(sameSubscriptionAs(event)));
      // And take the diff and sent it
      let nextSubscriptionPaths = subscriptions.map(x => x.path);
      let removed = difference(oldSubscriptionPaths, nextSubscriptionPaths);
      if (letMeKnow && removed.length !== 0) {
        letMeKnow({
          type: 'subscription:removed',
          paths: removed,
        });
      }
    }

    // If it is mutated, let the subscriptions know
    if (event.type === 'mutate') {
      let path = splitPath(event.path);
      const regex = new RegExp(`^${path.map(x => `($|\/${x})`).join('')}.*`);
      subscriptions
        .filter(e => regex.test(e.path))
        .forEach(e => {
          callEvent(data, e, true);
        });
    }
  });
}

let exothermic = (initialData: FirebaseData) => {
  let store = createStore((state = { lastEvent: null, data: initialData }, event: Event) => {
    if (event.type === 'mutate') {
      let path = splitPath(event.path);
      event.mutations.forEach(mutation => {
        set(state.data, [...path, ...splitPath(mutation.path)], mutation.value);
      });
    }

    return {
      lastEvent: event,
      data: state.data,
    };
  })

  return store;
}

export default exothermic
