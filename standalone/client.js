import { Observable, ReplaySubject } from 'rxjs';
import Exothermic, { addSubscriptionsToStore, attachRefNode } from '../source/exothermic';

const createWebsocket = (url) => {
  let in$ = new ReplaySubject();
  let out$ = Observable.create(observer => {
    let ws = new WebSocket(url);

    ws.addEventListener('open', () => {
      in$.subscribe(message => {
        ws.send(JSON.stringify(message));
      });
    });

    ws.addEventListener('message', e => {
      observer.next(JSON.parse(e.data));
    });
    return () => ws.close();
  });

  return { toServer$: in$, fromServer$: out$.share() };
};

const createFirebaseClient = (host = `localhost:8080`) => {
  let ws = createWebsocket(`ws://${host}/`);

  // Create empty local copy
  let store = Exothermic({});

  addSubscriptionsToStore(store, event => {
    if (event.paths[0] === '') {
      return;
    }

    // When a path is watched, tell that to the websocket
    if (event.type === 'subscription:added') {
      ws.toServer$.next(event);
    }
    if (event.type === 'subscription:removed') {
      ws.toServer$.next(event);
    }
  })

  store.subscribe(() => {
    let { data, lastEvent } = store.getState();

    if (!lastEvent.fromServer && lastEvent.type === 'mutate') {
      ws.toServer$.next(lastEvent);
    }
  });

  // mutations are the only things the server can
  // send to the client
  ws.fromServer$
    .filter(e => e.type === 'mutate')
    .subscribe(e => {
      store.dispatch({
        ...e,
        fromServer: true,
      });
    });

  let refNode = attachRefNode(store);

  return refNode;
};

export default createFirebaseClient;
