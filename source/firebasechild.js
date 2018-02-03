import EventEmitter from './EventEmitter'
import DataSnapshot from './datasnapshot'

import pushId from './pushId'

import { fromPairs, toPairs, isEqual, difference, intersection } from 'lodash';

const possibleEvents = ['value', 'child_removed', 'child_added'];

const timeout = (fn, delay) => {
  if (delay === 0) {
    setImmediate(fn)
  }
  if (delay < 0) {
    fn()
  }
  if (delay > 0) {
    setTimeout(fn, delay)
  }
}

const is_valid_query = ({ orderBy, equalTo }) => {
  if (orderBy != null) {
    return equalTo != null;
  }
  return true;
}

let EXPLICIT_NULL = Symbol(`Explicitly set null`);

const filter_by_query = (value, { orderBy, equalTo }) => {
  let compare_fn = (x) => equalTo === EXPLICIT_NULL ? x == null : x === equalTo;

  if (orderBy == null) {
    return value;
  } else {
    if (orderBy.type === 'child') {
      return fromPairs(
        toPairs(value)
        // TODO More sophisticated compare
        .filter(([key, value]) => compare_fn(value[orderBy.child]))
      );
    } else if (orderBy.type === 'value') {
      return fromPairs(
        toPairs(value)
        // TODO More sophisticated compare
        .filter(([key, value]) => compare_fn(value))
      );
    } else {
      throw new Error(`HUH ${orderBy.type}`)
    }
  }
}

let compare_objects = (prev, next) => {
  let prev_keys = Object.keys(prev || {});
  let next_keys = Object.keys(next || {});

  let removed = difference(prev_keys, next_keys);
  let added = difference(next_keys, prev_keys);
  let changed = intersection(prev_keys, next_keys).filter(key => !isEqual(prev[key], next[key]));

  return { removed, added, changed };
}

class FirebaseQuery {
  constructor(parent, key, options, query = {}) {
    this.parent = parent;
    this.key = key;
    this.query = query;
    this.options = options;

    this.emitter = EventEmitter(possibleEvents);

    this.current_snapshot = this._get_snapshot();

    // If parent changes, you change too
    //@TODO: Compare to the old value and call child_added/child_removed if needed
    this.parent.on('value', () => {
      let old_snapshot = this.current_snapshot;
      let snapshot = this._get_snapshot();
      let { added, removed, changed } = compare_objects(old_snapshot.val(), snapshot.val());

      this.current_snapshot = snapshot;
      this.emitter.emit('value', snapshot);

      // console.log(`old_val, val:`, old_val, val)
      // console.log(`added, removed, changed:`, added, removed, changed)

      removed.forEach(key => {
        this.emitter.emit('child_removed', old_snapshot.child(key));
      });
    })
  }

  child(path) {
    // EZ
    return this.parent.child(this.key).child(path);
  }

  _get_snapshot() {
    const value = this.parent.__get(this.key);
    let filtered_value = filter_by_query(value, this.query);
    return DataSnapshot({ key: this.key, value: filtered_value, ref: this });
  }

  on(event, fn) {
    if (!is_valid_query(this.query)) {
      throw new Error(`Invalid query!`);
    }

    if (event === 'child_added') {
      // TODO Go over current value and call children
      timeout(_ => {
        let snapshot = this._get_snapshot();
        snapshot.forEach(child => {
          fn(child);
        });
      }, this.options.delay);
    }
    if (event === 'value') {
      timeout(_ => fn(this._get_snapshot()), this.options.delay);
    }
    return this.emitter.on(event, fn)
  }
  once(event, fn) {
    if (!is_valid_query(this.query)) {
      throw new Error(`Invalid query!`);
    }
    // // Go back to your non-realtime relation database!
    // throw new Error('You really shouldn\'t use once.')

    if (event === 'value') {
      if (fn) {
        timeout(_ => fn(this._get_snapshot()), this.options.delay);
      }
      return Promise.resolve(this._get_snapshot());
    } else {
      throw new Error(`This doesn't make sense I guess`);
    }
  }

  // Implementation
  __get(prop) {
    let value = this.parent.__get(this.key);
    return value != null && value[prop] != null ? value[prop] : null
  }

  orderByChild(child) {
    if (this.query.orderBy != null) {
      throw new Error(`Query already ordered (by ${this.query.orderBy.type})`)
    }
    return new FirebaseQuery(this.parent, this.key, this.options, {
      ...this.query,
      orderBy: { type: 'child', child: child },
    });
  }
  orderByValue() {
    if (this.query.orderBy != null) {
      throw new Error(`Query already ordered (by ${this.query.orderBy.type})`)
    }
    return new FirebaseQuery(this.parent, this.key, this.options, {
      ...this.query,
      orderBy: { type: 'value' },
    });
  }
  equalTo(value) {
    return new FirebaseQuery(this.parent, this.key, this.options, {
      ...this.query,
      equalTo: value === null ? EXPLICIT_NULL : value,
    });
  }

  // SMALL EXTENSIONS FOR JOBLETICS (STUPID)
  value() {
    return Promise.resolve(this._get_snapshot());
  }

  observe() {
    let Observable = require('rx');
    return Observable.create(observer => {
      // Listen to event
      const unbind =  this.on(event,
                      x => observer.onNext(x),
                      err => observer.onError(err))
      // Unbind on dispose
      return () => methods.off(event, unbind)
    })
  }
}

class FirebaseChild extends FirebaseQuery {
  constructor(parent, key, options) {
    super(parent, key, options, {});
    this.children = {};
  }

  set(value, cb) {
    this.parent.update({ [this.key]: value })
    this.emitter.emit('value', this._get_snapshot())
    if (typeof cb === 'function') {
      cb(null)
    }
  }

  update(value, cb) {
    this.set({
      ...this.parent.__get(this.key),
      ...value,
    }, cb)
  }

  child(path) {
    const [first, ...tail] = Array.isArray(path) ? path : path.split('/')
    const child = this.children[first] || new FirebaseChild(this, first, this.options)
    this.children = {
      ...this.children,
      [first]: child,
    }
    return tail.length === 0 ? child : child.child(tail)
  }

  remove(cb) {
    this.set(null, cb);
  }

  push(value, cb) {
    const id = pushId()
    this.update({ [id]: value }, cb)
    return DataSnapshot({ key: id, value, /* ref: TODO */ })
  }
}

const firebasechild = (parent, key, options) => {
  return new FirebaseChild(parent, key, options)
}

export default firebasechild
