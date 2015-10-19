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
