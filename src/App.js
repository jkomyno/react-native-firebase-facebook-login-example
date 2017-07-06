import React, { Component } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import * as firebase from 'firebase';
import FBSDK from 'react-native-fbsdk';

import FacebookButton from './FacebookButton';
import firebaseConfig from './firebaseConfig';

const {
  LoginManager,
  AccessToken,
  GraphRequest,
  GraphRequestManager,
} = FBSDK;
const FACEBOOK_PERMISSIONS = ['public_profile', 'email', 'user_location'];
const FIELDS = 'name,gender,locale,location,email';
const GRAPH_REQUEST_PARAMS = {
  httpMethod: 'GET',
  version: 'v2.8',
  // appId: '251686075279620',
  appId: '24b433ce76791790109fca83faa35abe',
  parameters: {
    fields: {
      string: FIELDS,
    },
  },
};

firebase.initializeApp(firebaseConfig);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default class App extends Component {
  state = {  }

  authenticate = (token) => {
    const provider = firebase.auth.FacebookAuthProvider;
    const credential = provider.credential(token);
    return firebase.auth().signInWithCredential(credential);
  }

  login = async () => {
    const { isCancelled } = await LoginManager.logInWithReadPermissions(FACEBOOK_PERMISSIONS);
    if (!isCancelled) {
      const {
        userID: facebookUserID,
        accessToken,
      } = await AccessToken.getCurrentAccessToken();
      this.authenticate(accessToken)
        .then(result => {
          console.log('successfully added on Firebase', result);
        })
        .catch(err => {
          // Error: Your API key is invalid, please check you have copied it correctly
          console.warn('couldn\'t add on Firebase', err);
        });

    } else {
      console.log('fb login dismissed');
    }


    /*
    if (type === 'success') {
      const response = await fetch(`https://graph.facebook.com/me?access_token=${token}`)
      console.log(await response.json())
      this.authenticate(token)
    }
    */
  }

  render() {
    return (
      <View style={styles.container}>
        <FacebookButton onPress={this.login}/>
      </View>
    );
  }
}