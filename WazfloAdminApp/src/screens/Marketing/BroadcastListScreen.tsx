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
import { Megaphone, Send, Clock, CheckCircle2, AlertCircle, Plus } from 'lucide-react-native';
import { COLORS, SPACING, ROUNDED } from '../../constants/Theme';
import api from '../../services/api';

const BroadcastListScreen = ({ navigation }: any) => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [broadcasts, setBroadcasts] = useState<any[]>([]);

    useEffect(() => {
        fetchBroadcasts();
    }, []);

    const fetchBroadcasts = async () => {
        try {
            const response = await api.get('/platform/broadcasts');
            setBroadcasts(response.data.data);
        } catch (error) {
            console.error('Fetch Broadcasts Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle2 size={16} color={COLORS.success || '#10b981'} />;
            case 'processing': return <Clock size={16} color={COLORS.primary} />;
            case 'failed': return <AlertCircle size={16} color={COLORS.error} />;
            default: return <Clock size={16} color={COLORS.textSecondary} />;
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                    <Megaphone size={18} color={COLORS.primary} />
                    <Text style={styles.broadcastName}>{item.name || 'Marketing Campaign'}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'completed' ? '#10b98120' : '#3b82f620' }]}>
                    {getStatusIcon(item.status)}
                    <Text style={[styles.statusText, { color: item.status === 'completed' ? '#10b981' : '#3b82f6' }]}>
                        {item.status}
                    </Text>
                </View>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.stat}>
                    <Text style={styles.statLabel}>Target</Text>
                    <Text style={styles.statValue}>{item.target_count}</Text>
                </View>
                <View style={styles.stat}>
                    <Text style={styles.statLabel}>Success</Text>
                    <Text style={styles.statValue}>{item.success_count}</Text>
                </View>
                <View style={styles.stat}>
                    <Text style={styles.statLabel}>Date</Text>
                    <Text style={styles.statValue}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
            </View>

            <Text style={styles.templateText}>Template: <Text style={styles.bold}>{item.template_name}</Text></Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Marketing Campaigns</Text>
            </View>

            <FlatList
                data={broadcasts}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBroadcasts(); }} tintColor={COLORS.primary} />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyState}>
                            <Megaphone size={60} color={COLORS.textSecondary + '40'} />
                            <Text style={styles.emptyTitle}>No Broadcasts Yet</Text>
                            <Text style={styles.emptySubtitle}>Start a new campaign to reach your customers.</Text>
                        </View>
                    ) : null
                }
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => Alert.alert('New Broadcast', 'Please use Web Dashboard to create complex templates for now. App support coming soon.')}
            >
                <Plus size={30} color="#fff" />
            </TouchableOpacity>
        </SafeAreaView>
    );
};

import { Alert } from 'react-native';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { padding: SPACING.md, paddingTop: 60, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    title: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary },
    listContent: { padding: SPACING.md, paddingBottom: 100 },
    card: {
        backgroundColor: COLORS.card, padding: 16, borderRadius: ROUNDED.md,
        marginBottom: 12, borderWidth: 1, borderColor: COLORS.border,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    broadcastName: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    statusText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12, marginBottom: 8 },
    stat: { alignItems: 'flex-start' },
    statLabel: { fontSize: 10, color: COLORS.textSecondary, textTransform: 'uppercase' },
    statValue: { fontSize: 14, fontWeight: 'bold', color: COLORS.textPrimary },
    templateText: { fontSize: 12, color: COLORS.textSecondary },
    bold: { fontWeight: 'bold', color: COLORS.primary },
    emptyState: { alignItems: 'center', marginTop: 100, padding: 40 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, marginTop: 16 },
    emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8 },
    fab: {
        position: 'absolute', right: 20, bottom: 20,
        backgroundColor: COLORS.primary, width: 60, height: 60,
        borderRadius: 30, justifyContent: 'center', alignItems: 'center',
        elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25, shadowRadius: 3.84,
    },
});

export default BroadcastListScreen;
