/**
 * Database Migration Script - Obituaries
 * Converts null photo and backgroundImage fields to empty strings
 * 
 * This script will:
 * - Find all obituaries with null photo or backgroundImage
 * - Convert null values to empty strings ""
 */

const mongoose = require('mongoose');
const Obituary = require('../models/obituary'); // Adjust path to your obituary model

// Your MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://shahzadrasool443_db_user:KjWPfl2MBNeMvU4K@cluster-mern.o0wfyvn.mongodb.net/?appName=Cluster-mern';

async function fixObituaryNullFields() {
    try {
        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB successfully!\n');

        // Find all obituaries
        console.log('🔍 Finding all obituaries...');
        const obituaries = await Obituary.find({}).lean();
        console.log(`📦 Found ${obituaries.length} obituaries\n`);

        let fixedCount = 0;
        let alreadyCorrectCount = 0;

        // Process each obituary
        for (const obituary of obituaries) {
            try {
                console.log(`\n📝 Processing: ${obituary.firstName} ${obituary.lastName} (ID: ${obituary._id})`);

                let needsUpdate = false;
                const updates = {};

                // Check photo field
                if (obituary.photo === null) {
                    console.log('   🔧 Photo is null, converting to empty string');
                    updates.photo = '';
                    needsUpdate = true;
                } else {
                    console.log('   ✓ Photo is already set or empty string');
                }

                // Check backgroundImage field
                if (obituary.backgroundImage === null) {
                    console.log('   🔧 BackgroundImage is null, converting to empty string');
                    updates.backgroundImage = '';
                    needsUpdate = true;
                } else {
                    console.log('   ✓ BackgroundImage is already set or empty string');
                }

                // Update the obituary if needed
                if (needsUpdate) {
                    await Obituary.updateOne(
                        { _id: obituary._id },
                        { $set: updates }
                    );
                    console.log('   ✅ Updated successfully!');
                    fixedCount++;
                } else {
                    console.log('   ℹ️  No updates needed');
                    alreadyCorrectCount++;
                }

            } catch (error) {
                console.error(`   ❌ Error processing obituary ${obituary._id}:`, error.message);
            }
        }

        // Print summary
        console.log('\n' + '='.repeat(50));
        console.log('📊 MIGRATION SUMMARY');
        console.log('='.repeat(50));
        console.log(`Total obituaries processed: ${obituaries.length}`);
        console.log(`✅ Obituaries fixed: ${fixedCount}`);
        console.log(`ℹ️  Already correct: ${alreadyCorrectCount}`);
        console.log('='.repeat(50) + '\n');

        // Verify the changes
        if (fixedCount > 0) {
            console.log('🔍 Verifying changes...');
            const verifiedObituary = await Obituary.findOne({
                _id: obituaries[0]._id
            });

            if (verifiedObituary) {
                console.log('\n✅ Sample obituary after update:');
                console.log(`   Name: ${verifiedObituary.firstName} ${verifiedObituary.lastName}`);
                console.log(`   Photo: "${verifiedObituary.photo}"`);
                console.log(`   BackgroundImage: "${verifiedObituary.backgroundImage}"`);
            }
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        // Close MongoDB connection
        console.log('\n🔌 Closing MongoDB connection...');
        await mongoose.connection.close();
        console.log('✅ Connection closed. Migration complete!');
    }
}

// Run the migration
fixObituaryNullFields();