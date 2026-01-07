
const Product = require('../models/product');

const products = [
    {
        name: 'Memorial Tree',
        sku: 'TREE-MEM-001',
        type: 'tree',
        imageUrl: '/images/products/memorial-tree.png',
        description:
            'Show the family you care by planting a tree in the area of greatest need. Includes a certificate and tribute listing.',
        variants: [
            { name: 'Single Tree', quantity: 1, price: 39.95, isDefault: true },
            { name: 'Grove of 3', quantity: 3, price: 109.95 },
            { name: 'Grove of 5', quantity: 5, price: 179.95 },
            { name: 'Grove of 10', quantity: 10, price: 349.95 },
            { name: 'Grove of 25', quantity: 25, price: 799.95 }
        ]
    },

    {
        name: 'Living Tribute Tree',
        sku: 'TREE-LIVE-002',
        type: 'tree',
        imageUrl: '/images/products/living-tribute-tree.png',
        description:
            'A living tribute that grows in honor of your loved one.',
        variants: [
            { name: 'Single Tree', quantity: 1, price: 44.95, isDefault: true },
            { name: 'Grove of 3', quantity: 3, price: 119.95 },
            { name: 'Grove of 5', quantity: 5, price: 189.95 }
        ]
    },

    {
        name: 'Forest Restoration Trees',
        sku: 'TREE-FOREST-003',
        type: 'tree',
        imageUrl: '/images/products/forest-restoration.png',
        description:
            'Support reforestation efforts in areas affected by deforestation.',
        variants: [
            { name: 'Single Tree', quantity: 1, price: 29.95, isDefault: true },
            { name: 'Grove of 10', quantity: 10, price: 249.95 },
            { name: 'Grove of 50', quantity: 50, price: 1099.95 }
        ]
    },

    {
        name: 'Legacy Oak Tree',
        sku: 'TREE-OAK-004',
        type: 'tree',
        imageUrl: '/images/products/legacy-oak.png',
        description:
            'A strong oak planted to represent a lasting legacy.',
        variants: [
            { name: 'Single Tree', quantity: 1, price: 59.95, isDefault: true },
            { name: 'Grove of 5', quantity: 5, price: 269.95 },
            { name: 'Grove of 10', quantity: 10, price: 499.95 }
        ]
    },

    {
        name: 'Remembrance Grove',
        sku: 'TREE-REM-005',
        type: 'tree',
        imageUrl: '/images/products/remembrance-grove.png',
        description:
            'Plant a remembrance grove in honor of a loved one’s life.',
        variants: [
            { name: 'Grove of 3', quantity: 3, price: 129.95, isDefault: true },
            { name: 'Grove of 10', quantity: 10, price: 379.95 },
            { name: 'Grove of 25', quantity: 25, price: 849.95 }
        ]
    }
];

async function seedProducts() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        await Product.deleteMany({});
        await Product.insertMany(products);
        console.log('✅ Products seeded successfully');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

seedProducts();
