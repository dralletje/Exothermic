import EventEmitter from './EventEmitter'
import DataSnapshot from './datasnapshot'

import pushId from './pushId'

import fp from 'lodash/fp';
import { fromPairs, toPairs, isEqual, difference, intersection } from 'lodash';

const possibleEvents = ['value', 'child_removed', 'child_added'];

let precondition = (condition, message = `Unmet precondition`) => {
  if (!condition) {
    throw new Error(message);
  }
}

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

const is_valid_query = ({ orderBy, equalTo, limit }) => {
  if (orderBy != null) {
    return equalTo != null || limit != null;
  }
  return true;
}

let EXPLICIT_NULL = Symbol(`Explicitly set null`);

let match = (key, matchers) => {
  if (key == null) {
    return fp.identity;
  }
  if (key === '') {
    throw new Error(`MATCH: Key can not be an empty string`)
  }
  let fn = matchers[key];
  if (fn) {
    return fn;
  } else {
    if (matchers[match.any]) {
      return matchers[match.any];
    } else {
      throw new Error(`No match-er found for key '${key}' and no [match.any]: provided`);
    }
  }
}
match.any = Symbol(`Match any value`);
match.null = Symbol(`Match null and undefined`);

let tap = (fn) => (x) => {
  fn(x);
  return x;
}

