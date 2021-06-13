import { AppLoading } from 'expo';
import * as Facebook from 'expo-facebook';
import React from 'react';
import { AsyncStorage } from 'react-native';
import { AppearanceProvider, useColorScheme } from 'react-native-appearance';
import { enableScreens } from 'react-native-screens';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { AuthContext } from './contexts/AuthContext';
import ChangePasswordScreen from './screens/ChangePasswordScreen';
import CompleteUserProfileScreen from './screens/CompleteUserProfileScreen';
import { FacebookAppID } from './secrets';
import firebaseWrapper from './wrappers/FirebaseWrapper';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import ReauthenticationScreen from './screens/ReauthenticationScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import SignupScreen from './screens/SignupScreen';
import { UserContext } from './contexts/UserContext';

// The following lines are to deal with an issue in the firebase SDK and can hopefully be
// removed after an update to the firebase SDK. The module base-64 can also be removed
// after that update (error says can't find variable atob)
import {decode, encode} from 'base-64'
if (!global.btoa) {  global.btoa = encode }
if (!global.atob) { global.atob = decode }

// The following lines are to deal with another issue in the firebase SDK and can 
// hopefully be removed after an update to the firebase SDK (error talks about 
// setting a timer for a long period of time)
import { YellowBox } from 'react-native';
import _ from 'lodash';

YellowBox.ignoreWarnings(['Setting a timer']);
const _console = _.clone(console);
console.warn = message => {
  if (message.indexOf('Setting a timer') <= -1) {
    _console.warn(message);
  }
};

