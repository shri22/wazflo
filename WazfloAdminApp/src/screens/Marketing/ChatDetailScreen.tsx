import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ActivityIndicator,
} from 'react-native';
import { ArrowLeft, Send, Phone } from 'lucide-react-native';
import { COLORS, SPACING, ROUNDED } from '../../constants/Theme';
import api from '../../services/api';

const ChatDetailScreen = ({ route, navigation }: any) => {
    const { phone, name } = route.params;
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        fetchHistory();
        const interval = setInterval(fetchHistory, 5000); // Polling every 5s
        return () => clearInterval(interval);
    }, []);

    const fetchHistory = async () => {
        try {
            const response = await api.get(`/platform/messages/${phone}`);
            setMessages(response.data.data.reverse()); // Show newest at bottom
        } catch (error) {
            console.error('History Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        const tempText = inputText;
        setInputText('');

        try {
            await api.post('/platform/messages/send', {
                to: phone,
                text: tempText
            });
            fetchHistory();
        } catch (error) {
            console.error('Send Error:', error);
        }
    };

    const renderMessage = ({ item }: { item: any }) => {
        const isClient = item.sender === 'client' || item.sender === 'bot';
        return (
            <View style={[styles.messageWrapper, isClient ? styles.clientWrapper : styles.customerWrapper]}>
                <View style={[styles.messageBubble, isClient ? styles.clientBubble : styles.customerBubble]}>
                    <Text style={[styles.messageText, isClient ? styles.clientText : styles.customerText]}>
                        {item.message_text}
                    </Text>
                    <Text style={[styles.messageTime, isClient ? styles.clientTime : styles.customerTime]}>
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerName}>{name || phone}</Text>
                    <Text style={styles.headerStatus}>WhatsApp Interactive</Text>
                </View>
                <TouchableOpacity style={styles.callBtn}>
                    <Phone size={20} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.messageList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />
            )}

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        placeholderTextColor={COLORS.textSecondary}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, !inputText.trim() && { backgroundColor: COLORS.textSecondary + '40' }]}
                        onPress={handleSendMessage}
                        disabled={!inputText.trim()}
                    >
                        <Send size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card,
        paddingHorizontal: SPACING.md, paddingTop: 60, paddingBottom: 15,
        borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    backBtn: { marginRight: 15 },
    headerInfo: { flex: 1 },
    headerName: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
    headerStatus: { fontSize: 11, color: '#10b981' },
    callBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary + '10', justifyContent: 'center', alignItems: 'center' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    messageList: { padding: 15, paddingBottom: 30 },
    messageWrapper: { marginBottom: 15, maxWidth: '80%' },
    clientWrapper: { alignSelf: 'flex-end' },
    customerWrapper: { alignSelf: 'flex-start' },
    messageBubble: { padding: 12, borderRadius: 18 },
    clientBubble: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
    customerBubble: { backgroundColor: COLORS.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.border },
    messageText: { fontSize: 15, lineHeight: 20 },
    clientText: { color: '#fff' },
    customerText: { color: COLORS.textPrimary },
    messageTime: { fontSize: 9, marginTop: 4, alignSelf: 'flex-end' },
    clientTime: { color: 'rgba(255,255,255,0.7)' },
    customerTime: { color: COLORS.textSecondary },
    inputContainer: {
        flexDirection: 'row', alignItems: 'flex-end', padding: 12,
        backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border,
    },
    input: {
        flex: 1, backgroundColor: COLORS.background, borderRadius: 25,
        paddingHorizontal: 16, paddingVertical: 10, maxHeight: 100,
        color: COLORS.textPrimary, fontSize: 16, marginRight: 10,
        borderWidth: 1, borderColor: COLORS.border,
    },
    sendBtn: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    },
});

export default ChatDetailScreen;
