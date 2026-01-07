const chalk = require('chalk');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');

const setupDB = require('./db');
const { ROLES } = require('../constants');
const User = require('../models/user');
const Brand = require('../models/brand');
const Product = require('../models/product');
const Category = require('../models/category');

const args = process.argv.slice(2);
const email = args[0];
const password = args[1];

const NUM_BRANDS = 10;
const NUM_CATEGORIES = 10;

const IMAGE_URL =
  'https://d1mz4ew6y7glru.cloudfront.net/products/L1080304memtree.webp';

/* ===============================
   MEMORIAL TREE PRODUCTS
================================ */
const memorialProducts = [
  {
    sku: 'TREE-MEM-001',
    name: 'Memorial Tree',
    imageUrl: IMAGE_URL,
    description:
      'Show the family you care by planting a single tree in the area of greatest need.',
    variants: [
      { name: 'Single Tree', quantity: 1, price: 39.95, isDefault: true },
      { name: 'Grove of 3', quantity: 3, price: 109.95 },
      { name: 'Grove of 5', quantity: 5, price: 179.95 },
      { name: 'Grove of 10', quantity: 10, price: 349.95 },
      { name: 'Grove of 25', quantity: 25, price: 799.95 }
    ],
    isActive: true
  },
  {
    sku: 'TREE-LIVE-002',
    name: 'Living Tribute Tree',
    imageUrl: IMAGE_URL,
    description: 'A living tribute planted in honor of your loved one.',
    variants: [
      { name: 'Single Tree', quantity: 1, price: 44.95, isDefault: true },
      { name: 'Grove of 3', quantity: 3, price: 119.95 },
      { name: 'Grove of 5', quantity: 5, price: 189.95 }
    ],
    isActive: true
  },
  {
    sku: 'TREE-FRST-003',
    name: 'Forest Restoration Trees',
    imageUrl: IMAGE_URL,
    description: 'Support forest restoration efforts.',
    variants: [
      { name: 'Single Tree', quantity: 1, price: 29.95, isDefault: true },
      { name: 'Grove of 10', quantity: 10, price: 249.95 },
      { name: 'Grove of 50', quantity: 50, price: 1099.95 }
    ],
    isActive: true
  },
  {
    sku: 'TREE-OAK-004',
    name: 'Legacy Oak Tree',
    imageUrl: IMAGE_URL,
    description: 'A strong oak planted as a lasting legacy.',
    variants: [
      { name: 'Single Tree', quantity: 1, price: 59.95, isDefault: true },
      { name: 'Grove of 5', quantity: 5, price: 269.95 },
      { name: 'Grove of 10', quantity: 10, price: 499.95 }
    ],
    isActive: true
  },
  {
    sku: 'TREE-REM-005',
    name: 'Remembrance Grove',
    imageUrl: IMAGE_URL,
    description: 'Create a remembrance grove in memory of a loved one.',
    variants: [
      { name: 'Grove of 3', quantity: 3, price: 129.95, isDefault: true },
      { name: 'Grove of 10', quantity: 10, price: 379.95 },
      { name: 'Grove of 25', quantity: 25, price: 849.95 }
    ],
    isActive: true
  }
];

/* ===============================
   SEED DB
================================ */
const seedDB = async () => {
  try {
    console.log(`${chalk.blue('✓')} Seed started`);

    if (!email || !password) throw new Error('Missing arguments');

    /* ---------- Admin ---------- */
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      const user = new User({
        email,
        password,
        firstName: 'admin',
        lastName: 'admin',
        role: ROLES.Admin
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
      await user.save();

      console.log(`${chalk.green('✓')} Admin user created`);
    }

    /* ---------- Categories ---------- */
    let categories = [];
    const categoriesCount = await Category.countDocuments();

    if (categoriesCount < NUM_CATEGORIES) {
      for (let i = 0; i < NUM_CATEGORIES; i++) {
        const category = new Category({
          name: faker.commerce.department(),
          description: faker.lorem.sentence(),
          isActive: true
        });
        await category.save();
        categories.push(category);
      }
      console.log(`${chalk.green('✓')} Categories seeded`);
    } else {
      categories = await Category.find();
    }

    /* ---------- Brands ---------- */
    const brandsCount = await Brand.countDocuments();
    if (brandsCount < NUM_BRANDS) {
      for (let i = 0; i < NUM_BRANDS; i++) {
        const brand = new Brand({
          name: faker.company.name(),
          description: faker.lorem.sentence(),
          isActive: true
        });
        await brand.save();
      }
      console.log(`${chalk.green('✓')} Brands seeded`);
    }

    /* ---------- DELETE ALL PRODUCTS ---------- */
    await Product.deleteMany({});
    console.log(`${chalk.red('✓')} All existing products deleted`);

    /* ---------- INSERT MEMORIAL PRODUCTS ---------- */
    await Product.insertMany(memorialProducts);
    console.log(`${chalk.green('✓')} Memorial Tree products seeded`);
  } catch (error) {
    console.log(`${chalk.red('x')} Error while seeding`);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log(`${chalk.blue('✓')} Database connection closed`);
  }
};

/* ===============================
   RUN
================================ */
(async () => {
  try {
    await setupDB();
    await seedDB();
  } catch (error) {
    console.error(error.message);
  }
})();
