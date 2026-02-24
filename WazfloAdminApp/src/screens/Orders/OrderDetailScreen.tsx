import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    Linking,
} from 'react-native';
import {
    ArrowLeft,
    MapPin,
    Phone,
    Package,
    CheckCircle,
    Truck,
    XCircle,
    MessageCircle
} from 'lucide-react-native';
import { updateOrderStatus } from '../../services/api';
import { COLORS, SPACING, ROUNDED } from '../../constants/Theme';

const OrderDetailScreen = ({ route, navigation }: any) => {
    const { order } = route.params;
    const [loading, setLoading] = useState(false);
    const [currentStatus, setCurrentStatus] = useState(order.status);

    const handleStatusUpdate = async (newStatus: string) => {
        Alert.alert(
            'Update Status',
            `Are you sure you want to change status to ${newStatus}? A WhatsApp notification will be sent to the customer.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Update',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await updateOrderStatus(order.id, newStatus);
                            setCurrentStatus(newStatus);
                            Alert.alert('Success', `Order marked as ${newStatus}`);
                        } catch (error) {
                            Alert.alert('Error', 'Failed to update status');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const openWhatsApp = () => {
        const url = `whatsapp://send?phone=${order.customer_phone}&text=Hi ${order.customer_name}, regarding your order #${order.order_number}...`;
        Linking.openURL(url).catch(() => Alert.alert('Error', 'WhatsApp not installed'));
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order Details</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.statusSection}>
                    <View style={[styles.statusBadge, { backgroundColor: COLORS.primary + '20' }]}>
                        <Text style={[styles.statusText, { color: COLORS.primary }]}>{currentStatus.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.orderNumber}>#{order.order_number}</Text>
                </View>

                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Package size={20} color={COLORS.primary} />
                        <Text style={styles.cardTitle}>Items</Text>
                    </View>
                    <View style={styles.itemRow}>
                        <Text style={styles.itemName}>{order.quantity}x {order.product_name}</Text>
                        <Text style={styles.itemPrice}>₹{order.total_amount}</Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <MapPin size={20} color={COLORS.primary} />
                        <Text style={styles.cardTitle}>Shipping Address</Text>
                    </View>
                    <Text style={styles.addressText}>{order.address || 'No address provided'}</Text>
                </View>

                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Phone size={20} color={COLORS.primary} />
                        <Text style={styles.cardTitle}>Customer</Text>
                    </View>
                    <Text style={styles.customerName}>{order.customer_name}</Text>
                    <Text style={styles.customerPhone}>{order.customer_phone}</Text>

                    <TouchableOpacity style={styles.chatBtn} onPress={openWhatsApp}>
                        <MessageCircle size={20} color="#fff" />
                        <Text style={styles.chatBtnText}>Chat on WhatsApp</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.actionsTitle}>Quick Actions</Text>
                <View style={styles.actionGrid}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { borderColor: COLORS.primary }]}
                        onPress={() => handleStatusUpdate('confirmed')}
                    >
                        <CheckCircle size={24} color={COLORS.primary} />
                        <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>Confirm</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, { borderColor: '#8b5cf6' }]}
                        onPress={() => handleStatusUpdate('shipped')}
                    >
                        <Truck size={24} color="#8b5cf6" />
                        <Text style={[styles.actionBtnText, { color: '#8b5cf6' }]}>Ship</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, { borderColor: '#ef4444' }]}
                        onPress={() => handleStatusUpdate('cancelled')}
                    >
                        <XCircle size={24} color="#ef4444" />
                        <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: SPACING.md, paddingTop: 60, paddingBottom: 20,
        backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
    content: { padding: SPACING.md, paddingBottom: 40 },
    statusSection: { alignItems: 'center', marginBottom: 24 },
    statusBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginBottom: 8 },
    statusText: { fontSize: 14, fontWeight: 'bold' },
    orderNumber: { fontSize: 16, color: COLORS.textSecondary },
    card: {
        backgroundColor: COLORS.card, borderRadius: ROUNDED.lg, padding: SPACING.md,
        marginBottom: 16, borderWidth: 1, borderColor: COLORS.border,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    itemName: { fontSize: 16, color: COLORS.textPrimary },
    itemPrice: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
    addressText: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 22 },
    customerName: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
    customerPhone: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 16 },
    chatBtn: {
        backgroundColor: '#25D366', flexDirection: 'row', height: 48, borderRadius: ROUNDED.md,
        justifyContent: 'center', alignItems: 'center', gap: 8,
    },
    chatBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    actionsTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.textSecondary, marginBottom: 12, marginTop: 8, textTransform: 'uppercase' },
    actionGrid: { flexDirection: 'row', gap: 12 },
    actionBtn: {
        flex: 1, height: 80, borderRadius: ROUNDED.md, borderWidth: 1,
        justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: COLORS.card,
    },
    actionBtnText: { fontSize: 13, fontWeight: 'bold' },
});

export default OrderDetailScreen;
