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
Not yet the whole API is mocked 😔
Here is a list of the api and what is/isn't supported yet!

**Firebase (Methods)**
- [x] new Firebase()
- [ ] auth()
- [ ] authWithCustomToken()
- [ ] authAnonymously()
- [ ] authWithPassword()
- [ ] authWithOAuthPopup()
- [ ] authWithOAuthRedirect()
- [ ] authWithOAuthToken()
- [ ] getAuth()
- [ ] onAuth()
- [ ] offAuth()
- [ ] unauth()
- [x] child()
- [ ] parent()
- [ ] root()
- [ ] key()
- [ ] name()
- [ ] toString()
- [x] set()
- [x] update()
- [x] remove()
- [x] push()
- [ ] setWithPriority()
- [ ] setPriority()
- [ ] transaction()
- [ ] createUser()
- [ ] changeEmail()
- [ ] changePassword()
- [ ] removeUser()
- [ ] resetPassword()
- [ ] goOnline()
- [ ] goOffline()

**Query (Methods)**
- [x] on()
- [x] off()
- [ ] once()
- [ ] orderByChild()
- [ ] orderByKey()
- [ ] orderByValue()
- [ ] orderByPriority()
- [ ] startAt()
- [ ] endAt()
- [ ] equalTo()
- [ ] limitToFirst()
- [ ] limitToLast()
- [ ] limit()
- [ ] ref()

**Firebase.onDisconnect() (Methods)**
- [ ] set()
- [ ] update()
- [ ] remove()
- [ ] setWithPriority()
- [ ] cancel()

**Firebase.ServerValue (Constants)**
- [ ] TIMESTAMP

**DataSnapshot (Methods)**
- [ ] exists()
- [x] val()
- [ ] child()
- [ ] forEach()
- [ ] hasChild()
- [ ] hasChildren()
- [x] key()
- [ ] name()
- [ ] numChildren()
- [ ] ref()
- [ ] getPriority()
- [ ] exportVal()
