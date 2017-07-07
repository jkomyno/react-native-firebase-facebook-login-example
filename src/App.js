import React, { Component } from 'react';
import {
  ActivityIndicator,
  View,
  Button,
  StyleSheet,
} from 'react-native';
import * as firebase from 'firebase';
import FBSDK from 'react-native-fbsdk';

import FacebookButton from './FacebookButton';
import { firebaseConfig } from './firebaseConfig';

const rootUrl = 'https://api.skydreamer.io';

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
  appId: '251686075279620',
  parameters: {
    fields: {
      string: FIELDS,
    },
  },
};

export default class App extends Component {
  state = {
    loaded: false,
    loggedIn: false,
  };

  componentWillMount() {
    firebase.initializeApp(firebaseConfig);
    firebase.auth().onAuthStateChanged(async (user) => {
      console.log('user', user);
      if (user) {
        const currToken = await firebase.auth().currentUser.getIdToken(false);
        const newToken = await this.upSertToken({
          id_firebase: user.uid,
          token: currToken,
        });
        console.log('currToken', currToken);
        console.log('newToken', newToken);
        console.log('currToken === newToken', currToken === newToken);

        await this.startNearestAirportFetch(newToken);

        this.setState({
          loggedIn: true
        })
      } else {
        this.setState({
          loggedIn: false
        })
      }
      this.setState({
        loaded: true,
      });
    })
  }

  /**
   * Dynamically get a concatenated list of urlencoded parameters as an URL
   * @param {Object} params
   * @return {String}
   */
  formatToUrlEncoded = params =>
    Object.keys(params).map(key =>
      `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`,
    ).join('&');

  startNearestAirportFetch = async (token) => {
    const params = {
      latitude: 4.4627124,
      longitude: 9.1076929,
      range: 75,
      limit: 5,
    };
    const response = await fetch(`${rootUrl}/airport/get/nearest`, {
      method: 'POST',
      headers: {
        Authorization: token,
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: this.formatToUrlEncoded(params),
    });
    const json = await response.json();
    let data = null;
    console.log('json@startNearestAirportFetch', json);
    if (json.success) {
      data = json.data.sort((a, b) => (a.distance_km > b.distance_km));
      data = data.map((item) => {
        const {
          id,
          name,
        } = item;
        item.label = `${id} - ${name}`;
        return item;
      });
      console.log('data', data);
    }
  }

  upSertToken = async (params) => {
    console.log('params@upSertToken', params);
    const response = await fetch(`${rootUrl}/auth/upSertToken`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    const json = await response.json();
    console.log('json', json);
    return json.data.token;
  };

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

  logout = () => {
    firebase.auth().signOut();
  }

  render() {
    const {
      loggedIn,
      loaded,
    } = this.state;
    return (
      <View style={styles.container}>
        {
          !loaded ?
            <ActivityIndicator /> : (
            !loggedIn ?
              <FacebookButton onPress={this.login} /> :
              <Button
                title="Log out"
                onPress={this.logout}
              />
            )
        }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