export default function App({ navigation }) {

  enableScreens();
  
  const LoginStack = createStackNavigator();
  const scheme = useColorScheme();
  const Stack = createStackNavigator();
  const Tab = createBottomTabNavigator();

  const [state, dispatch] = React.useReducer(
    (prevState, action) => {
      switch (action.type) {
        case 'INTERNAL_ERROR': 
        // Use when the software experiences an error
        // error is generally the firebase error message but sometimes other forms (expo or custom)
        // Implement proper error logging at some point
          console.log(action.error);
          alert('An error occured. We apologize for the inconvenience');
          return {
            ...prevState,
            isLoading: false,
            user: null
          };
        
        case 'RESTORE_CREDENTIALS':
        // Use when restoring userCredentials from storage
          return {
            ...prevState,
            isLoading: false,
            user: action.user
          };
        case 'SIGN_IN':
        // Use while signing the user in
          return {
            ...prevState,
            isSignout: false,
            user: action.user
          };
        case 'SIGN_IN_ERROR':
        // Use when the user supplies bad credentials on sign in
          return {
            ...prevState,
            isLoading: false,
            signInErrorMessage: action.message,
            user: null
          }
        case 'SIGN_OUT':
        // Use while signing the user out
          return {
            ...prevState,
            isSignout: true,
            user: null
          };
        case 'SIGN_UP_ERROR':
        // Use when the user supplies bad credentials on sign up
          return {
            ...prevState,
            isLoading: false,
            signUpErrorMessage: action.message,
            user: null
          }
      }
    },
    {
      errorMessage: null,
      isLoading: true,
      isSignout: false,
      signInErrorMessage: null,
      signUpErrorMessage: null,
      user: null
    }
  );

  React.useEffect(() => {
    // Try to fetch the user's credentials from storage then navigate to the appropriate place
    const bootstrapAsync = async () => {
      try {
        let userCredentials;
        userCredentials = await AsyncStorage.getItem('userCredentials');

        if (userCredentials == null) {
          // Restoring userCredentials failed or userCredentials wasn't present
          dispatch({ type: 'RESTORE_CREDENTIALS', user: null });
          return;
        } else if (userCredentials.facebookLogin !== null) {
          authContext.facebookLogin();
        }

        const internalRedirect = true;
        authContext.signIn(userCredentials.email, userCredentials.password, internalRedirect);
        
      } catch (error) {
        dispatch({ type: 'INTERNAL_ERROR', error: error });
      }
    };

    bootstrapAsync();
  }, []);

  const authContext = React.useMemo(
    () => ({
      facebookLogin: async () => {
        try {
          await Facebook.initializeAsync(FacebookAppID);
          const {
            type,
            token,
            expires,
            permissions,
            declinedPermissions
          } = await Facebook.logInWithReadPermissionsAsync(); //Default permissions are ['public_profile', 'email']
          if (type === 'success') {
            // Facebook login successful
            function firebaseLoginFailure(error) {
              dispatch({ type: 'INTERNAL_ERROR', error:error });
            };

            async function firebaseLoginSuccess() {
              try {
                userCredentials = {
                  facebookLogin: true
                }
                await AsyncStorage.setItem('userCredentials', userCredentials)
                let user = firebaseWrapper.getCurrentUser();
                if (user !== null) {
                  dispatch({ type: 'SIGN_IN', user: user });
                } else {
                  let customError = {
                    code: 'custom/no-user',
                    message: 'No user was detected after login'
                  }
                  dispatch({ type: 'INTERNAL_ERROR', error: customError });
                }
              } catch (error) {
                dispatch({ type: 'INTERNAL_ERROR', error: error });
              }
            }; 

            firebaseWrapper.loginWithFacebook(token, firebaseLoginSuccess, firebaseLoginFailure)
            
          } else {
            // Facebook login failed (type === 'cancel')
            dispatch({ type: 'SIGN_IN_ERROR', message: null });
          }
        } catch (error) {
          dispatch({ type: 'INTERNAL_ERROR', error:error });
        }
      },
      signIn: async (email, password, internalRedirect) => {

        function loginFailure(error) {
          // error is the error object from firebase with the codes representing why the error occured
          // codes can be found here: https://firebase.google.com/docs/reference/js/firebase.auth.Auth#sign-inwith-email-and-password
          // Not currently using any codes so as to not leak any information
          dispatch({ type:'SIGN_IN_ERROR', message: 'Login failed. Please try again' });
        }
        
        async function loginSuccess() {
          // Don't re-set the credentials if using the currently stored credentials (redirected from 'RESTORE_CREDENTIALS')
          if (internalRedirect === true) {
            let user = firebaseWrapper.getCurrentUser();
            if (user !== null) {
              dispatch({ type: 'SIGN_IN', user: user });
            } else {
              let customError = {
                code: 'custom/no-user',
                message: 'No user was detected'
              }
              dispatch({ type: 'INTERNAL_ERROR', error: customError });
            }
          } else {
            userCredentials = {
              email: email,
              password: password
            };
            try {
              await AsyncStorage.setItem('userCredentials', userCredentials);
            } catch (error) {
              dispatch({ type: 'INTERNAL_ERROR', error:error });
            }
          }
        }

        firebaseWrapper.loginWithEmailAndPassword(email, password, loginSuccess, loginFailure);
      },
      signOut: async () => { 
        
        function signOutFailure(error) {
          dispatch({ type: 'INTERNAL_ERROR', error:error });
        }

        function signOutSuccess() {
          dispatch({ type: 'SIGN_OUT' });
        }

        try {
          await AsyncStorage.removeItem('userCredentials'); 
          firebaseWrapper.signOut(signOutSuccess, signOutFailure);
        } catch (error) { 
          // If clearing the credentials fails the user won't be logged out of firebase and since
          // the credentials are still present the user will be automatically logged in on next startup
          dispatch({ type: 'INTERNAL_ERROR', error:error });
        }
      },
      signUp: async (displayName, email, password) => {

        function signUpFailure(error) {
          // error is the error object from firebase with the codes representing why the error occured
          // codes can be found here: https://firebase.google.com/docs/reference/js/firebase.auth.Auth#create-user-with-email-and-password
          console.log(error)
          if (error.code == 'auth/email-already-in-use') {
            dispatch({ type: 'SIGN_UP_ERROR', message: 'An account with that email already exists' });
          } else if (error.code == 'auth/invalid-email') {
            dispatch({ type: 'SIGN_UP_ERROR', message: 'That email is invalid' });
          } else {
            dispatch({ type: 'SIGN_UP_ERROR', error:error });
          }
        }

        async function signUpSuccess() {
          let user = firebaseWrapper.getCurrentUser();
          if (user !== null) {
            try {
              userCredentials = { 
                email: email, 
                password: password 
              };
              await AsyncStorage.setItem('userCredentials', userCredentials);
            } catch (error) { // If this fails the credentials won't be saved and the user will have to sign in manually next time
                              // Need to check the double dispatch behavior I have currently set up
              dispatch({ type: 'INTERNAL_ERROR', error:error });
            } finally {
              dispatch({ type: 'SIGN_IN', user: user });
            }
          } else {
            let customError = {
              code: 'custom/no-user',
              message: 'No user was detected'
            }
            dispatch({ type: 'INTERNAL_ERROR', error: customError });
          }
        }

        firebaseWrapper.signUp(displayName, email, password, signUpSuccess, signUpFailure)
        
      },
    }),
    []
  );

  if (state.isLoading) {
    return <AppLoading />
  }

  function LoginNavigator() {
    return (
      <Tab.Navigator>
        <Tab.Screen name='Login' component={LoginScreen} initialParams={{ errorMessage: state.signInErrorMessage}} />
        <Tab.Screen name='SignUp' component={SignupScreen} initialParams={{ errorMessage: state.signUpErrorMessage}} />
      </Tab.Navigator>
    )
  }

  return (
    <AuthContext.Provider value={authContext}>
      <AppearanceProvider>
        <NavigationContainer theme={scheme === 'dark' ? DarkTheme : DefaultTheme}>
          {state.user == null ? (
            <LoginStack.Navigator initialRouteName='Login'>
              <LoginStack.Screen name='Login' component={LoginNavigator} options={{ headerShown: false }} />
              <LoginStack.Screen name='ResetPassword' component={ResetPasswordScreen} options={{ headerShown: false }} />
            </LoginStack.Navigator>
            ) : (
            <UserContext.Provider value={state.user}>
              <Stack.Navigator initialRouteName='Home'> 
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name='CompleteUserProfile' component={CompleteUserProfileScreen} />
                <Stack.Screen name='ChangePassword' component={ChangePasswordScreen} />
                <Stack.Screen name='Reauthentication' component={ReauthenticationScreen} initialParams={{ redirect: 'Home' }} />
              </Stack.Navigator>
            </UserContext.Provider>
          )}
        </NavigationContainer>
      </AppearanceProvider>
    </AuthContext.Provider>
  );
}