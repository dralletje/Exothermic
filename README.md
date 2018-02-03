# Exothermic

A small library to create firebase server for local development and testing.

```
$ npm install exothermic
```

**old**
```
import Firebase from 'firebase'

const FIREBASE_URL = '...'
let firebase = new Firebase(FIREBASE_URL)
```

**new**
```
import exothermic from 'exothermic'

const initialdata = {
  ...
}
let firebase = exothermic(initialdata)
```


### TODO

[ ] Make objects with number-as-keys result in arrays

Not yet the whole API is mocked 😔
Here is a list of the api and what is/isn't supported yet!

**Reference (Methods)**
- [x] child()
- [x] parent()
- [x] root()
- [x] key()
- [x] set()
- [x] update()
- [x] remove()
- [x] push()
- [ ] ~~setWithPriority()~~ **Really, screw priority**
- [ ] ~~setPriority() **Really, screw priority**
- [ ] transaction()

**Query (Methods)**
- [x] on()
- [x] off()
- [x] once()
- [x] orderByChild()
- [ ] ~~orderByKey()~~ **As I am not really interested in ordering (just querying with equalTo) I don't think I'll add this**
- [x] orderByValue()
- [ ] ~~orderByPriority()~~ **Really, screw priority**
- [ ] startAt()
- [ ] endAt()
- [x] equalTo()
- [ ] limitToFirst()
- [ ] limitToLast()
- [ ] limit()
- [x] ref()

**Firebase.onDisconnect() (Methods)**
- [ ] set()
- [ ] update()
- [ ] remove()
- [ ] setWithPriority()
- [ ] cancel()

**Firebase.ServerValue (Constants)**
- [ ] TIMESTAMP

**DataSnapshot (Methods)**
- [x] exists()
- [x] val()
- [x] child()
- [x] forEach()
- [x] hasChild()
- [x] hasChildren()
- [x] key()
- [x] name()
- [x] numChildren()
- [x] ref()
- [ ] ~~getPriority()~~ **Not sure if I am gonna implement this**
- [x] exportVal()
