import { StyleSheet } from 'react-native';

export default function createMasterStyles(colors) { 
    return StyleSheet.create({
                card: {
                    color: colors.card
                },
                facebookLoginButton: {
                    color:'blue'
                },
                loginButton: {
                    color:colors.card
                },
                subtitle: {
                    fontSize: 16,
                    color: colors.text
                },
                text: {
                    color: colors.text,
                },
                title: {
                    color: colors.text,
                    fontSize: 42
                }
            })
    }