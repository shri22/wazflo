import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from '../services/api';

export async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return;
        }

        // Get the token from Expo
        token = (await Notifications.getExpoPushTokenAsync({
            projectId: 'd4298176-7161-4a69-aa40-4db21ee381d5'
        })).data;

        console.log('Mobile Push Token:', token);

        // Send token to backend
        try {
            await api.post('/auth/update-push-token', { token });
            console.log('Push token synced with backend');
        } catch (error) {
            console.error('Error syncing push token:', error);
        }
    } else {
        console.log('Must use physical device for Push Notifications');
    }

    return token;
}
