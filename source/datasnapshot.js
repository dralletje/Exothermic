// A firebase datasnapshot, but then really simple

// @TODO MICHIEL THIS NEEDS TESTS 😠😠😠😠

const datasnapshot = ({key, value, ref}) => {
  //console.log(key, value, ref)

  // Useful, although just props would have been better
  const valMethod = () => value
  const keyMethod = () => key
  const refMethod = () => ref.ref()

  // Bullshit
  const exists = () => value !== null

  const child = (path) => {
    const [first_key, ...tail] = Array.isArray(path) ? path : path.split('/')
    const childSnapshot = datasnapshot({
      key: first_key,
      value: value != null && value[first_key] != null ? value[first_key] : null,
      ref: ref.ref().child(first_key),
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
