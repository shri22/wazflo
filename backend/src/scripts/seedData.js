import { Product, Variant } from '../models/index.js';

const seedData = async () => {
    console.log('🌱 Seeding database with sample data...');

    // Sample products
    const products = [
        {
            name: 'Premium Cotton T-Shirt',
            description: 'Comfortable 100% cotton t-shirt, perfect for everyday wear',
            base_price: 599,
            image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
            category: 'Clothing',
            is_active: 1
        },
        {
            name: 'Wireless Bluetooth Headphones',
            description: 'High-quality wireless headphones with noise cancellation',
            base_price: 2999,
            image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
            category: 'Electronics',
            is_active: 1
        },
        {
            name: 'Stainless Steel Water Bottle',
            description: 'Eco-friendly insulated water bottle, keeps drinks cold for 24 hours',
            base_price: 799,
            image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500',
            category: 'Accessories',
            is_active: 1
        },
        {
            name: 'Leather Wallet',
            description: 'Genuine leather wallet with multiple card slots',
            base_price: 1299,
            image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500',
            category: 'Accessories',
            is_active: 1
        },
        {
            name: 'Smart Watch',
            description: 'Fitness tracking smartwatch with heart rate monitor',
            base_price: 4999,
            image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
            category: 'Electronics',
            is_active: 1
        }
    ];

    // Create products
    for (const product of products) {
        const productId = await Product.create(product);
        console.log(`✅ Created product: ${product.name} (ID: ${productId})`);

        // Add variants for first product (T-Shirt)
        if (product.name === 'Premium Cotton T-Shirt') {
            const sizes = ['S', 'M', 'L', 'XL'];
            const colors = ['Black', 'White', 'Navy Blue'];

            for (const color of colors) {
                for (const size of sizes) {
                    await Variant.create({
                        product_id: productId,
                        name: `${color} - ${size}`,
                        sku: `TSHIRT-${color.toUpperCase().replace(' ', '')}-${size}`,
                        price: 599,
                        stock_quantity: Math.floor(Math.random() * 50) + 10,
                        attributes: { color, size }
                    });
                }
            }

            console.log(`  ↳ Added ${sizes.length * colors.length} variants`);
        }

        // Add variants for headphones
        if (product.name === 'Wireless Bluetooth Headphones') {
            const colors = ['Black', 'White', 'Silver'];

            for (const color of colors) {
                await Variant.create({
                    product_id: productId,
                    name: color,
                    sku: `HEADPHONE-${color.toUpperCase()}`,
                    price: 2999,
                    stock_quantity: Math.floor(Math.random() * 30) + 5,
                    attributes: { color }
                });
            }

            console.log(`  ↳ Added ${colors.length} variants`);
        }

        // Add variants for water bottle
        if (product.name === 'Stainless Steel Water Bottle') {
            const sizes = ['500ml', '750ml', '1000ml'];

            for (const size of sizes) {
                await Variant.create({
                    product_id: productId,
                    name: size,
                    sku: `BOTTLE-${size.toUpperCase()}`,
                    price: size === '500ml' ? 799 : size === '750ml' ? 899 : 999,
                    stock_quantity: Math.floor(Math.random() * 40) + 10,
                    attributes: { size }
                });
            }

            console.log(`  ↳ Added ${sizes.length} variants`);
        }
    }

    console.log('\n✅ Database seeded successfully!');
    console.log(`📊 Total products: ${products.length}`);
    process.exit(0);
};

seedData().catch(error => {
    console.error('Error seeding database:', error);
    process.exit(1);
});
