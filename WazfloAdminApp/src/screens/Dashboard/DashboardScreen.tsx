import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
} from 'react-native';
import {
    ShoppingBag,
    TrendingUp,
    Users,
    MessageSquare,
    Plus,
    Store,
    ChevronDown,
} from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { COLORS, SPACING, ROUNDED } from '../../constants/Theme';
import { getStats, getRevenueReport, getStores, getOrders } from '../../services/api';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }: any) => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [stores, setStores] = useState<any[]>([]);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [activeStoreName, setActiveStoreName] = useState('My Store');

    useEffect(() => {
        checkUserRole();
        fetchDashboardData();
    }, []);

    const checkUserRole = async () => {
        const user = await SecureStore.getItemAsync('user');
        if (user) {
            const parsed = JSON.parse(user);
            setIsSuperAdmin(parsed.isSuperAdmin === 1);
            if (parsed.isSuperAdmin === 1) {
                const storesRes = await getStores();
                setStores(storesRes.data.data);
                const activeId = await SecureStore.getItemAsync('activeStoreId');
                if (activeId) {
                    const activeStore = storesRes.data.data.find((s: any) => s.id === parseInt(activeId));
                    if (activeStore) setActiveStoreName(activeStore.name);
                } else {
                    setActiveStoreName('Platform Overview');
                }
            }
        }
    };

    const fetchDashboardData = async () => {
        try {
            const [statsRes, revenueRes, ordersRes] = await Promise.all([
                getStats(),
                getRevenueReport(7),
                getOrders()
            ]);
            setStats(statsRes.data.data);
            setRevenueData(revenueRes.data.data);
            setRecentOrders(ordersRes.data.data.slice(0, 5));
        } catch (error) {
            console.error('Fetch Dashboard Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    const handleStoreSwitch = async (store: any) => {
        if (!store) {
            await SecureStore.deleteItemAsync('activeStoreId');
            setActiveStoreName('Platform Overview');
        } else {
            await SecureStore.setItemAsync('activeStoreId', store.id.toString());
            setActiveStoreName(store.name);
        }
        setLoading(true);
        fetchDashboardData();
    };

    const RevenueChart = () => {
        if (!revenueData || revenueData.length === 0) return null;

        const maxRevenue = Math.max(...revenueData.map(d => d.revenue), 1000);
        const chartHeight = 150;

        return (
            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>7-Day Revenue Report</Text>
                <View style={styles.chartBars}>
                    {revenueData.map((day, idx) => {
                        const barHeight = (day.revenue / maxRevenue) * chartHeight;
                        return (
                            <View key={idx} style={styles.barWrapper}>
                                <View style={[styles.bar, { height: Math.max(barHeight, 5) }]} />
                                <Text style={styles.barLabel}>{day.date.split('-').slice(1).join('/')}</Text>
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    };

    const StatCard = ({ title, value, icon: Icon, color }: any) => (
        <View style={styles.statCard}>
            <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                <Icon size={24} color={color} />
            </View>
            <View>
                <Text style={styles.statTitle}>{title}</Text>
                <Text style={styles.statValue}>{value}</Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.navHeader}>
                <View>
                    <Text style={styles.welcomeText}>Morning, Merchant 👋</Text>
                    <TouchableOpacity style={styles.storeSelector} onPress={() => {
                        if (isSuperAdmin && stores.length > 0) {
                            Alert.alert(
                                'Switch Store',
                                'Select a store to manage',
                                [
                                    { text: 'Default Admin', onPress: () => handleStoreSwitch(null) },
                                    ...stores.map(s => ({ text: s.name, onPress: () => handleStoreSwitch(s) })),
                                    { text: 'Cancel', style: 'cancel' }
                                ]
                            );
                        }
                    }}>
                        <Text style={styles.storeName}>{activeStoreName}</Text>
                        {isSuperAdmin && <ChevronDown size={16} color={COLORS.primary} />}
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
            >
                <View style={styles.statsGrid}>
                    <StatCard title="Today's Sales" value={`₹${stats?.today?.revenue || 0}`} icon={TrendingUp} color={COLORS.primary} />
                    <StatCard title="Total Orders" value={stats?.today?.count || 0} icon={ShoppingBag} color={COLORS.secondary} />
                    <StatCard title="Last 7 Days" value={`₹${stats?.week?.revenue || 0}`} icon={Users} color={COLORS.accent} />
                    <StatCard title="Monthly" value={`₹${stats?.month?.revenue || 0}`} icon={MessageSquare} color="#ff9100" />
                </View>

                <RevenueChart />

                <Text style={styles.sectionTitle}>Recent Orders</Text>
                {recentOrders.map((order) => (
                    <TouchableOpacity key={order.id} style={styles.orderCard} onPress={() => navigation.navigate('Orders', { screen: 'OrderDetail', params: { orderId: order.id } })}>
                        <View style={styles.orderLeft}>
                            <View style={styles.orderInitial}>
                                <Text style={styles.initialText}>{order.customer_name?.charAt(0) || 'C'}</Text>
                            </View>
                            <View>
                                <Text style={styles.customerName}>{order.customer_name || 'Customer'}</Text>
                                <Text style={styles.orderTime}>{order.order_number}</Text>
                            </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.orderAmount}>₹{order.total_amount}</Text>
                            <Text style={[styles.orderStatus, { color: order.status === 'confirmed' ? COLORS.primary : COLORS.textSecondary }]}>{order.status}</Text>
                        </View>
                    </TouchableOpacity>
                ))}

                <TouchableOpacity style={styles.addProductBtn} onPress={() => navigation.navigate('Catalog', { screen: 'AddProduct' })}>
                    <Plus size={24} color="#fff" />
                    <Text style={styles.addProductText}>Add New Product</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

// For Alert usage in standard component
import { Alert } from 'react-native';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    loadingContainer: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
    navHeader: { padding: SPACING.md, paddingTop: 60, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    welcomeText: { fontSize: 14, color: COLORS.textSecondary },
    storeSelector: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    storeName: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary },
    scrollContent: { padding: SPACING.md, paddingBottom: 100 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginVertical: SPACING.lg },
    statCard: {
        backgroundColor: COLORS.card, width: '47.5%', padding: SPACING.md, borderRadius: ROUNDED.lg,
        borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    iconContainer: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    statTitle: { fontSize: 12, color: COLORS.textSecondary },
    statValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
    chartContainer: { backgroundColor: COLORS.card, padding: SPACING.md, borderRadius: ROUNDED.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.xl },
    chartTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 16 },
    chartBars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 180, paddingBottom: 20 },
    barWrapper: { alignItems: 'center', flex: 1 },
    bar: { width: 12, backgroundColor: COLORS.primary, borderRadius: 6 },
    barLabel: { fontSize: 10, color: COLORS.textSecondary, marginTop: 8 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.md },
    orderCard: {
        backgroundColor: COLORS.card, padding: SPACING.md, borderRadius: ROUNDED.lg,
        borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row',
        justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm,
    },
    orderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    orderInitial: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.secondary + '20', justifyContent: 'center', alignItems: 'center' },
    initialText: { color: COLORS.secondary, fontWeight: 'bold', fontSize: 16 },
    customerName: { color: COLORS.textPrimary, fontWeight: '600', fontSize: 16 },
    orderTime: { color: COLORS.textSecondary, fontSize: 10 },
    orderAmount: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 16 },
    orderStatus: { fontSize: 10, textTransform: 'capitalize', marginTop: 2 },
    addProductBtn: {
        backgroundColor: COLORS.primary, height: 56, borderRadius: ROUNDED.xl,
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12,
        marginTop: SPACING.lg,
    },
    addProductText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default DashboardScreen;
