'use strict';

jest
  .dontMock('../exothermic')
  .dontMock('../EventEmitter')
  .dontMock('../pushId')
  .dontMock('../firebasechild')
  .setMock('../datasnapshot', ({value, key, ref}) => {
    if (!key || !ref) {
      throw new Error('Datasnapshot needs key and ref')
    }
    return { key, value }
  })
  .dontMock('../firebaseGetData')

const data = {
  users: {
    michiel: {
      name: 'Michiel Dral',
      age: 19,
    },
  },
  empty: {},
}

const expectVal = (handler, call = 0) => {
  expect(handler.mock.calls.length).toBeGreaterThan(call)
  return expect(handler.mock.calls[call][0].value)
}

export default createFirebase => {
  describe('exothermic without delay', () => {
    let firebase

    beforeEach(() => {
      firebase = createFirebase(data)
    })

    it('should call the event handler', () => {
      const handler = jest.genMockFunction()
      firebase.on('value', handler)
      expect(handler).toBeCalled()
    })

    it('should just get me the whole root', () => {
      const handler = jest.genMockFunction()
      firebase.on('value', handler)
      expectVal(handler).toEqual(data)
    })

    it('should support a propertie', () => {
      const handler = jest.genMockFunction()
      firebase.child('users').on('value', handler)
      expectVal(handler).toEqual(data.users)
    })

    it('should support a path of properties', () => {
      const handler = jest.genMockFunction()
      firebase.child('users/michiel/name').on('value', handler)
      expectVal(handler).toBe('Michiel Dral')

      const handler2 = jest.genMockFunction()
      firebase.child('users/michiel/age').on('value', handler2)
      expectVal(handler2).toBe(19)
    })


    it('should call the handler with new value when set', () => {
      const handler = jest.genMockFunction()
      firebase.child('users/michiel/name').on('value', handler)
      firebase.child('users').child('michiel/name').set('Da Rude')

      expectVal(handler, 1).toBe('Da Rude')
    })

    it('should call parent listener when child value is set', () => {
      const handler = jest.genMockFunction()
      firebase.child('users/michiel').on('value', handler)
      firebase.child('users/michiel/name').set('Da Rude')

      expectVal(handler, 1).toEqual( {
        name: 'Da Rude',
        age: 19,
      })
    })

    it('should update value shallowly', () => {
      const handler = jest.genMockFunction()
      firebase.child('users/michiel').on('value', handler)
      firebase.child('users/michiel').update({
        age: 20,
      })

      expectVal(handler, 1).toEqual({
        name: 'Michiel Dral',
        age: 20,
      })
    })

    it('should call child listener on update', () => {
      const handler = jest.genMockFunction()
      firebase.child('users/michiel/age').on('value', handler)
      firebase.child('users/michiel').update({
        age: 20,
      })
      expectVal(handler, 1).toEqual(20)
    })

    it('should mkdir -p like when setting deep on nonexisting', () => {
      const handler = jest.genMockFunction()
      firebase.child('users/jake').on('value', handler)
      firebase.child('users/jake/name').set('jake')
      expectVal(handler, 1).toEqual({name: 'jake'})
    })

    it('should return null when asking for non-existing key', () => {
      const handler = jest.genMockFunction()
      firebase.child('this/key/does/not/exist').on('value', handler)
      expectVal(handler).toEqual(null)
    })

    it('should return null when asking for an empty object', () => {
      const handler = jest.genMockFunction()
      firebase.child('empty').on('value', handler)
      expectVal(handler).toEqual(null)
    })

    it('should create unique id\'s', () => {
      const empty = firebase.child('empty')
      empty.push('1')
      empty.push('2')
      empty.push('3')

      const handler = jest.genMockFunction()
      empty.on('value', handler)
      expect(Object.keys(handler.mock.calls[0][0].value).length).toBe(3)
    })

    it('should return the snapshot on push', () => {
      const uid = firebase.child('empty').push('randomish value here').key
      const handler = jest.genMockFunction()
      firebase.child(`empty/${uid}`).on('value', handler)
      expectVal(handler).toEqual('randomish value here')
    })

    it('should remove a item', () => {
      const handler = jest.genMockFunction()
      firebase.child('users/michiel').on('value', handler)
      firebase.child(`users/michiel`).remove()
      expectVal(handler, 1).toEqual(null)
    })

    it('should remove a item and notify it\'s child', () => {
      const handler = jest.genMockFunction()
      firebase.child('users/michiel/age').on('value', handler)
      firebase.child(`users/michiel`).remove()
      expectVal(handler, 1).toEqual(null)
    })
  })
}
