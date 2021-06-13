import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native'

export default function Background(props) {

    const { colors } = useTheme();
    const styles = StyleSheet.create({
        background: {
          backgroundColor:colors.background,
          flex:1
        },
      });

    return (
        <SafeAreaView {...props} style={[props.style, styles.background]}> 
        {props.children}
        </SafeAreaView>
    );
}

