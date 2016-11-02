import React from 'react';
import createFirebaseClient from './standalone/client';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: 'test',
    }
    this.firebase = createFirebaseClient();
  }

  componentDidMount() {
    let fn = this.firebase.child('message').on('value', snapshot => {
      this.setState({ data: snapshot.val() });
    })
    this.unsubscribe = () => this.firebase.child('message').off('value', fn);
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  render() {
    let change = (e) => {
      let value = e.target.value;
      this.firebase.child('message').set(value);
    }
    console.log('this.state.data:', this.state.data);
    return <input type="text" value={this.state.data} onChange={change} />
  }
};
