# Exothermic

Simulate the firebase javascript sdk in memory, for testing or local development.

```
$ npm install exothermic --save-dev
```

### Initialize exothermic

Exothermic takes some options, that you provide to exothermic only once

```
let exothermic = require('exothermic');

let firebase = exothermic({
  // Initial data, can also be set using `firebase.database().ref().set(...)`
  data: {},
  // Set delay to anything above 0 to make every event listener async using `setTimeout(..., delay)`:
  // This could be useful to simulate a more realistic connection
  delay: -1,
  // This gets called on every change that is being applied to the database,
  // useful to track these while testing.
  // `type change = { path: Array<String>, type: "set" | "update", value: mixed }`
  onChange: ({ change }) => {},
});
```

then export or use this as a mock in the rest of your code,
where you like always will do

```
firebase.initializeApp({
  // ... All these options are ignored anyway
})
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
- [ ] ~~TIMESTAMP~~ **Could make this work but would just be `Date.now() - delay`

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
