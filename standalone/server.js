import { Server as WebSocketServer } from 'ws';
import { Observable } from 'rxjs';
import Exothermic, { addSubscriptionsToStore, attachRefNode } from '../source/exothermic';

// Create a cyclejs-ish websocket handler
const createServer = (handler) => {
  const wss = new WebSocketServer({ port: 8080 });

  wss.on('connection', socket => {
    const incoming$ = Observable.create(observer => {
      socket.on('message', message => {
        observer.next(JSON.parse(message));
      });
      socket.on('close', () => {
        observer.complete();
      })
    });
    const outgoing$ = handler(incoming$.share());
    outgoing$.subscribe(message => {
      socket.send(JSON.stringify(message));
    });
  });
};

// Turn a firebase ref into a observable over it's value
const fbValue$ = (ref) => {
  return Observable.create(observer => {
    const subFn = ref.on('value', snap => {
      observer.next(snap.val());
    });
    return () => {
      ref.off('value', subFn);
    };
  });
};

let startFirebaseServer = (data) => {

  // Create an exothermic instance from the data loaded
  let store = Exothermic(data);
  let fb = attachRefNode(store);
  addSubscriptionsToStore(store);

  const hasType = type => {
    return e => e.type === type;
  }
  const hasPath = path => {
    return e => e.path === path;
  }

  createServer(incoming$ => {
    incoming$
      .filter(hasType('mutate'))
      .subscribe(e => {
        store.dispatch(e);
      });

    return incoming$
      .filter(hasType('subscription:added'))
      .flatMap(e => {
        let path = e.paths[0].slice(1);
        const unsubscribeEvent = incoming$.filter(hasType('subscription:remove')).filter(hasPath(path));
        return fbValue$(fb.child(path))
          .takeUntil(unsubscribeEvent)
          .map(value => {
            return {
              type: 'mutate',
              path: path,
              mutations: [{ type: 'set', path: '', value: value }],
            };
          });
      })
      .takeUntil(incoming$.startWith('').last());
  })

  console.log('Started server at port 8080.');

  // Listen to the root, and write updates to disk
  return Observable.from(store)
  .map(() => store.getState())
};

if (!module.parent) {
  // Load data in, now for testing it's just harcoded
  const data = {
    message: 'Hi',
  };

  startFirebaseServer(data)
  // Add a throttle?
  .subscribe(x => {
    if (x.lastEvent.type === 'mutate') {
      console.log('Writing to disk', x.data);
    }
  })
}

export default startFirebaseServer;
