import React from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '@react-navigation/native';

import { AuthContext } from '../contexts/AuthContext';
import createMasterStyles from './masterStyleSheet';
import firebaseWrapper from '../wrappers/FirebaseWrapper';
import ThemedBackground from '../components/ThemedBackground';

export default function SignupScreen({ route, navigation }) {

    const [buttonDisabled, setButtonDisabled] = React.useState(true)
    const { colors } = useTheme();
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [displayName, setDisplayName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const { errorMessage } = route.params;
    const masterStyles = createMasterStyles(colors);
    const [password, setPassword] = React.useState('');
    const { signUp } = React.useContext(AuthContext);
    const [username, setUsername] = React.useState('');
    const [usernameTaken, setUsernameTaken] = React.useState(false);

    React.useEffect(() => {
        /* 
            Checks that email is of the form something@something.something, password is longer than 6 characters,
            and a username and display name are entered.
            I'm not sure what checking firebase does so the email may still be invalid by their standards
        */
        if (password === confirmPassword && password.length >= 6) {
            const re = /\S+@\S+\.\S+/;
            if (re.test(email)) {
                if (displayName) {
                    if (usernameTaken === false && username !== '') {
                        setButtonDisabled(false)
                        return;
                    }
                }
            } 
        }
        setButtonDisabled(true) 
    })

    React.useEffect(() => {
        // Checks the entered username against the database to see if it is already taken
        if (username === '') {
            setUsernameTaken(true) // Set usernameTaken to true to prevent submission of an empty string, which would be rejected by firebase anyway
        } else {
            setUsernameTaken(firebaseWrapper.checkUsernameExists(username))
        }
    }, [username]) // Effect only runs if username is updated

    return(
        <ThemedBackground>
            <Text style={masterStyles.title}>Signup</Text>
            {errorMessage && 
            <Text style={masterStyles.text}>{errorMessage}</Text>
            }
            <Text style={masterStyles.subtitle}>Username:</Text>
            <TextInput 
                onChangeText={setUsername} 
                placeholder='This is how your friends can find you' 
                textContentType='username' 
                value={username}
            />
            <Text style={masterStyles.subtitle}>Display Name:</Text>
            <TextInput 
                onChangeText={setDisplayName} 
                placeholder='This is the name that will be shown' 
                textContentType='username' 
                value={displayName} 
            />
            <Text style={masterStyles.subtitle}>Email:</Text>
            <TextInput 
                onChangeText={setEmail} 
                placeholder='Enter email' 
                textContentType='emailAddress' 
                value={email} 
            />
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
                onPress={() => signUp(displayName, email, password)} 
                title='Sign Up' 
            />
        </ThemedBackground>
    )
}