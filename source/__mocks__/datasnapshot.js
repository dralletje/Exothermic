// Just return what you get, easier debugging :)

export default ({key, value, ref}) => {
  if (!key || !ref) {
    throw new Error('Datasnapshot needs key and ref')
  }
  return {
    key: () => key,
    val: () => value,
    ref: () => ref,
  }
}
