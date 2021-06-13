import React from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '@react-navigation/native';

import { AuthContext } from '../contexts/AuthContext';
import createMasterStyles from './masterStyleSheet';
import ThemedBackground from '../components/ThemedBackground';

export default function LoginScreen({ route, navigation }) {

    const [buttonDisabled, setButtonDisabled] = React.useState(true)
    const { colors } = useTheme();
    const [email, setEmail] = React.useState('');
    const { errorMessage } = route.params;
    const { facebookLogin, signIn } = React.useContext(AuthContext);
    const masterStyles = createMasterStyles(colors);
    const [password, setPassword] = React.useState('');

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

    return (
        <ThemedBackground>
            <Text style={masterStyles.title}>Login</Text>
            {errorMessage && 
            <Text style={masterStyles.text}>{errorMessage}</Text>
            }
            <Text style={masterStyles.subtitle}>Email:</Text>
            <TextInput onChangeText={setEmail} placeholder='Enter your email' textContentType='emailAddress' value={email} />
            <Text style={masterStyles.subtitle}>Password:</Text>
            <TextInput onChangeText={setPassword} placeholder='Enter your password' secureTextEntry textContentType='password' value={password} />
            <Text onPress={() => navigation.navigate('ResetPassword')}>Forgot your password?</Text>
            <Button disabled={buttonDisabled} onPress={() => signIn(email, password)} style={masterStyles.loginButton} title='Login'/>
            <Button onPress={() => facebookLogin()} style={masterStyles.facebookLoginButton} title='Login with Facebook'/>
        </ThemedBackground>
    );
}