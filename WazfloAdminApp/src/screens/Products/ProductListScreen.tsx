import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
    Share,
} from 'react-native';
import { Plus, Share2, Edit2, Trash2 } from 'lucide-react-native';
import { getProducts } from '../../services/api';
import { COLORS, SPACING, ROUNDED } from '../../constants/Theme';

const ProductListScreen = ({ navigation }: any) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchProducts = async () => {
        try {
            const response = await getProducts();
            setProducts(response.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleResellerCopy = (product: any) => {
        const caption = `🌟 *New Collection: ${product.name}*\n\n${product.description || 'Premium quality fabric, latest design.'}\n\n✅ *Quality check done*\n✅ *Ready to dispatch*\n\n👇 *Reply for best wholesale rates!*`;

        Share.share({
            message: caption,
        });
    };

    const renderProductItem = ({ item }: any) => (
        <View style={styles.productCard}>
            <Image
                source={{ uri: item.image_url || 'https://via.placeholder.com/150' }}
                style={styles.productImage}
            />
            <View style={styles.productInfo}>
                <View>
                    <Text style={styles.productName}>{item.name}</Text>
                    <Text style={styles.productCategory}>{item.category || 'General'}</Text>
                    <Text style={styles.productPrice}>₹{item.base_price}</Text>
                </View>
                <View style={styles.productActions}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: COLORS.secondary + '20' }]}
                        onPress={() => handleResellerCopy(item)}
                    >
                        <Share2 size={18} color={COLORS.secondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.primary + '20' }]}>
                        <Edit2 size={18} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Catalog</Text>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => navigation.navigate('AddProduct')}
                >
                    <Plus size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={products}
                    renderItem={renderProductItem}
                    keyExtractor={(item: any) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    numColumns={2}
                    columnWrapperStyle={{ gap: 12 }}
                />
            )}
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
    title: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary },
    addBtn: { backgroundColor: COLORS.primary, padding: 8, borderRadius: 12 },
    listContent: { padding: SPACING.md },
    productCard: {
        backgroundColor: COLORS.card, borderRadius: ROUNDED.lg, overflow: 'hidden',
        marginBottom: 16, width: '48%', borderWidth: 1, borderColor: COLORS.border,
    },
    productImage: { width: '100%', height: 150, backgroundColor: '#2d3748' },
    productInfo: { padding: 12, justifyContent: 'space-between', flex: 1 },
    productName: { fontSize: 14, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 2 },
    productCategory: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
    productPrice: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, marginBottom: 8 },
    productActions: { flexDirection: 'row', gap: 8 },
    actionBtn: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
});

export default ProductListScreen;
