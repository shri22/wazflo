import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AdminNavigator from './src/navigation/AdminNavigator';

export default function App() {
    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <AdminNavigator />
            </NavigationContainer>
        </SafeAreaProvider>
    );
}
