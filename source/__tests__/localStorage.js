// jest
//   .dontMock('../exothermic')
//   .dontMock('../EventEmitter')
//   .dontMock('../pushId')
//   .dontMock('./_tests')
//
// const tests = require('./_tests').default
// const exothermic = require('../exothermic').default.exothermicLocalstorage
//
// const windowMock = (() => {
//   let data = {}
//   let listener = null
//
//   const exothermicKey = key => {
//     if (key !== 'exothermic') {
//       throw new Error('This mock is only for exothermic, haha')
//     } else {
//       return true
//     }
//   }
//
//   return {
//     localStorage: {
//       setItem: (key, value) => {
//         exothermicKey(key)
//         data[key] = value
//       },
//       getItem: key => exothermicKey(key) && data[key],
//     },
//     addEventListener: (event, newListener) => {
//       if (event !== 'storage') {
//         throw new Error(`Hmm, something different than a storage event? (${event})`)
//       }
//       listener = newListener
//     },
//     __updateStorage: newData => {
//       data.exothermic = JSON.stringify(newData)
//       listener({ key: 'exothermic' })
//     },
//   }
// })()
//
// const createFirebase = data => {
//   return exothermic({
//     data: data,
//     windowMock: windowMock,
//     delay: -1,
//   });
// };
//
// // Standard tests
// tests(createFirebase)
//
// // Localstorage specific tests
// const data = {
//   numbers: {
//     hundred: 100,
//   },
// }
//
// const expectVal = (handler, call = 0) => {
//   expect(handler.mock.calls.length).toBeGreaterThan(call)
//   return expect(handler.mock.calls[call][0].val())
// }
//
// describe('Localstorage', () => {
//   it('should update the data after a storage event', () => {
//     const handler = jest.genMockFunction()
//     let firebase = createFirebase(data).database().ref();
//     firebase.child('numbers/hundred').on('value', handler)
//     windowMock.__updateStorage({
//       numbers: {
//         hundred: 200,
//       },
//     })
//
//     expectVal(handler, 1).toEqual(200)
//   })
// })

it.skip(`Filler because I don't want to lose this code I think`, () => {});
