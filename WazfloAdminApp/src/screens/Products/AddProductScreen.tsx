import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Camera, Upload, ArrowLeft, Save } from 'lucide-react-native';
import { createProduct } from '../../services/api';
import { COLORS, SPACING, ROUNDED } from '../../constants/Theme';

import * as ImagePicker from 'expo-image-picker';

const AddProductScreen = ({ navigation }: any) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        Alert.alert('Image Selection', 'Camera or Gallery?', [
            {
                text: 'Camera',
                onPress: async () => {
                    const result = await ImagePicker.launchCameraAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsEditing: true,
                        aspect: [4, 3],
                        quality: 0.8,
                    });
                    if (!result.canceled) {
                        setImage(result.assets[0].uri);
                    }
                }
            },
            {
                text: 'Gallery',
                onPress: async () => {
                    const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsEditing: true,
                        aspect: [4, 3],
                        quality: 0.8,
                    });
                    if (!result.canceled) {
                        setImage(result.assets[0].uri);
                    }
                }
            },
            { text: 'Cancel', style: 'cancel' }
        ]);
    };

    const handleSave = async () => {
        if (!name || !price) {
            Alert.alert('Error', 'Product Name and Price are required');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('price', price);
            formData.append('description', description);
            formData.append('category', category);

            if (image) {
                const filename = image.split('/').pop();
                const match = /\.(\w+)$/.exec(filename || '');
                const type = match ? `image/${match[1]}` : `image`;

                // @ts-ignore
                formData.append('image', { uri: image, name: filename, type });
            }

            await createProduct(formData);
            Alert.alert('Success', 'Product added and synced to WhatsApp!');
            navigation.goBack();
        } catch (error) {
            console.error('Add Product Error:', error);
            Alert.alert('Error', 'Failed to add product. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add New Product</Text>
                <TouchableOpacity onPress={handleSave} disabled={loading}>
                    {loading ? <ActivityIndicator color={COLORS.primary} /> : <Save size={24} color={COLORS.primary} />}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <TouchableOpacity style={styles.imageSelector} onPress={pickImage}>
                    {image ? (
                        <Image source={{ uri: image }} style={styles.previewImage} />
                    ) : (
                        <View style={styles.placeholder}>
                            <Camera size={40} color={COLORS.textSecondary} />
                            <Text style={styles.placeholderText}>Tap to snap product photo</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <View style={styles.form}>
                    <Text style={styles.label}>Product Name *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Red Designer Saree"
                        placeholderTextColor={COLORS.textSecondary + '80'}
                        value={name}
                        onChangeText={setName}
                    />

                    <Text style={styles.label}>Base Price (₹) *</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="0.00"
                        placeholderTextColor={COLORS.textSecondary + '80'}
                        value={price}
                        onChangeText={setPrice}
                    />

                    <Text style={styles.label}>Category</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Clothing"
                        placeholderTextColor={COLORS.textSecondary + '80'}
                        value={category}
                        onChangeText={setCategory}
                    />

                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]}
                        multiline
                        placeholder="Tell your customers about this product..."
                        placeholderTextColor={COLORS.textSecondary + '80'}
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                <TouchableOpacity style={styles.syncBtn} onPress={handleSave} disabled={loading}>
                    <Text style={styles.syncBtnText}>List on WhatsApp</Text>
                </TouchableOpacity>
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
    content: { padding: SPACING.lg },
    imageSelector: {
        width: '100%', height: 250, backgroundColor: COLORS.card, borderRadius: ROUNDED.lg,
        borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed',
        justifyContent: 'center', alignItems: 'center', marginBottom: 24, overflow: 'hidden',
    },
    previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    placeholder: { alignItems: 'center' },
    placeholderText: { color: COLORS.textSecondary, marginTop: 12, fontSize: 16 },
    form: { gap: 16 },
    label: { fontSize: 14, fontWeight: 'bold', color: COLORS.textSecondary, marginBottom: -8 },
    input: {
        backgroundColor: COLORS.card, height: 52, borderRadius: ROUNDED.md,
        borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16,
        color: COLORS.textPrimary, fontSize: 16,
    },
    syncBtn: {
        backgroundColor: COLORS.primary, height: 54, borderRadius: ROUNDED.md,
        justifyContent: 'center', alignItems: 'center', marginTop: 32,
        shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
    },
    syncBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default AddProductScreen;
