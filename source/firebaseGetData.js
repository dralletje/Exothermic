export default (object, prop) => {
  // If the object is not an object, null
  const val =
    typeof object === 'object' && object !== null
    ? object[prop]
    : null

  // If it is null, undefined or an **empty** object, null again D:
  return (
    val === undefined ||
    val === null ||
    (typeof val === 'object' && Object.keys(val).length === 0)
    ? null
    : val
  )
}
