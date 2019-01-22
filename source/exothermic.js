// NOTE lodash/fp so it is immutable update
import { update } from "lodash/fp";

import EventEmitter from "./EventEmitter";
import firebasechild, { DISCONNECT_EVENT, INTERNAL_VALUE_EVENT } from "./firebasechild";

// TODO This really the best I can do? 🤷‍♀️
const detect_array = (obj) => {
  let keys = Object.keys(obj);
  return Array.from({ length: keys.length }).every((_, index) =>
    keys.includes(String(index))
  );
};

const clean_object = (object) => {
  if (!object || typeof object !== "object") {
    return object;
  }

  // Split the object in an array
  // TODO Some lodash-ness?
  let cleaned = Object.entries(object)
    // My actual mutations I am interested in
    .map(([k, v]) => [k, clean_object(v)])
    .filter(([k, v]) => v !== null)
    // Bring it back to an object
    .reduce((o, [k, v]) => {
      o[k] = v;
      return o;
    }, {});

  let keys = Object.keys(cleaned);

  // Object is empty after cleaning it's children... to bad
  if (keys.length === 0) {
    return null;
  } else if (detect_array(cleaned)) {
    return Array.from({ ...cleaned, length: keys.length });
  } else {
    return cleaned;
  }
};

/*:flow
type T_Path = Array<string>;
type T_FirebaseChange =
  | { type: 'set', path: T_Path, value: mixed }
  | { type: 'update', path: T_Path, value: { [key: string]: mixed } }
  | { type: 'ondisconnect', change: T_FirebaseChange }
*/
const apply_firebase_change = (change, data) => {
  let path = change.path.slice(1);

  if (change.type === "set") {
    return path.length === 0
      ? change.value
      : update(path, () => change.value, data);
  } else if (change.type === "update") {
    return update(
      path,
      (old_value) => {
        return { ...old_value, ...change.value };
      },
      data
    );
  } else {
    throw new Error(`Unknown onChange type '${change.type}'`);
  }
};

const exothermic = ({ data: initdata, delay = 0, onChange } = {}) => {
  let data = clean_object(initdata);

  let value_listener = EventEmitter([INTERNAL_VALUE_EVENT, DISCONNECT_EVENT]);

  let root = {
    __get: () => data,
    __onChange: (change /*: T_FirebaseChange*/) => {
      data = clean_object(apply_firebase_change(change, data));
      value_listener.emit(INTERNAL_VALUE_EVENT);

      if (onChange) {
        onChange({ change, data });
      }
    },
    on: value_listener.on,
  };
  let root_ref = firebasechild(root, null, { delay });

  let sidestep_root = {
    __get: () => data,
    __onChange: (change /*: T_FirebaseChange*/) => {
      data = clean_object(apply_firebase_change(change, data));
      value_listener.emit(INTERNAL_VALUE_EVENT);
    },
    on: value_listener.on,
  };
  let sidestep_root_ref = firebasechild(sidestep_root, null, { delay });

  return {
    initializeApp: () => {},
    database: () => {
      return {
        ref: () => root_ref,
      };
    },
    sidestep_database: sidestep_root_ref,

    // This removes all the user event listeners, but does keep
    // all the events between parents and children.
    removeListeners: () => {
      root_ref.removeAllListeners();
    },
  };
};

// const exothermicLocalstorage = (initdata, window, {delay = 0} = {}) => {
//   const getData = () => JSON.parse(window.localStorage.getItem('exothermic'))
//   const setData = data => window.localStorage.setItem('exothermic', JSON.stringify(data))
//   const emitter = EventEmitter(possibleEvents)
//
//   // Initialize
//   setData(initdata)
//   // Listen for storage change
//   window.addEventListener('storage', event => {
//     if (event.key !== 'exothermic') {
//       return
//     }
//     emitter.emit('value') // Not even going to try to emit a snapshot here
//   })
//
//   const root = {
//     ...emitter,
//     __get: getData,
//     update: value => {
//       setData({
//         ...getData(),
//         ...value[rootKey],
//       })
//     },
//   }
//
//   return firebasechild(root, rootKey, {delay})
// }
//
// exothermic.exothermicLocalstorage = exothermicLocalstorage
export default exothermic;
