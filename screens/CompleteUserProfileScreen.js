import React from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '@react-navigation/native';

import firebaseWrapper from '../wrappers/FirebaseWrapper';
import createMasterStyles from './masterStyleSheet';
import ThemedBackground from '../components/ThemedBackground';
import { UserContext } from '../contexts/UserContext';

export default function CompleteUserProfileScreen({ navigation }) {

    const { colors } = useTheme();
    const [displayName, setDisplayName] = React.useState('');
    const [errorMessage, setErrorMessage] = React.useState('');
    const masterStyles = createMasterStyles(colors);
    const { user } = React.useContext(UserContext);
    const [username, setUsername] = React.useState('');

    function updateFailure(error) { // Better error handling/logging at some point
        console.log(error)
        setErrorMessage('Something went wrong, please try again')
    }

    function updateSuccess() {
        navigation.navigate('Home')
    }
    
    if (user.displayName === null && user.username === null) {
        return (
            <ThemedBackground>
                <Text style={masterStyles.title}>Update Profile</Text>
                <Text style={masterStyles.text}>Your account currently doesn't have a Display Name or Username. Let's create them now.</Text>
                {errorMessage &&
                <Text style={masterStyles.text}>{errorMessage}</Text>
                }
                <Text style={masterStyles.subtitle}>Enter a Display Name:</Text>
                <TextInput onChangeText={setDisplayName} value={displayName} />
                <Text style={masterStyles.subtitle}>Enter a Username:</Text>
                <TextInput onChangeText={setUsername} value={username} />
                <Button onPress={firebaseWrapper.updateDisplayNameAndUsername(user, displayName, username, updateSuccess, updateFailure)} title='Submit' />
            </ThemedBackground>
        )
    } else if (user.displayName === null) {
        <ThemedBackground>
        <Text style={masterStyles.title}>Update Profile</Text>
        <Text style={masterStyles.text}>Your account currently doesn't have a Display Name. Let's create one now.</Text>
        {errorMessage &&
        <Text style={masterStyles.text}>{errorMessage}</Text>
        }
        <Text style={masterStyles.subtitle}>Enter a Display Name:</Text>
        <TextInput onChangeText={setDisplayName} value={displayName} />
        <Button onPress={firebaseWrapper.updateDisplayName(user, displayName, updateSuccess, updateFailure)} title='Submit' />
        </ThemedBackground>
    } else if (user.username === null) {
        <ThemedBackground>
        <Text style={masterStyles.title}>Update Profile</Text>
        <Text style={masterStyles.text}>Your account currently doesn't have a Username. Let's create one now.</Text>
        {errorMessage &&
        <Text style={masterStyles.text}>{errorMessage}</Text>
        }
        <Text style={masterStyles.subtitle}>Enter a Username:</Text>
        <TextInput onChangeText={setUsername} value={username} />
        <Button onPress={firebaseWrapper.updateUsername(user, username, updateSuccess, updateFailure)} title='Submit' />
        </ThemedBackground>
    }
    
}