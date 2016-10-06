// @flow

// import EventEmitter from './EventEmitter'
import refNode from './refNode';
import { get, last, set } from 'lodash';
import DataSnapshot from './datasnapshot';

type Transform<T> = (value: T) => T;

const id = x => x;
const compose = <T>(xs: Transform<T>[]): Transform<T> => {
  return (xs.reduce((acc, fn) => {
    return (x) => fn(acc(x))
  }, id): any);
};

// const possibleEvents = ['value']
// const rootKey = Symbol('Root of the state tree')
// const rawEvents = ['set', 'update', 'subscription', 'unsubscription'];

const callEvent = (data, event) => {
  let path = event.path.split('/').slice(1)
  console.log('path:', event.path, path);
  let value = path.lengh === 0 ? data : get(data, path);
  if (value !== 'undefined') {
    event.function(DataSnapshot({ ref: null, key: last(path), value }));
  }
};

let subscriptionMiddleware

let defaultMiddleware = next => event => {
  next(event);
  return new Promise(() => {});
}
let exothermic = (initdata: Object, middleware: * = defaultMiddleware) => {
  //let rawEventsEmitter = EventEmitter(rawEvents);
  let data = initdata;
  let subscriptions = [];

  const rootNode = refNode('', middleware(event => {
    console.log('event.path:', event.path);
    const path = event.path.split('/').slice(1);
    console.log('path:', path);
    switch (event.type) {
      case 'subscribe':
        callEvent(data, event);
        subscriptions = [...subscriptions, event];
        return;

      case 'unsubscribe':
        subscriptions = subscriptions
          .filter(e => e.path !== event.path || e.function !== event.function);
        return;

      case 'set':
        set(data, path, event.value);
        const regex = new RegExp(`^${path.map(x => `($|\/${x})`).join('')}.*`);
        console.log('regex:', regex);
        subscriptions
          .filter(e => {
            const result = regex.test(e.path);
            console.log('result, e.path, regex:', result, e.path, regex);
            return result;
          })
          .forEach(e => {
            console.log('e:', e);
            callEvent(data, e);
          });
        return;

      default:
        throw new Error(`Unknown event '${event.type}'.`);
    }
  }));

  return rootNode;
}

export default exothermic
