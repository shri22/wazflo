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
} from 'react-native';
import { MessageSquare, User, Clock, ChevronRight } from 'lucide-react-native';
import { COLORS, SPACING, ROUNDED } from '../../constants/Theme';
import api from '../../services/api';

const ChatListScreen = ({ navigation }: any) => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [conversations, setConversations] = useState<any[]>([]);

    useEffect(() => {
        fetchConversations();
    }, []);

    const fetchConversations = async () => {
        try {
            const response = await api.get('/platform/conversations');
            setConversations(response.data.data);
        } catch (error) {
            console.error('Fetch Chats Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const renderChatRow = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.chatRow}
            onPress={() => navigation.navigate('ChatDetail', { phone: item.customer_phone, name: item.customer_name })}
        >
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.customer_name?.charAt(0) || 'C'}</Text>
            </View>
            <View style={styles.chatInfo}>
                <View style={styles.infoTop}>
                    <Text style={styles.customerName}>{item.customer_name || item.customer_phone}</Text>
                    <Text style={styles.timeText}>{new Date(item.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <View style={styles.infoBottom}>
                    <Text style={styles.lastMessage} numberOfLines={1}>
                        {item.last_message_text || 'No messages yet'}
                    </Text>
                    {item.unread_count > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadText}>{item.unread_count}</Text>
                        </View>
                    )}
                </View>
            </View>
            <ChevronRight size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Live Chats</Text>
                <View style={styles.onlineBadge}>
                    <View style={styles.dot} />
                    <Text style={styles.onlineText}>Connected</Text>
                </View>
            </View>

            <FlatList
                data={conversations}
                renderItem={renderChatRow}
                keyExtractor={(item) => item.customer_phone}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchConversations(); }} tintColor={COLORS.primary} />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyState}>
                            <MessageSquare size={60} color={COLORS.textSecondary + '40'} />
                            <Text style={styles.emptyTitle}>No Conversations</Text>
                            <Text style={styles.emptySubtitle}>When customers message your stores, they will appear here.</Text>
                        </View>
                    ) : null
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { padding: SPACING.md, paddingTop: 60, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary },
    onlineBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10b98120', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', marginRight: 6 },
    onlineText: { fontSize: 10, color: '#10b981', fontWeight: 'bold' },
    listContent: { paddingBottom: 100 },
    chatRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card,
        padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.secondary + '30', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    avatarText: { fontSize: 20, color: COLORS.secondary, fontWeight: 'bold' },
    chatInfo: { flex: 1, marginRight: 10 },
    infoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    customerName: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
    timeText: { fontSize: 12, color: COLORS.textSecondary },
    infoBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    lastMessage: { fontSize: 14, color: COLORS.textSecondary, flex: 1 },
    unreadBadge: { backgroundColor: COLORS.primary, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    unreadText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    emptyState: { alignItems: 'center', marginTop: 100, padding: 40 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, marginTop: 16 },
    emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8 },
});

export default ChatListScreen;
