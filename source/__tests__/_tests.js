'use strict';

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
  return expect(handler.mock.calls[call][0].val())
}

export default createFirebase => {
  describe('exothermic without delay', () => {
    let firebase

    beforeEach(() => {
      firebase = createFirebase(data)
    })

    it('should have a root key of null', () => {
      let firebase = createFirebase(data);
      expect(firebase.key()).toBe(null);
    });
    it('should have a root parent of null', () => {
      let firebase = createFirebase(data);
      expect(firebase.parent()).toBe(null);
    });

    it('should have a working key()', () => {
      let firebase = createFirebase(data);
      expect(firebase.child('this').child('is').child('path').key()).toBe('path');
      expect(firebase.child('other/path/with').key()).toBe('with');
    });
    it('should have a working parent()', () => {
      let firebase = createFirebase(data);
      expect(firebase.child('this').child('is').child('path').parent().key()).toBe('is');
      expect(firebase.child('other/path/with').parent().key()).toBe('path');    });

    it('should call the event handler', () => {
      const handler = jest.genMockFunction()
      firebase.on('value', handler)
      expect(handler).toBeCalled()
    })

    it('should just get me the whole root', () => {
      const handler = jest.genMockFunction()
      firebase.on('value', handler)
      expectVal(handler).toEqual({
        users: {
          michiel: {
            name: 'Michiel Dral',
            age: 19,
          },
        },
      })
    })

    it('should support a propertie', () => {
      const handler = jest.genMockFunction()
      firebase.child(`users`).on('value', handler)
      expectVal(handler).toEqual(data.users)
    })

    it('should support a path of properties', () => {
      const handler = jest.genMockFunction()
      firebase.child(`users/michiel/name`).on('value', handler)
      expectVal(handler).toBe('Michiel Dral')

      const handler2 = jest.genMockFunction()
      firebase.child(`users/michiel/age`).on('value', handler2)
      expectVal(handler2).toBe(19)
    })

    it('should call the handler with new value when set', () => {
      const handler = jest.genMockFunction()
      firebase.child(`users/michiel/name`).on('value', handler)
      firebase.child(`users`).child('michiel/name').set('Da Rude')
      expectVal(handler, 1).toBe('Da Rude')
    })

    it('should call parent listener when child value is set', () => {
      const handler = jest.genMockFunction()
      firebase.child(`users/michiel`).on('value', handler)
      firebase.child(`users/michiel/name`).set('Da Rude')

      expectVal(handler, 1).toEqual( {
        name: 'Da Rude',
        age: 19,
      })
    })

    it('should update value shallowly', () => {
      const handler = jest.genMockFunction()
      firebase.child(`users/michiel`).on('value', handler)
      firebase.child(`users/michiel`).update({
        age: 20,
      })

      expectVal(handler, 1).toEqual({
        name: 'Michiel Dral',
        age: 20,
      })
    })

    it('should call child listener on update', () => {
      const handler = jest.genMockFunction()
      firebase.child(`users/michiel/age`).on('value', handler)
      firebase.child(`users/michiel`).update({
        age: 20,
      })
      expectVal(handler, 1).toEqual(20)
    })

    it('should mkdir -p like when setting deep on nonexisting', () => {
      const handler = jest.genMockFunction()
      firebase.child(`users/jake`).on('value', handler)
      firebase.child(`users/jake/name`).set('jake')
      expectVal(handler, 1).toEqual({name: 'jake'})
    })

    it('should return null when asking for non-existing key', () => {
      const handler = jest.genMockFunction()
      firebase.child(`this/key/does/not/exist`).on('value', handler)
      expectVal(handler).toEqual(null)
    })

    it('should return null when asking for an empty object', () => {
      const handler = jest.genMockFunction()
      firebase.child(`empty`).on('value', handler)
      expectVal(handler).toEqual(null)
    })

    it('should create unique id\'s', () => {
      let firebase = createFirebase({ empty: {} });
      let empty = firebase.child('empty');
      empty.push('1');
      empty.push('2');
      empty.push('3');

      const handler = jest.genMockFunction()
      empty.on('value', handler);
      expect(Object.keys(handler.mock.calls[0][0].val()).length).toBe(3);
    })

    it('should return the snapshot on push', () => {
      const uid = firebase.child(`empty`).push('randomish value here').key()
      const handler = jest.genMockFunction()
      firebase.child(`empty/${uid}`).on('value', handler)
      expectVal(handler).toEqual('randomish value here')
    })

    it('should remove a item', () => {
      const handler = jest.genMockFunction()
      firebase.child(`users/michiel`).on('value', handler)
      firebase.child(`users/michiel`).remove()
      expectVal(handler, 1).toEqual(null)
    })

    it('should remove a item and notify it\'s child', () => {
      const handler = jest.genMockFunction()
      firebase.child(`users/michiel/age`).on('value', handler)
      firebase.child(`users/michiel`).remove()
      expectVal(handler, 1).toEqual(null)
    })

    it('should remove a child and no longer show it in the parent', () => {
      const handler = jest.genMockFunction()
      firebase.child(`users/michiel`).on('value', handler)
      firebase.child(`users/michiel/age`).remove()
      expectVal(handler, 1).toEqual({name: 'Michiel Dral'})
    })

    it('should insert a object representing nested emptyness and show null', () => {
      const handler = jest.genMockFunction()
      firebase.child(`more_empty`).on('value', handler)
      firebase.child(`more_empty`).set({
        null: null,
        empty: {},
      })
      expectVal(handler, 1).toEqual(null)
    })

    it('should handle ultimate nested emptyness', () => {
      const handler = jest.genMockFunction()
      firebase.child(`more_empty`).on('value', handler)
      firebase.child(`more_empty`).set({
        null: null,
        empty: {
          null: null,
          empty: {},
        },
      })
      expectVal(handler, 1).toEqual(null)
    });

    it('should work with .orderByChild and .equalTo', () => {
      const handler = jest.genMockFunction();
      let fb = createFirebase({
        users: { a: { name: 'Michiel', age: 21 }, b: { name: 'Arne', age: 21 }, c: { name: 'Danique', age: 19 } },
      })
      fb.child(`users`).orderByChild('age').equalTo(21).on('value', handler)
      expectVal(handler).toEqual({
        a: { name: 'Michiel', age: 21 },
        b: { name: 'Arne', age: 21 },
      })
    })

    it('should work with .orderByValue and .equalTo', () => {
      const handler = jest.genMockFunction();
      let fb = createFirebase({
        users: { Michiel: 21, Arne: 21, Danique: 19 },
      })
      fb.child(`users`).orderByValue().equalTo(21).on('value', handler)
      expectVal(handler).toEqual({ Michiel: 21, Arne: 21 });
    })

    it('should work with .orderByKey and .limitToFirst(1)', () => {
      let handler = jest.genMockFunction();
      let fb = createFirebase({
        users: {  '20': 'Michiel', '10': 'Tim', '30': 'Arne' },
      })
      fb.child(`users`).orderByKey().limitToFirst(1).on('value', handler)
      expectVal(handler).toEqual({ '10': 'Tim' });
    })

    it('should work with .orderByKey and .limitToLast(1)', () => {
      let handler = jest.genMockFunction();
      let fb = createFirebase({
        users: {  '20': 'Michiel', '10': 'Tim', '30': 'Arne' },
      })
      fb.child(`users`).orderByKey().limitToLast(1).on('value', handler)
      expectVal(handler).toEqual({ '30': 'Arne' });
    })

    it('should work with .orderByValue and .limitToFirst(1)', () => {
      let fb = createFirebase({
        users: {  Tim: 10, Arne: 30, Michiel: 20 },
      })

      // Make sure the .orderByValue actually has effect,
      // and was not just already how it was ordered
      let handler = jest.genMockFunction();
      fb.child(`users`).limitToLast(1).on('value', handler)
      expectVal(handler).not.toEqual({ Arne: 30 });

      let handler2 = jest.genMockFunction();
      fb.child(`users`).orderByValue().limitToLast(1).on('value', handler2)
      expectVal(handler2).toEqual({ Arne: 30 });
    })

    it('should work with .orderByValue, .startAt and .endAt combined', () => {
      let fb = createFirebase({
        users: {  Tim: 10, Arne: 30, Michiel: 20 },
      })

      let handler = jest.genMockFunction();
      fb.child(`users`).orderByValue().startAt(20).endAt(30).on('value', handler)
      expectVal(handler).toEqual({ Michiel: 20, Arne: 30 });

      let handler2 = jest.genMockFunction();
      fb.child(`users`).orderByValue().startAt(10).endAt(20).on('value', handler2)
      expectVal(handler2).toEqual({ Michiel: 20, Tim: 10 });
    })

    it('should work with .orderByValue, .startAt and .endAt combined', async () => {
      let fb = createFirebase({
        online_users: {},
      });

      fb.child('online_users/Michiel').set(true);
      fb.child('online_users/Michiel').onDisconnect().set(null);

      expect((await fb.child('online_users').once('value')).val()).toEqual({ Michiel: true });

      fb.simulate_disconnect();

      expect((await fb.child('online_users').once('value')).val()).toEqual({ });
    })

    it('should work with .on("child_removed")', () => {
      const handler = jest.genMockFunction();
      let fb = createFirebase({
        users: { a: { name: 'Michiel', age: 21 }, b: { name: 'Arne', age: 21 }, c: { name: 'Danique', age: 19 } },
      })
      fb.child(`users`).on('child_removed', handler)
      fb.child('users').child('a').remove();
      expectVal(handler).toEqual({ name: 'Michiel', age: 21 });
    })

    it('should work with .on("child_added")', () => {
      const handler = jest.genMockFunction();
      let fb = createFirebase({
        users: { a: { name: 'Michiel', age: 21 }, b: { name: 'Arne', age: 21 }, c: { name: 'Danique', age: 19 } },
      })
      fb.child(`users`).on('child_added', handler)
      expectVal(handler).toEqual({ name: 'Michiel', age: 21 });
      expectVal(handler, 1).toEqual({ name: 'Arne', age: 21 });
      expectVal(handler, 2).toEqual({ name: 'Danique', age: 19 });
    })

    it('should work return an array if it is obviously an array', () => {
      const handler = jest.genMockFunction();
      let fb = createFirebase({
        first_primes: [2, 3, 5, 7, 11],
      })
      fb.child(`first_primes`).on('value', handler)
      expectVal(handler).toEqual([2, 3, 5, 7, 11]);
    })
  })
}
