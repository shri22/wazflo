import { createTables } from '../models/schema.js';

const initDatabase = async () => {
    console.log('🔧 Initializing database...');
    await createTables();
    console.log('✅ Database initialized successfully!');
    process.exit(0);
};

initDatabase().catch(error => {
    console.error('Error initializing database:', error);
    process.exit(1);
});
