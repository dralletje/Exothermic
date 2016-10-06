import { Server as WebSocketServer } from 'ws';
import { Observable } from 'rxjs';
import Exothermic from '../source/exothermic';

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
    console.log('Subscribing')
    const subFn = ref.on('value', snap => {
      observer.next(snap.val());
    });
    return () => {
      console.log('Unsubscribing')
      ref.off('value', subFn);
    };
  });
};

// Load data in, now for testing it's just harcoded
const data = {
  games: {
    lol: 1,
  },
};

// Create an exothermic instance from the data loaded
let fb = Exothermic(data);

// Listen to the root, and write updates to disk
fb.on('value', snapshot => {
  // snapshot.val();
  console.log('Writing to disk');
})

const hasType = type => {
  return e => e.type === type;
}
const hasPath = path => {
  return e => e.path === path;
}

createServer(incoming$ => {
  incoming$
    .filter(hasType('set'))
    .subscribe(e => {
      fb.child(e.path).set(e.value);
    });

  incoming$
    .filter(hasType('update'))
    .subscribe(e => {
      fb.child(e.path).update(e.value);
    });

  return incoming$
    .filter(hasType('subscribe'))
    .flatMap(e => {
      const unsubscribeEvent = incoming$.filter(hasType('unsubscribe')).filter(hasPath(e.path));
      return fbValue$(fb.child(e.path))
        .takeUntil(unsubscribeEvent)
        .map(value => {
          return {
            type: 'value',
            path: e.path,
            value: value,
          };
        });
    })
    .takeUntil(incoming$.last());
})

console.log('Started server at port 8080.');
