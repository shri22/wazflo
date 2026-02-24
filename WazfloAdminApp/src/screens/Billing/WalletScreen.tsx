import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
} from 'react-native';
import { Wallet, ArrowDownRight, ArrowUpRight, History, Info } from 'lucide-react-native';
import { COLORS, SPACING, ROUNDED } from '../../constants/Theme';
import api from '../../services/api';

const WalletScreen = ({ navigation }: any) => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [usageLogs, setUsageLogs] = useState<any[]>([]);
    const [balance, setBalance] = useState(0);

    useEffect(() => {
        fetchWalletData();
    }, []);

    const fetchWalletData = async () => {
        try {
            const [settingsRes, logsRes] = await Promise.all([
                api.get('/stores/settings'),
                api.get('/platform/usage-logs')
            ]);
            setBalance(settingsRes.data.data.wallet_balance);
            setUsageLogs(logsRes.data.data);
        } catch (error) {
            console.error('Fetch Wallet Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const renderLogItem = ({ item }: { item: any }) => (
        <View style={styles.logCard}>
            <View style={styles.logLeft}>
                <View style={[styles.logIcon, { backgroundColor: item.cost > 0 ? '#ef444420' : '#10b98120' }]}>
                    {item.cost > 0 ?
                        <ArrowDownRight size={20} color="#ef4444" /> :
                        <ArrowUpRight size={20} color="#10b981" />
                    }
                </View>
                <View>
                    <Text style={styles.logType}>{item.type.replace('_', ' ').toUpperCase()}</Text>
                    <Text style={styles.logDetails}>{item.details || 'System recharge'}</Text>
                    <Text style={styles.logDate}>{new Date(item.created_at).toLocaleString()}</Text>
                </View>
            </View>
            <View style={styles.logRight}>
                <Text style={[styles.logCost, { color: item.cost > 0 ? '#ef4444' : '#10b981' }]}>
                    {item.cost > 0 ? '-' : '+'}₹{Math.abs(item.cost).toFixed(2)}
                </Text>
                <Text style={styles.logBalance}>Bal: ₹{item.balance_after.toFixed(2)}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Merchant Wallet</Text>
            </View>

            <View style={styles.balanceCard}>
                <View style={styles.balanceInfo}>
                    <Text style={styles.balanceLabel}>Current Balance</Text>
                    <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>
                </View>
                <TouchableOpacity
                    style={styles.rechargeBtn}
                    onPress={() => Alert.alert('Recharge Wallet', 'Please contact Super Admin to add balance to your account via UPI/Bank.')}
                >
                    <Text style={styles.rechargeBtnText}>Recharge</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.historyHeader}>
                <History size={18} color={COLORS.textSecondary} />
                <Text style={styles.historyTitle}>Usage History</Text>
            </View>

            <FlatList
                data={usageLogs}
                renderItem={renderLogItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchWalletData(); }} tintColor={COLORS.primary} />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyState}>
                            <Info size={40} color={COLORS.textSecondary} />
                            <Text style={styles.emptyText}>No transaction history yet.</Text>
                        </View>
                    ) : null
                }
            />
        </SafeAreaView>
    );
};

import { Alert } from 'react-native';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { padding: SPACING.md, paddingTop: 60, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    title: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary },
    balanceCard: {
        backgroundColor: COLORS.primary, margin: SPACING.md, padding: 24, borderRadius: ROUNDED.lg,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        elevation: 4, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8,
    },
    balanceInfo: { gap: 4 },
    balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
    balanceAmount: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
    rechargeBtn: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    rechargeBtnText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 14 },
    historyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: SPACING.md, marginTop: 12, marginBottom: 8 },
    historyTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textSecondary },
    listContent: { paddingHorizontal: SPACING.md, paddingBottom: 100 },
    logCard: {
        backgroundColor: COLORS.card, padding: 16, borderRadius: ROUNDED.md,
        marginBottom: 8, borderWidth: 1, borderColor: COLORS.border,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    logLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    logIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    logType: { fontSize: 12, fontWeight: 'bold', color: COLORS.textPrimary },
    logDetails: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
    logDate: { fontSize: 9, color: COLORS.textSecondary + '80', marginTop: 4 },
    logRight: { alignItems: 'flex-end' },
    logCost: { fontSize: 16, fontWeight: 'bold' },
    logBalance: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },
    emptyState: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: COLORS.textSecondary, marginTop: 12 },
});

export default WalletScreen;
