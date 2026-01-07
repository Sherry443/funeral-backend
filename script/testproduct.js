const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Product = require('../../server/models/product');
const Brand = require('../../server/models/brand');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://shahzadrasool443_db_user:KjWPfl2MBNeMvU4K@cluster-mern.o0wfyvn.mongodb.net/?appName=Cluster-mern', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', async () => {
    console.log('✓ Connected to MongoDB\n');

    try {
        // TEST 1: Check if product exists with slug
        console.log('TEST 1: Checking for product with slug "azalea-plant"...');
        const productBySlug = await Product.findOne({ slug: 'azalea-plant' });

        if (!productBySlug) {
            console.log('✗ No product found with slug "azalea-plant"');
            console.log('\nAvailable products:');
            const allProducts = await Product.find({}).limit(10);
            allProducts.forEach(p => {
                console.log(`  - ${p.name} (slug: ${p.slug}, active: ${p.isActive})`);
            });
        } else {
            console.log('✓ Product found:', productBySlug.name);
            console.log('  - ID:', productBySlug._id);
            console.log('  - Slug:', productBySlug.slug);
            console.log('  - Active:', productBySlug.isActive);
            console.log('  - Type:', productBySlug.type);
            console.log('  - Brand ID:', productBySlug.brand);
        }

        // TEST 2: Check brand if product exists
        if (productBySlug && productBySlug.brand) {
            console.log('\nTEST 2: Checking brand...');
            const brand = await Brand.findById(productBySlug.brand);

            if (!brand) {
                console.log('✗ Brand not found (this will cause 404)');
            } else {
                console.log('✓ Brand found:', brand.name);
                console.log('  - Brand Active:', brand.isActive);

                if (!brand.isActive) {
                    console.log('✗ Brand is inactive (this will cause 404)');
                }
            }
        } else if (productBySlug && !productBySlug.brand) {
            console.log('\n✗ Product has no brand (this will cause 404)');
        }

        // TEST 3: Simulate the exact query from your route
        if (productBySlug) {
            console.log('\nTEST 3: Simulating exact route query...');
            const productDoc = await Product.findOne({
                slug: 'azalea-plant',
                isActive: true
            }).populate({
                path: 'brand',
                select: 'name isActive slug'
            });

            if (!productDoc) {
                console.log('✗ Query failed (product might be inactive)');
            } else {
                const hasNoBrand = productDoc?.brand === null || productDoc?.brand?.isActive === false;

                if (hasNoBrand) {
                    console.log('✗ Product would return 404 due to brand issue');
                    console.log('  - Brand is null:', productDoc.brand === null);
                    console.log('  - Brand inactive:', productDoc?.brand?.isActive === false);
                } else {
                    console.log('✓ Query successful! Product should be accessible');
                    console.log('\nFull product data:');
                    console.log(JSON.stringify(productDoc, null, 2));
                }
            }
        }

        // TEST 4: Create a test product if none exists
        if (!productBySlug) {
            console.log('\n\nWould you like to create a test product? (Modify script to enable)');
            console.log('Uncomment the createTestProduct() function below.');
        }

    } catch (error) {
        console.error('Error during tests:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✓ Database connection closed');
    }
});

// Uncomment this function to create a test product
async function createTestProduct() {
    try {
        // First, get or create a brand
        let brand = await Brand.findOne({ isActive: true });

        if (!brand) {
            console.log('Creating a test brand...');
            brand = await Brand.create({
                name: 'Memorial Gardens',
                slug: 'memorial-gardens',
                isActive: true,
                description: 'Beautiful memorial products'
            });
            console.log('✓ Test brand created');
        }

        // Create test product
        const testProduct = await Product.create({
            sku: 'AZA-PLANT-001',
            name: 'Azalea Plant',
            slug: 'azalea-plant',
            type: 'flower',
            description: 'Beautiful azalea plant for memorial tributes',
            highlights: [
                'Vibrant blooms',
                'Easy to care for',
                'Lasting tribute'
            ],
            images: [{
                url: 'https://example.com/azalea.jpg',
                key: 'azalea-key',
                alt: 'Azalea Plant'
            }],
            variants: [
                {
                    name: 'Single Plant',
                    quantity: 1,
                    price: 49.99,
                    sku: 'AZA-PLANT-001-S',
                    isDefault: true,
                    isActive: true
                }
            ],
            taxable: true,
            brand: brand._id,
            isActive: true
        });

        console.log('✓ Test product created successfully!');
        console.log('Product ID:', testProduct._id);
        console.log('Access at: http://localhost:3000/api/product/item/azalea-plant');

        return testProduct;
    } catch (error) {
        console.error('Error creating test product:', error);
    }
}

// To create test product, uncomment this line:
// db.once('open', createTestProduct);