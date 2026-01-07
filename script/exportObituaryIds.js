// ==========================================
// scripts/exportObituaryIds.js
// Exports all obituary IDs to different formats
// Run: node scripts/exportObituaryIds.js
// ==========================================

const mongoose = require('mongoose');
const fs = require('fs');
const Obituary = require('../models/obituary');

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('✓ Connected to MongoDB\n'))
    .catch(err => {
        console.error('✗ MongoDB connection error:', err);
        process.exit(1);
    });

async function exportObituaryIds() {
    console.log('==========================================');
    console.log('EXPORTING OBITUARY IDs');
    console.log('==========================================\n');

    // Get all obituaries
    const obituaries = await Obituary.find()
        .select('_id firstName lastName birthDate deathDate location slug')
        .sort({ createdAt: -1 });

    console.log(`✓ Found ${obituaries.length} obituaries\n`);

    if (obituaries.length === 0) {
        console.error('✗ No obituaries found!');
        process.exit(1);
    }

    // Create exports directory
    if (!fs.existsSync('./exports')) {
        fs.mkdirSync('./exports');
    }

    // ==========================================
    // 1. JSON Format (Full Details)
    // ==========================================
    const jsonData = obituaries.map(obit => ({
        _id: obit._id.toString(),
        firstName: obit.firstName,
        lastName: obit.lastName,
        fullName: `${obit.firstName} ${obit.lastName}`,
        birthDate: obit.birthDate,
        deathDate: obit.deathDate,
        location: obit.location,
        slug: obit.slug
    }));

    fs.writeFileSync(
        './exports/obituaries-full.json',
        JSON.stringify(jsonData, null, 2)
    );
    console.log('✓ Exported: ./exports/obituaries-full.json (full details)');

    // ==========================================
    // 2. Simple IDs Array (JavaScript)
    // ==========================================
    const idsArray = obituaries.map(obit => obit._id.toString());

    fs.writeFileSync(
        './exports/obituary-ids.js',
        `// Obituary IDs - Total: ${idsArray.length}\nconst obituaryIds = ${JSON.stringify(idsArray, null, 2)};\n\nmodule.exports = obituaryIds;`
    );
    console.log('✓ Exported: ./exports/obituary-ids.js (IDs array)');

    // ==========================================
    // 3. CSV Format (ID, Name, Location)
    // ==========================================
    let csvContent = 'ID,FIRST_NAME,LAST_NAME,FULL_NAME,LOCATION,SLUG\n';
    obituaries.forEach(obit => {
        csvContent += `${obit._id},"${obit.firstName}","${obit.lastName}","${obit.firstName} ${obit.lastName}","${obit.location || 'N/A'}","${obit.slug || 'N/A'}"\n`;
    });

    fs.writeFileSync('./exports/obituaries-list.csv', csvContent);
    console.log('✓ Exported: ./exports/obituaries-list.csv (CSV format)');

    // ==========================================
    // 4. Readable Text File (for manual reference)
    // ==========================================
    let textContent = '==========================================\n';
    textContent += `OBITUARY IDs - Total: ${obituaries.length}\n`;
    textContent += '==========================================\n\n';

    obituaries.forEach((obit, index) => {
        textContent += `${index + 1}. ${obit._id}\n`;
        textContent += `   Name: ${obit.firstName} ${obit.lastName}\n`;
        textContent += `   Location: ${obit.location || 'N/A'}\n`;
        if (obit.slug) textContent += `   Slug: ${obit.slug}\n`;
        textContent += '\n';
    });

    fs.writeFileSync('./exports/obituaries-readable.txt', textContent);
    console.log('✓ Exported: ./exports/obituaries-readable.txt (readable format)');

    // ==========================================
    // 5. ID Mapping Object (old ID to new ID)
    // ==========================================
    // For manual mapping
    const mappingTemplate = {};
    obituaries.forEach((obit, index) => {
        mappingTemplate[`OLD_ID_${index + 1}`] = obit._id.toString();
    });

    fs.writeFileSync(
        './exports/id-mapping-template.json',
        JSON.stringify(mappingTemplate, null, 2)
    );
    console.log('✓ Exported: ./exports/id-mapping-template.json (mapping template)');

    // ==========================================
    // 6. MongoDB Shell Commands
    // ==========================================
    let mongoCommands = '// Copy these commands to use in MongoDB shell\n\n';
    mongoCommands += 'use test\n\n';
    mongoCommands += '// Get specific obituary:\n';
    mongoCommands += `db.obituaries.findOne({_id: ObjectId("${obituaries[0]._id}")})\n\n`;
    mongoCommands += '// Get all obituary IDs:\n';
    mongoCommands += 'db.obituaries.find({}, {_id: 1, firstName: 1, lastName: 1})\n';

    fs.writeFileSync('./exports/mongodb-commands.txt', mongoCommands);
    console.log('✓ Exported: ./exports/mongodb-commands.txt (MongoDB commands)');

    // ==========================================
    // Display Summary
    // ==========================================
    console.log('\n==========================================');
    console.log('EXPORT SUMMARY');
    console.log('==========================================');
    console.log(`Total Obituaries: ${obituaries.length}`);
    console.log('\nFirst 10 IDs:');
    obituaries.slice(0, 10).forEach((obit, index) => {
        console.log(`  ${index + 1}. ${obit._id} - ${obit.firstName} ${obit.lastName}`);
    });

    if (obituaries.length > 10) {
        console.log(`  ... and ${obituaries.length - 10} more`);
    }

    console.log('\n==========================================');
    console.log('FILES CREATED IN ./exports/');
    console.log('==========================================');
    console.log('1. obituaries-full.json - Complete details');
    console.log('2. obituary-ids.js - JavaScript array');
    console.log('3. obituaries-list.csv - CSV format');
    console.log('4. obituaries-readable.txt - Human readable');
    console.log('5. id-mapping-template.json - For mapping');
    console.log('6. mongodb-commands.txt - Mongo commands');
    console.log('==========================================\n');

    // ==========================================
    // Sample usage in code
    // ==========================================
    console.log('📝 HOW TO USE IN YOUR CODE:\n');
    console.log('// Option 1: Import the IDs array');
    console.log("const obituaryIds = require('./exports/obituary-ids.js');\n");
    console.log('// Option 2: Read JSON file');
    console.log("const obituaries = require('./exports/obituaries-full.json');\n");
    console.log('// Then map over them:');
    console.log('obituaries.forEach(obit => {');
    console.log('  console.log(`ID: ${obit._id}, Name: ${obit.fullName}`);');
    console.log('});\n');

    process.exit(0);
}

exportObituaryIds().catch(err => {
    console.error('✗ Error:', err);
    process.exit(1);
});