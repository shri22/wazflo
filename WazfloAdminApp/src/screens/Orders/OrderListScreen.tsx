import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Search, Filter, ChevronRight } from 'lucide-react-native';
import { getOrders } from '../../services/api';
import { COLORS, SPACING, ROUNDED } from '../../constants/Theme';

const OrderListScreen = ({ navigation }: any) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = async () => {
        try {
            const response = await getOrders();
            setOrders(response.data.data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'confirmed': return COLORS.primary;
            case 'paid': return '#3b82f6';
            case 'shipped': return '#8b5cf6';
            case 'pending': return '#f59e0b';
            case 'cancelled': return '#ef4444';
            default: return COLORS.textSecondary;
        }
    };

    const renderOrderItem = ({ item }: any) => (
        <TouchableOpacity
            style={styles.orderCard}
            onPress={() => navigation.navigate('OrderDetail', { order: item })}
        >
            <View style={styles.orderHeader}>
                <Text style={styles.orderNumber}>#{item.order_number}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {item.status.toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.orderBody}>
                <View>
                    <Text style={styles.customerName}>{item.customer_name}</Text>
                    <Text style={styles.orderDetails}>{item.quantity}x {item.product_name}</Text>
                </View>
                <View style={styles.rightContent}>
                    <Text style={styles.orderAmount}>₹{item.total_amount}</Text>
                    <ChevronRight size={20} color={COLORS.textSecondary} />
                </View>
            </View>
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
                <Text style={styles.title}>Orders</Text>
                <View style={styles.headerIcons}>
                    <TouchableOpacity style={styles.iconBtn}><Search size={24} color={COLORS.textPrimary} /></TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn}><Filter size={24} color={COLORS.textPrimary} /></TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={orders}
                renderItem={renderOrderItem}
                keyExtractor={(item: any) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No orders found</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    loadingContainer: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: SPACING.md, paddingTop: 60, paddingBottom: 20,
        backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    title: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary },
    headerIcons: { flexDirection: 'row', gap: 16 },
    iconBtn: { padding: 4 },
    listContent: { padding: SPACING.md },
    orderCard: {
        backgroundColor: COLORS.card, borderRadius: ROUNDED.md, padding: SPACING.md,
        marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border,
    },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    orderNumber: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    orderBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    customerName: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 2 },
    orderDetails: { fontSize: 14, color: COLORS.textSecondary },
    rightContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    orderAmount: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: COLORS.textSecondary, fontSize: 16 },
});

export default OrderListScreen;
