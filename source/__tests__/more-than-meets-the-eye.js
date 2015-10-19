'use strict';

jest
  .dontMock('../exothermic')
  .dontMock('../EventEmitter')

const exothermic = require('../exothermic')

const data = {
  users: {
    michiel: {
      name: 'Michiel Dral',
      age: 19,
    },
  },
}

const expectVal = (handler, call = 0) => {
  expect(handler.mock.calls.length).toBeGreaterThan(call)
  return expect(handler.mock.calls[call][0].val())
}

describe('exothermic without delay', () => {
  let firebase

  beforeEach(() => {
    firebase = exothermic(data, {delay: -1})
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

    expectVal(handler, 1).toEqual( {
      name: 'Michiel Dral',
      age: 20,
    })
  })

  it('should call child listener on update', () => {
    const handler = jest.genMockFunction()
    firebase.child('users/michiel/name').on('value', handler)
    firebase.child('users/michiel').update({
      age: 20,
    })
    expectVal(handler, 1).toEqual(20)
  })
})
