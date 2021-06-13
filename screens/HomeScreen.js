import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@react-navigation/native';

import { AuthContext } from '../contexts/AuthContext';
import firebaseWrapper from '../wrappers/FirebaseWrapper';
import createMasterStyles from './masterStyleSheet';
import ThemedBackground from '../components/ThemedBackground';
import { UserContext } from '../contexts/UserContext';

export default function HomeScreen({ navigation }) {

    const { colors } = useTheme();
    const masterStyles = createMasterStyles(colors);
    const { signOut } = React.useContext(AuthContext);
    const { user } = React.useContext(UserContext);

    // Make sure user object has a displayName and username, and if not, make the user create them
    if (user.displayName === null || user.username === null) {
        // Redirect user to CompleteUserProfileScreen
        navigation.navigate('CompleteUserProfile');
    }

    return (
        <ThemedBackground>
            <Text style={masterStyles.title}>This is the Home Screen</Text>
            <Button onPress={() => signOut()} title='Sign Out' />
            <Button onPress={() => navigation.navigate('Reauthentication', {redirect: 'ChangePassword'})} title='Change Password' />
            <Button onPress={() => navigation.navigate('Reauthentication', {redirect: 'DeleteAccount'})} title='Delete Account' />
        </ThemedBackground>
    )
}