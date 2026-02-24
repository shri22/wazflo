import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Switch,
    Alert,
    ActivityIndicator,
} from 'react-native';
import {
    User,
    Bell,
    Phone,
    Shield,
    LogOut,
    ChevronRight,
    Globe,
    Wallet
} from 'lucide-react-native';
import { COLORS, SPACING, ROUNDED } from '../../constants/Theme';
import { getSettings, updateSettings } from '../../services/api';

const SettingsScreen = ({ navigation }: any) => {
    const [loading, setLoading] = useState(true);
    const [store, setStore] = useState<any>(null);
    const [notifications, setNotifications] = useState(true);
    const [handoffMode, setHandoffMode] = useState(true);

    useEffect(() => {
        fetchStoreSettings();
    }, []);

    const fetchStoreSettings = async () => {
        try {
            const response = await getSettings();
            setStore(response.data.data);
            setHandoffMode(!!response.data.data.support_phone);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const SettingItem = ({ icon: Icon, title, subtitle, value, type = 'link', onToggle }: any) => (
        <TouchableOpacity
            style={styles.settingItem}
            onPress={() => type === 'link' && Alert.alert('Edit', `Modify ${title}`)}
        >
            <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                    <Icon size={20} color={COLORS.primary} />
                </View>
                <View>
                    <Text style={styles.settingTitle}>{title}</Text>
                    {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
                </View>
            </View>

            {type === 'link' && <ChevronRight size={20} color={COLORS.textSecondary} />}
            {type === 'toggle' && (
                <Switch
                    value={value}
                    onToggle={onToggle}
                    trackColor={{ false: '#3e3e3e', true: COLORS.primary + '80' }}
                    thumbColor={value ? COLORS.primary : '#f4f3f4'}
                />
            )}
            {type === 'text' && <Text style={styles.textValue}>{value}</Text>}
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Settings</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.profileSection}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{store?.name?.charAt(0) || 'S'}</Text>
                    </View>
                    <Text style={styles.profileName}>{store?.name || 'Store Name'}</Text>
                    <Text style={styles.profileEmail}>Premium Merchant #WF-{store?.id || '000'}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Preferences</Text>
                    <SettingItem
                        icon={Bell}
                        title="Push Notifications"
                        subtitle="Alerts for new orders & chats"
                        type="toggle"
                        value={notifications}
                        onToggle={() => setNotifications(!notifications)}
                    />
                    <SettingItem
                        icon={Shield}
                        title="Handoff Mode"
                        subtitle="Divert 'Talk to Expert' to personal WhatsApp"
                        type="toggle"
                        value={handoffMode}
                        onToggle={() => setHandoffMode(!handoffMode)}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Store Configuration</Text>
                    <SettingItem
                        icon={Phone}
                        title="Support Phone"
                        type="text"
                        value={store?.support_phone || 'Not Set'}
                    />
                    <SettingItem
                        icon={Wallet}
                        title="Merchant Wallet"
                        subtitle={`Balance: ₹${store?.wallet_balance || '0.00'}`}
                        onPress={() => navigation.navigate('Wallet')}
                    />
                    <SettingItem
                        icon={Globe}
                        title="WhatsApp Phone ID"
                        subtitle={store?.whatsapp_phone_number_id}
                    />
                </View>

                <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={() => navigation.replace('Login')}
                >
                    <LogOut size={20} color={COLORS.error} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>V 1.0.2 (Build 45) • Wazflo Admin</Text>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    loadingContainer: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
    header: {
        paddingHorizontal: SPACING.md, paddingTop: 60, paddingBottom: 20,
        backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    title: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary },
    content: { padding: SPACING.md, paddingBottom: 40 },
    profileSection: { alignItems: 'center', marginVertical: SPACING.xl },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    avatarText: { fontSize: 28, color: '#fff', fontWeight: 'bold' },
    profileName: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary },
    profileEmail: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
    section: { marginBottom: 24 },
    sectionLabel: { fontSize: 13, fontWeight: 'bold', color: COLORS.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
    settingItem: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: COLORS.card, padding: 16, borderRadius: ROUNDED.md, marginBottom: 8,
        borderWidth: 1, borderColor: COLORS.border,
    },
    settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    iconContainer: { width: 36, height: 36, borderRadius: 8, backgroundColor: COLORS.primary + '10', justifyContent: 'center', alignItems: 'center' },
    settingTitle: { fontSize: 16, color: COLORS.textPrimary, fontWeight: '500' },
    settingSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
    textValue: { color: COLORS.textSecondary, fontSize: 14 },
    logoutBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
        padding: 16, borderRadius: ROUNDED.md, borderWidth: 1, borderColor: COLORS.error + '40',
        marginTop: 8,
    },
    logoutText: { color: COLORS.error, fontSize: 16, fontWeight: 'bold' },
    versionText: { textAlign: 'center', color: COLORS.textSecondary + '60', fontSize: 12, marginTop: 24 },
});

export default SettingsScreen;
