import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase } from '../config/database.js';
import { ensureDefaultAdminUser } from '../services/adminBootstrap.js';
import { seedCatalogIfEmpty } from '../data/seedCatalog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', '..', '.env');

dotenv.config({ path: envPath });

const run = async () => {
  try {
    await initializeDatabase();
    await ensureDefaultAdminUser();
    const summary = await seedCatalogIfEmpty();

    console.log('Catalog seed complete:', summary);
    process.exit(0);
  } catch (error) {
    console.error('Catalog seed failed:', error);
    process.exit(1);
  }
};

void run();
