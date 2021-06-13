import React from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '@react-navigation/native';

import createMasterStyles from './masterStyleSheet';
import firebaseWrapper from '../wrappers/FirebaseWrapper';
import ThemedBackground from '../components/ThemedBackground';

export default function ChangePasswordScree({ navigation }) {

    const [buttonDisabled, setButtonDisabled] = React.useState(true)
    const [changeSuccess, setChangeSuccess] = React.useState(false);
    const { colors } = useTheme();
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [errorMessage, setErrorMessage] = React.useState('');
    const masterStyles = createMasterStyles(colors);
    const [password, setPassword] = React.useState('');

    React.useEffect(() => {
        if (password === confirmPassword && password.length >=6) {
            setButtonDisabled(false)
        }
        setButtonDisabled(true)
    })

    function changePasswordFailure(error) {
        // Proper error logging at some point
        setErrorMessage('An error occured. Please try again')
    }

    function changePasswordSuccess() {
        setChangeSuccess(true)
    }

    if (changeSuccess) {
        return( 
            <ThemedBackground>
                <Text style={masterStyles.text}>Your password was changed successfully</Text>
                <Button onPress={() => navigation.navigate('Home')} style={masterStyles.card} title='Go Home' />
            </ThemedBackground>
        )
    } else {
        return(
            <ThemedBackground>
                <Text style={masterStyles.title}>Change Password</Text>
                {errorMessage && 
                <Text>{errorMessage}</Text>
                }
                <Text style={masterStyles.subtitle}>Password:</Text>
                <TextInput 
                    onChangeText={setPassword} 
                    placeholder='Enter password' 
                    secureTextEntry 
                    textContentType='newPassword' 
                    value={password} 
                />
                <Text style={masterStyles.text}>Your password must be at least 6 characters long</Text>
                <Text style={masterStyles.subtitle}>Confirm Password:</Text>
                <TextInput 
                    onChangeText={setConfirmPassword} 
                    placeholder='Confirm password' 
                    secureTextEntry 
                    textContentType='newPassword' 
                    value={confirmPassword} 
                />
                <Button 
                    disabled={buttonDisabled} 
                    onPress={() => firebaseWrapper.changePassword(password, changePasswordSuccess, changePasswordFailure)} 
                    title='Change Password' 
                />
            </ThemedBackground>
        )
    }

}