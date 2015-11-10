// A firebase datasnapshot, but then really simple

// @TODO MICHIEL THIS NEEDS TESTS 😠😠😠😠

import firebaseGetData from './firebaseGetData'

const datasnapshot = ({key, value, ref}) => {
  //console.log(key, value, ref)

  // Useful, although just props would have been better
  const valMethod = () => value
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
