import { ReplaySubject, Observable } from 'rxjs';

const createWebsocket = (url) => {
  let in$ = new ReplaySubject();
  let out$ = Observable.create(observer => {
    let ws = new window.WebSocket(url);

    ws.addEventListener('open', () => {
      in$.subscribe(message => {
        ws.send(message);
      });
    });

    ws.addEventListener('message', e => {
      observer.next(e.data);
    });
    return () => ws.close();
  });

  return { in$, out$ };
};

export default createWebsocket;