const filter_by_query = (value, { orderBy, equalTo, limit }) => {
  let compare_fn = match(equalTo, {
    [EXPLICIT_NULL]: x => x == null,
    [match.any]: x => x === equalTo,
  });

  let sort_fn = match(orderBy && orderBy.type, {
    child: ({ value }) => value[orderBy.child],
    value: ({ value }) => value,
    key: ({ key }) => key,
  })

  return fp.flow(
    () => value,

    fp.toPairs,
    fp.map(([key, value]) => {
      return { key, value, sort_value: sort_fn({ key, value }) }
    }),

    fp.filter(({ sort_value }) => compare_fn(sort_value)),

    match(limit && limit.type, {
      first: limit && fp.take(limit.count),
      last: limit && fp.takeRight(limit.count),
    }),

    fp.map(({ key, value }) => [key, value]), // undoes map
    fp.fromPairs, // undoes toPairs
  )();
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
    this._parent = parent;
    this._key = key;
    this._query = query;
    this._options = options;

    this._emitter = EventEmitter(possibleEvents);

    this._current_snapshot = this._get_snapshot();

    // If parent changes, you change too
    //@TODO Remove handler on garbage collect? idk?
    this._parent.on('value', () => {
      let old_snapshot = this._current_snapshot;
      let snapshot = this._get_snapshot();
      let { added, removed, changed } = compare_objects(old_snapshot.val(), snapshot.val());

      this._current_snapshot = snapshot;
      this._emitter.emit('value', snapshot);

      // console.log(`old_val, val:`, old_val, val)
      // console.log(`added, removed, changed:`, added, removed, changed)

      added.forEach(key => {
        this._emitter.emit('child_added', snapshot.child(key));
      });
      removed.forEach(key => {
        this._emitter.emit('child_removed', old_snapshot.child(key));
      });
    })
  }

  ref() {
    return this._key === null ? this : this._parent.child(this._key);
  }
  key() {
    return this._key;
  }
  parent() {
    return this._key === null ? null : this._parent;
  }
  root() {
    return this._key === null ? this : this._parent.root();
  }

  _get_snapshot() {
    const value = this._parent.__get(this._key);
    let filtered_value =
      isEqual(this._query, {})
      ? value
      : filter_by_query(value, this._query);
    return DataSnapshot({ key: this._key, value: filtered_value, ref: this });
  }

  on(event, fn) {
    if (!is_valid_query(this._query)) {
      throw new Error(`Invalid query!`);
    }

    if (event === 'child_added') {
      // TODO Go over current value and call children
      timeout(_ => {
        let snapshot = this._get_snapshot();
        snapshot.forEach(child => {
          fn(child);
        });
      }, this._options.delay);
    }
    if (event === 'value') {
      timeout(_ => fn(this._get_snapshot()), this._options.delay);
    }
    return this._emitter.on(event, fn)
  }
  once(event, fn) {
    if (!is_valid_query(this._query)) {
      throw new Error(`Invalid query!`);
    }
    // // Go back to your non-realtime relation database!
    // throw new Error('You really shouldn\'t use once.')

    if (event === 'value') {
      if (fn) {
        timeout(_ => fn(this._get_snapshot()), this._options.delay);
      }
      return Promise.resolve(this._get_snapshot());
    } else {
      throw new Error(`This doesn't make sense I guess`);
    }
  }

  // Implementation
  __get(prop) {
    let value = this._parent.__get(this._key);

    if (prop == null) {
      return value;
    } else {
      return value != null && value[prop] != null ? value[prop] : null;
    }
  }

  orderByChild(child) {
    if (this._query.orderBy != null) {
      throw new Error(`Query already ordered (by ${this._query.orderBy.type})`)
    }
    return new FirebaseQuery(this._parent, this._key, this._options, {
      ...this._query,
      orderBy: { type: 'child', child: child },
    });
  }
  orderByValue() {
    if (this._query.orderBy != null) {
      throw new Error(`Query already ordered (by ${this._query.orderBy.type})`)
    }
    return new FirebaseQuery(this._parent, this._key, this._options, {
      ...this._query,
      orderBy: { type: 'value' },
    });
  }
  orderByKey() {
    if (this._query.orderBy != null) {
      throw new Error(`Query already ordered (by ${this._query.orderBy.type})`)
    }
    return new FirebaseQuery(this._parent, this._key, this._options, {
      ...this._query,
      orderBy: { type: 'key' },
    });
  }
  equalTo(value) {
    return new FirebaseQuery(this._parent, this._key, this._options, {
      ...this._query,
      equalTo: value === null ? EXPLICIT_NULL : value,
    });
  }
  limitToLast(n) {
    return new FirebaseQuery(this._parent, this._key, this._options, {
      ...this._query,
      limit: { type: 'last', count: n },
    });
  }
  limitToFirst(n) {
    return new FirebaseQuery(this._parent, this._key, this._options, {
      ...this._query,
      limit: { type: 'first', count: n },
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
    this._children = {};
  }

  __onChange(change) {
    this._parent.__onChange({
      ...change,
      path: [this._key, ...(change.path || [])],
    });
  }

  set(value, cb) {
    this.__onChange({
      type: 'set',
      value: value,
    })

    if (typeof cb === 'function') {
      cb(null)
    }
  }

  update(value, cb) {
    this.__onChange({
      type: 'update',
      value: value,
    });
    if (typeof cb === 'function') {
      cb(null)
    }
  }

  child(path) {
    const [first, ...tail] = Array.isArray(path) ? path : path.split('/')
    const child = this._children[first] || new FirebaseChild(this, first, this._options)
    this._children = {
      ...this._children,
      [first]: child,
    }
    return tail.length === 0 ? child : child.child(tail)
  }

  remove(cb) {
    this.set(null, cb);
  }

  push(value, cb) {
    // TODO Make this actually  it's own type of "onChange"
    let current_value_keys = Object.keys(this.__get() || {});
    // Deterministically generate the ID based on the keys currently in the object
    const id = generate_id(current_value_keys);
    this.update({ [id]: value }, cb);
    return DataSnapshot({ key: id, value, ref: this.child(id) })
  }
}

const generate_id = (existing_keys) => {
  let key = null;
  let incrementor = 0;
  let keys_length = existing_keys.length;

  while (key == null || existing_keys.includes(key)) {
    key = `key${incrementor}`;
    incrementor = incrementor + 1;
    if (incrementor > 100) {
      throw new Error(`DAMN lot of removes I guess? (key generator exhausted (100))`);
    }
  }
  return key;
}

const firebasechild = (parent, key, options) => {
  return new FirebaseChild(parent, key, options)
}

export default firebasechild
