import * as Facebook from 'expo-facebook';
import React, { useReducer } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '@react-navigation/native';

import createMasterStyles from './masterStyleSheet';
import { FacebookAppID } from '../secrets';
import firebaseWrapper from '../wrappers/FirebaseWrapper';
import ThemedBackground from '../components/ThemedBackground';
import { UserContext } from '../contexts/UserContext';

export default function ReauthenticationScreen({ route, navigation }) {
    // Route params should include a redirect screen name, otherwise the 
    // user will be taken to the home screen instead of the screen they 
    // were attempting to access that required reauthentication

    const [buttonDisabled, setButtonDisabled] = React.useState(true)
    const { colors } = useTheme();
    const [email, setEmail] = React.useState('');
    const [errorMessage, setErrorMessage] = React.useState('');
    const masterStyles = createMasterStyles(colors);
    const [password, setPassword] = React.useState('');
    const { redirect } = route.params;
    const { user } = React.useContext(UserContext);

    React.useEffect(() => {
        if (password.length >=6) {
            const re = /\S+@\S+\.\S+/;
            if (re.test(email)) {
                setButtonDisabled(false)
                return;
            }
        }
        setButtonDisabled(true)
    })

    async function facebookLogin() {
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
            facebookLoginFailure = (error) => { // Proper error logging at some point
                setErrorMessage('An error occurred. Please try again')
            };

            facebookLoginSuccess = async () => {
                navigation.navigate(redirect)
            }; 

            firebaseWrapper.reauthenticateWithFacebook(token, facebookLoginSuccess, facebookLoginFailure)
            
            } else {
            // Facebook login failed (type === 'cancel')
            // The user cancelled Facebook login so just re-render the normal screen
            }
        } catch (error) { // Proper error logging at some point
            setErrorMessage('An error occurred. Please try again')
        }
    }

    function reauthenticate(email, password) {

        if (user.email === email) {
            function reauthenticationFailure() {
                setErrorMessage('Login failed. Please try again');
            }
    
            function reauthenticationSuccess() {
                navigation.navigate(redirect)
            }
    
            firebaseWrapper.loginWithEmailAndPassword(email, password, reauthenticationSuccess, reauthenticationFailure)
        } else {
            setErrorMessage('You must login to the same account that was previously signed in')
        }
    }


    let facebookLoginButton;
    if (redirect === 'ChangePassword') {
        facebookLoginButton = <Button 
                                disabled 
                                onPress={alert('To change your password you must login with your current password')} 
                                style={masterStyles.facebookLoginButton} 
                                title='Login with Facebook' 
                                />
    } else {
        facebookLoginButton = <Button onPress={() => facebookLogin()} style={masterStyles.facebookLoginButton} title='Login with Facebook'/>
    }

    return(
        <ThemedBackground>
            <Text style={masterStyles.title}>Reauthenticate</Text>
            {errorMessage && 
            <Text style={masterStyles.text}>{errorMessage}</Text>
            }
            <Text style={masterStyles.subtitle}>Email:</Text>
            <TextInput onChangeText={setEmail} placeholder='Enter your email' value={email} />
            <Text style={masterStyles.subtitle}>Password:</Text>
            <TextInput onChangeText={setPassword} placeholder='Enter your password' secureTextEntry value={password} />
            <Text onPress={() => navigation.navigate('ForgotPassword')}>Forgot your password?</Text>
            <Button disabled={buttonDisabled} onPress={() => reauthenticate(email, password)} style={masterStyles.loginButton} title='Login'/>
            {facebookLoginButton}
        </ThemedBackground>
    )
}