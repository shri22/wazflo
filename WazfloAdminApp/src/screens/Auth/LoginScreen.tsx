import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { LogIn, Lock, User } from 'lucide-react-native';
import api from '../../services/api';
import { COLORS, SPACING, ROUNDED } from '../../constants/Theme';
import { registerForPushNotificationsAsync } from '../../utils/notifications';

const LoginScreen = ({ navigation }: any) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert('Error', 'Please enter both username and password');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/login', { username, password });
            const { token, storeId, isSuperAdmin } = response.data.data;

            await SecureStore.setItemAsync('token', token);
            await SecureStore.setItemAsync('activeStoreId', String(storeId));
            await SecureStore.setItemAsync('user', JSON.stringify({ username, isSuperAdmin }));

            try {
                await registerForPushNotificationsAsync();
            } catch (e) {
                console.log('Push Registration failed');
            }

            setLoading(false);
            navigation.replace('Main');
        } catch (error: any) {
            setLoading(false);
            const message = error.response?.data?.error || 'Login failed. Check your connection.';
            Alert.alert('Login Error', message);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.inner}>
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoText}>W</Text>
                    </View>
                    <Text style={styles.title}>Wazflo Admin</Text>
                    <Text style={styles.subtitle}>Empowering your WhatsApp Commerce</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <User size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Username"
                            placeholderTextColor={COLORS.textSecondary + '80'}
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Lock size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor={COLORS.textSecondary + '80'}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.loginButtonText}>Login to Dashboard</Text>
                                <LogIn size={20} color="#fff" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <Text style={styles.footerText}>© 2026 Wazflo Technologies</Text>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    inner: { flex: 1, padding: SPACING.lg, justifyContent: 'center', alignItems: 'center' },
    header: { alignItems: 'center', marginBottom: 48 },
    logoContainer: {
        width: 64, height: 64, backgroundColor: COLORS.primary, borderRadius: ROUNDED.lg,
        justifyContent: 'center', alignItems: 'center', marginBottom: 16,
        shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
    },
    logoText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
    title: { fontSize: 28, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 8 },
    subtitle: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center' },
    form: { width: '100%', maxWidth: 400 },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card,
        borderWidth: 1, borderColor: COLORS.border, borderRadius: ROUNDED.md,
        marginBottom: 16, paddingHorizontal: 16,
    },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, height: 52, fontSize: 16, color: COLORS.textPrimary },
    loginButton: {
        flexDirection: 'row', backgroundColor: COLORS.primary, height: 54, borderRadius: ROUNDED.md,
        justifyContent: 'center', alignItems: 'center', marginTop: 8, gap: 8,
    },
    loginButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
    footerText: { position: 'absolute', bottom: 24, color: COLORS.textSecondary, fontSize: 12 },
});

export default LoginScreen;
