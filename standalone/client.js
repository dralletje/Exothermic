import { Observable, ReplaySubject } from 'rxjs';
import Exothermic from '../source/exothermic';

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

  return { in$, out$: out$.share() };
};

const createFirebaseClient = (host = `localhost:8080`) => {
  // Create empty local copy
  let localState = Exothermic({});

  let ws = createWebsocket(`ws://${host}/`);

  // Apply changes from the server
  ws.out$
    .filter(e => e.type === 'value')
    .subscribe(e => {
      localState.child(e.path).set(e.value);
    });

  localState.__rawEvents.on('subscribe', e => {
    ws.in$.next({
      type: 'subscribe',
      path: e.path,
    });
  });

  localState.__rawEvents.on('unsubscribe', e => {
    ws.in$.next({
      type: 'unsubscribe',
      path: e.path,
    });
  });

  localState.__rawEvents.on('set', e => {
    ws.in$.next({
      type: 'set',
      path: e.path,
      value: e.value,
    });
  });

  localState.__rawEvents.on('update', e => {
    ws.in$.next({
      type: 'update',
      path: e.path,
      value: e.value,
    });
  });

  return localState;
};

export default createFirebaseClient;
