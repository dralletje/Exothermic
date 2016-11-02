import exothermic, { attachRefNode, addSubscriptionsToStore } from '../exothermic';

describe('external subscription', () => {
  let firebase
  let subscriptionAdding

  beforeEach(() => {
    let data = {
      users: {
        michiel: {
          name: 'Michiel Dral',
          age: 19,
        },
      },
      empty: {},
    };
    subscriptionAdding = jest.genMockFunction()
    let store = exothermic(data);
    addSubscriptionsToStore(store, subscriptionAdding);
    firebase = attachRefNode(store);
  })

  it('should fire a subscription added', () => {
    firebase.child('users').on('value', () => {})
    expect(subscriptionAdding).toBeCalledWith({
      type: 'subscription:added',
      paths: ['/users'],
    })
  })

  it('should fire a subscription removed', () => {
    let fn = firebase.child('users').on('value', () => {});
    expect(subscriptionAdding).toBeCalledWith({
      type: 'subscription:added',
      paths: ['/users'],
    });
    firebase.child('users').off('value', fn);
    expect(subscriptionAdding).lastCalledWith({
      type: 'subscription:removed',
      paths: ['/users'],
    });
  });

  it('should not fire a subscription when twice for one path', () => {
    let fn1 = firebase.child('users').on('value', () => {});
    let fn2 = firebase.child('users').on('value', () => {});
    expect(subscriptionAdding.mock.calls.length).toEqual(1);
    firebase.child('users').off('value', fn1);
    firebase.child('users').off('value', fn2);
    expect(subscriptionAdding.mock.calls.length).toEqual(2);
    expect(subscriptionAdding).lastCalledWith({
      type: 'subscription:removed',
      paths: ['/users'],
    });
  });

  it('should fire two subscriptions added and removed for different paths', () => {
    let fn1 = firebase.child('users').on('value', () => {});
    let fn2 = firebase.child('places').on('value', () => {});
    expect(subscriptionAdding.mock.calls.length).toEqual(2);
    firebase.child('users').off('value', fn1);
    firebase.child('places').off('value', fn2);
    expect(subscriptionAdding.mock.calls.length).toEqual(4);
    expect(subscriptionAdding).lastCalledWith({
      type: 'subscription:removed',
      paths: ['/places'],
    });
  });
})
