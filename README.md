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

Not yet the whole API is mocked, because I think there are some parts that I don't need. All the other parts are mocked and should be working: let me know if there is a bug!

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
- [x] orderByKey()
- [x] orderByValue()
- [ ] ~~orderByPriority()~~ **Really, screw priority**
- [x] startAt()
- [x] endAt()
- [x] equalTo()
- [x] limitToFirst()
- [x] limitToLast()
- [x] ref()

**Firebase.onDisconnect() (Methods)**
- [x] set()
- [x] update()
- [x] remove()
- [ ] ~~setWithPriority()~~
- [ ] ~~cancel()~~ **Don't think this is necessary**

**Firebase.ServerValue (Constants)**
- [ ] ~~TIMESTAMP~~

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
