import React from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '@react-navigation/native';

import createMasterStyles from './masterStyleSheet';
import firebaseWrapper from '../wrappers/FirebaseWrapper';
import ThemedBackground from '../components/ThemedBackground';

export default function DeleteAccountScreen({ navigation }) {

    const [buttonDisabled, setButtonDisabled] = React.useState(true);
    const { colors } = useTheme();
    const [errorMessage, setErrorMessage] = React.useState('');
    const masterStyles = createMasterStyles(colors);
    const { signOut } = React.useContext(AuthContext);
    const { user } = React.useContext(UserContext);

    React.useEffect(() => {
        if (username === user.username) {
            setButtonDisabled(false)
        }
        setButtonDisabled(true)
    })

    function deleteSuccess() {
        // Calling the signOut function will take the user back to the login screen and clear their stored credentials
        signOut()
    }

    function deleteFailure(error) {
        if (error.customMessage) {
            setErrorMessage(error.customMessage)
        } else {
            setErrorMessage('An error occured while attempting to delete your account. We apologize for the inconvenience')
        }
    }

    return(
        <ThemedBackground>
            <Text style={masterStyles.title}>Delete your account</Text>
            {errorMessage && 
            <Text style={masterStyles.text}>{errorMessage}</Text>
            }
            <Text style={masterStyles.text}>This action cannot be undone. To confirm you want to delete your account, please enter your username below</Text>
            <TextInput onChangeText={setUsername} placeholder='Username' value={username} />
            <Button disabled={buttonDisabled} onPress={() => firebaseWrapper.deleteUser(user, deleteSuccess, deleteFailure)} title='Delete your account' />
        </ThemedBackground>
    )
}