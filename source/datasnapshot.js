// A firebase datasnapshot, but then really simple

// @TODO MICHIEL THIS NEEDS TESTS 😠😠😠😠

import firebaseGetData from './firebaseGetData'

const datasnapshot = ({key, value, ref}) => {
  //console.log(key, value, ref)

  const clean = object => {
    if (!object || typeof object !== 'object') {
      return object
    }

    // Split the object in an array
    let cleaned =
      Object.keys(object)
      .map(k => [k, object[k]])
      // My actual mutations I am interested in
      .map(([k,v]) => [k, clean(v)])
      .filter(([k, v]) => v !== null)
      // Bring it back to an object
      .reduce((o, [k, v]) => {
        o[k] = v
        return o
      }, {})

    // Object is empty after cleaning it's children... to bad
    if (Object.keys(cleaned).length === 0) {
      return null
    } else {
      return cleaned
    }
  }

  const cleanValue = clean(value)

  // Useful, although just props would have been better
  const valMethod = () => cleanValue
  const keyMethod = () => key
  const refMethod = () => ref

  // Bullshit
  const exists = () => value !== null

  const child = path => {
    const [first, ...tail] = Array.isArray(path) ? path : path.split('/')
    const childSnapshot = datasnapshot({
      key: first,
      value: firebaseGetData(value, first),
      ref: ref.child(first),
    })
    return tail.length === 0 ? childSnapshot : childSnapshot.child(tail)
  }

  const forEach = fn => {
    if (!value || typeof value !== 'object') {
      return
    }
    // Some, so it stops iterating on `true`
    Object.keys(value).some(index => {
      return fn(child(index))
    })
  }

  const hasChild = path => child(path).val() !== null

  const numChildren = () =>
    value !== null
    ? Object.keys(value).length
    : 0

  const hasChildren = () =>
    numChildren() !== 0

  const getPriority = () => {
    throw new Error('Exothermic hasn\'t implemented priority yet!')
  }

  return {
    val: valMethod,
    key: keyMethod,
    ref: refMethod,
    exportVal: valMethod,
    name: keyMethod,
    child, forEach, hasChild,
    hasChildren, numChildren,
    getPriority, exists,
  }
}

export default datasnapshot
