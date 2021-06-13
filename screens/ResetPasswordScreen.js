import React from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '@react-navigation/native';

import createMasterStyles from './masterStyleSheet';
import firebaseWrapper from '../wrappers/FirebaseWrapper';
import ThemedBackground from '../components/ThemedBackground';

export default function ResetPasswordScreen({ navigation }) {

    const { colors } = useTheme();
    const [email, setEmail] = React.useState('');
    const masterStyles = createMasterStyles(colors);
    const [showErrorMessage, setShowErrorMessage] = React.useState(false);
    const [showMessage, setShowMessage] = React.useState(false);

    // Both state variables are set in the below functions to handle the case where a user enters multiple emails
    function onSuccess() {
        setShowErrorMessage(false);
        setShowMessage(true)
    }

    function onFailure(error) {
        if (error.code === 'auth/invalid-email' || error.code === 'auth/user-not-found') { // Hide these errors to not leak information
            setShowErrorMessage(false);
            setShowMessage(true);
        } else {
            setShowErrorMessage(true);
            setShowMessage(false);
        }
    }
    
    return(
        <ThemedBackground>
            <Text style={masterStyles.title}>Password Reset</Text>
            {showMessage &&
            <Text styles={masterStyles.text}>If an account is associated with that email a password reset email has been sent</Text>
            }
            {showErrorMessage &&
            <Text styles={masterStyles.text}>Something went wrong on our end, please try again</Text>
            }
            <TextInput onChangeText={setEmail} placeholder='Enter your email' value={email} />
            <Button onPress={() => firebaseWrapper.sendPasswordResetEmail(email, onSuccess, onFailure)} title='Submit' />
        </ThemedBackground>
    )
}