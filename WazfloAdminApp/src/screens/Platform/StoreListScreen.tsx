import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
    Alert,
} from 'react-native';
import { Store, Plus, ArrowRight, User, Wallet } from 'lucide-react-native';
import { COLORS, SPACING, ROUNDED } from '../../constants/Theme';
import api from '../../services/api';

const StoreListScreen = ({ navigation }: any) => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stores, setStores] = useState<any[]>([]);

    useEffect(() => {
        fetchStores();
    }, []);

    const fetchStores = async () => {
        try {
            const response = await api.get('/stores');
            setStores(response.data.data);
        } catch (error) {
            console.error('Fetch Stores Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const renderStoreItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => Alert.alert('Manage Store', `Opening settings for ${item.name}`)}
        >
            <View style={styles.cardTop}>
                <View style={styles.storeIcon}>
                    <Store size={24} color={COLORS.primary} />
                </View>
                <View style={styles.storeMain}>
                    <Text style={styles.storeName}>{item.name}</Text>
                    <View style={styles.row}>
                        <User size={12} color={COLORS.textSecondary} />
                        <Text style={styles.storeAdmin}>{item.admin_name || 'Admin'}</Text>
                    </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.is_active ? '#10b98120' : '#ef444420' }]}>
                    <Text style={[styles.statusText, { color: item.is_active ? '#10b981' : '#ef4444' }]}>
                        {item.is_active ? 'Active' : 'Paused'}
                    </Text>
                </View>
            </View>

            <View style={styles.cardBottom}>
                <View style={styles.stat}>
                    <Text style={styles.statLabel}>Wallet</Text>
                    <Text style={[styles.statValue, { color: item.wallet_balance < 10 ? '#ef4444' : COLORS.textPrimary }]}>
                        ₹{item.wallet_balance.toFixed(2)}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => Alert.prompt(
                        'Add Balance',
                        `Add credits to ${item.name}`,
                        [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Add', onPress: (amount) => handleAddBalance(item.id, amount) }
                        ],
                        'plain-text',
                        '',
                        'number-pad'
                    )}
                >
                    <Plus size={16} color={COLORS.primary} />
                    <Text style={styles.actionText}>Add Credits</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const handleAddBalance = async (storeId: number, amount: any) => {
        if (!amount || isNaN(amount)) return;
        try {
            await api.post(`/platform/stores/${storeId}/balance`, { amount: parseFloat(amount) });
            Alert.alert('Success', 'Balance updated!');
            fetchStores();
        } catch (error) {
            Alert.alert('Error', 'Failed to update balance');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>All Stores</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => Alert.alert('New Store', 'Please use Web Dashboard to register new multi-tenant stores.')}>
                    <Plus size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={stores}
                renderItem={renderStoreItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStores(); }} tintColor={COLORS.primary} />
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { padding: SPACING.md, paddingTop: 60, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary },
    addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: SPACING.md, paddingBottom: 100 },
    card: {
        backgroundColor: COLORS.card, padding: 16, borderRadius: ROUNDED.md,
        marginBottom: 12, borderWidth: 1, borderColor: COLORS.border,
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    storeIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.primary + '10', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    storeMain: { flex: 1 },
    storeName: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
    row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    storeAdmin: { fontSize: 12, color: COLORS.textSecondary },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 },
    stat: { alignItems: 'flex-start' },
    statLabel: { fontSize: 10, color: COLORS.textSecondary, textTransform: 'uppercase' },
    statValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary + '10', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 18 },
    actionText: { fontSize: 12, fontWeight: 'bold', color: COLORS.primary },
});

export default StoreListScreen;
