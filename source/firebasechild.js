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
    let filtered_value = filter_by_query(value, this._query);
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
  equalTo(value) {
    return new FirebaseQuery(this._parent, this._key, this._options, {
      ...this._query,
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
    let key = new Buffer(String(Math.pow((1024 + incrementor) * (keys_length + 1), 2))).toString('base64').slice(0, 10).toUpperCase();
    incrementor = incrementor + 1;
  }
  return key;
}

const firebasechild = (parent, key, options) => {
  return new FirebaseChild(parent, key, options)
}

export default firebasechild
