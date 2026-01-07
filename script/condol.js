// ==========================================
// scripts/resetAndMapCondolences.js
// This deletes all condolences and creates new ones with correct obituary mappings
// Run: node scripts/resetAndMapCondolences.js
// ==========================================

const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const Condolence = require('../models/Condolence');
const Obituary = require('../models/Obituary');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://shahzadrasool443_db_user:KjWPfl2MBNeMvU4K@cluster-mern.o0wfyvn.mongodb.net/?appName=Cluster-mern';

// ID Mapping from your document (oldId -> newId)
const ID_MAPPING = {
    '1349226': '6956cd2f8015332b00933d39',
    '1349227': '6956cd2e8015332b00933d37',
    '1349228': '6956cd2f8015332b00933d3a',
    '1349229': '6956cd2f8015332b00933d3b',
    '1521139': '6956cd2f8015332b00933d3c',
    '1521147': '6956cd2e8015332b00933d38',
    '1524864': '6956cd2f8015332b00933d3d',
    '1527011': '6956cd2f8015332b00933d3e',
    '1536116': '6956cd308015332b00933d3f',
    '1540614': '6956cd308015332b00933d40',
    '1541678': '6956cd308015332b00933d41',
    // '1542011': NO MATCH - Jose "Chris" Barrera
    '1550165': '6956cd308015332b00933d43',
    '1550410': '6956cd308015332b00933d44',
    '1551328': '6956cd308015332b00933d45',
    '1552166': '6956cd318015332b00933d46',
    '1554563': '6956cd318015332b00933d47',
    '1555458': '6956cd318015332b00933d49',
    '1559253': '6956cd318015332b00933d48',
    '1560489': '6956cd318015332b00933d4a',
    '1561102': '6956cd318015332b00933d4b',
    '1561872': '6956cd328015332b00933d4d',
    '1561873': '6956cd328015332b00933d4c',
    '1563385': '6956cd328015332b00933d4e',
    '1563665': '6956cd328015332b00933d4f',
    '1564322': '6956cd328015332b00933d50',
    '1569435': '6956cd328015332b00933d51',
    '1569775': '6956cd328015332b00933d52',
    '1589810': '6956cd338015332b00933d53',
    '1590092': '6956cd338015332b00933d54',
    '1590689': '6956cd338015332b00933d56',
    '1591224': '6956cd338015332b00933d55',
    '1591368': '6956cd338015332b00933d57',
    '1592670': '6956cd338015332b00933d58',
    '1596064': '6956cd348015332b00933d59',
    '1597058': '6956cd348015332b00933d5a',
    '1597378': '6956cd348015332b00933d5b',
    '1600161': '6956cd348015332b00933d5d',
    '1600443': '6956cd348015332b00933d5c',
    '1603452': '6956cd348015332b00933d5e',
    '1604323': '6956cd358015332b00933d5f',
    '1604455': '6956cd358015332b00933d60',
    '1607508': '6956cd358015332b00933d61',
    // '1609341': NO MATCH - Cheryl "Charlie" Lindgren
    '1609342': '6956cd358015332b00933d62',
    '1609734': '6956cd358015332b00933d64',
    '1612108': '6956cd358015332b00933d65',
    '1612892': '6956cd368015332b00933d66',
    '1614261': '6956cd368015332b00933d67',
    '1615060': '6956cd368015332b00933d68',
    '1618673': '6956cd368015332b00933d69',
    '1619207': '6956cd368015332b00933d6a',
    '1619614': '6956cd368015332b00933d6b',
    '1624279': '6956cd378015332b00933d6d',
    '1624280': '6956cd368015332b00933d6c',
    '1627377': '6956cd388015332b00933d70',
    '1627379': '6956cd378015332b00933d6e',
    '1627568': '6956cd378015332b00933d6f',
    '1629988': '6956cd388015332b00933d71',
    '1630130': '6956cd388015332b00933d72',
    '1630639': '6956cd388015332b00933d73',
    '1631019': '6956cd398015332b00933d76',
    '1631026': '6956cd388015332b00933d75',
    '1631128': '6956cd388015332b00933d74',
    '1631130': '6956cd398015332b00933d77',
    '1632656': '6956cd478015332b00933dd5',
    '1633318': '6956cd398015332b00933d79',
    '1633587': '6956cd398015332b00933d78',
    '1634286': '6956cd398015332b00933d7a',
    '1634289': '6956cd398015332b00933d7b',
    '1634325': '6956cd3a8015332b00933d7c',
    '1634657': '6956cd3a8015332b00933d7d',
    '1636597': '6956cd3a8015332b00933d7e',
    '1636742': '6956cd3a8015332b00933d7f',
    // '1637274': NO MATCH - Gregory "Greg" Blom
    '1637620': '6956cd3a8015332b00933d82',
    '1637688': '6956cd3a8015332b00933d81',
    '1638089': '6956cd3b8015332b00933d83',
    '1638340': '6956cd3b8015332b00933d84',
    '1638838': '6956cd3b8015332b00933d85',
    '1638995': '6956cd3b8015332b00933d87',
    '1639200': '6956cd3b8015332b00933d88',
    '1639211': '6956cd3b8015332b00933d86',
    '1639308': '6956cd3c8015332b00933d89',
    '1641272': '6956cd3c8015332b00933d8a',
    '1641808': '6956cd3c8015332b00933d8b',
    '1642595': '6956cd3c8015332b00933d8d',
    // '1642596': NO MATCH - Kathleen "Kitty" Nordstrom
    '1642599': '6956cd3c8015332b00933d8c',
    '1642979': '6956cd3d8015332b00933d8f',
    '1643001': '6956cd3d8015332b00933d90',
    '1643024': '6956cd3d8015332b00933d91',
    '1643863': '6956cd3d8015332b00933d92',
    '1644706': '6956cd3d8015332b00933d93',
    '1644796': '6956cd3d8015332b00933d94',
    '1645186': '6956cd3d8015332b00933d95',
    '1645200': '6956cd3e8015332b00933d96',
    '1645782': '6956cd3e8015332b00933d97',
    '1646169': '6956cd3e8015332b00933d98',
    '1646275': '6956cd3e8015332b00933d99',
    '1646434': '6956cd3e8015332b00933d9a',
    '1646921': '6956cd3e8015332b00933d9b',
    '1647066': '6956cd3f8015332b00933d9c',
    '1647322': '6956cd3f8015332b00933d9d',
    '1647627': '6956cd3f8015332b00933d9e',
    '1647981': '6956cd3f8015332b00933d9f',
    '1649477': '6956cd3f8015332b00933da0',
    '1649695': '6956cd3f8015332b00933da2',
    '1649801': '6956cd3f8015332b00933da3',
    '1649803': '6956cd3f8015332b00933da1',
    '1650056': '6956cd408015332b00933da4',
    '1650336': '6956cd408015332b00933da5',
    '1650664': '6956cd408015332b00933da6',
    '1650726': '6956cd408015332b00933da8',
    '1650870': '6956cd408015332b00933da7',
    '1651957': '6956cd408015332b00933da9',
    '1652324': '6956cd418015332b00933daa',
    '1652347': '6956cd418015332b00933dab',
    '1653011': '6956cd418015332b00933dac',
    '1653320': '6956cd418015332b00933dae',
    '1653338': '6956cd418015332b00933daf',
    '1653955': '6956cd418015332b00933dad',
    '1654250': '6956cd428015332b00933db1',
    '1654335': '6956cd418015332b00933db0',
    '1654518': '6956cd428015332b00933db2',
    '1654824': '6956cd428015332b00933db3',
    '1654874': '6956cd428015332b00933db4',
    '1655130': '6956cd428015332b00933db6',
    '1655207': '6956cd428015332b00933db5',
    '1656202': '6956cd438015332b00933db7',
    '1656665': '6956cd438015332b00933db8',
    '1657245': '6956cd438015332b00933db9',
    '1657425': '6956cd438015332b00933dba',
    '1657618': '6956cd438015332b00933dbb',
    '1658819': '6956cd438015332b00933dbc',
    '1659001': '6956cd438015332b00933dbd',
    '1659241': '6956cd448015332b00933dbe',
    '1659427': '6956cd448015332b00933dbf',
    '1659736': '6956cd448015332b00933dc1',
    '1659737': '6956cd448015332b00933dc0',
    '1660785': '6956cd448015332b00933dc2',
    '1661272': '6956cd448015332b00933dc3',
    '1661570': '6956cd458015332b00933dc4',
    '1661870': '6956cd458015332b00933dc5',
    '1661955': '6956cd458015332b00933dc6',
    '1662146': '6956cd458015332b00933dc7',
    '1662458': '6956cd458015332b00933dc8',
    '1662836': '6956cd458015332b00933dc9',
    '1662837': '6956cd458015332b00933dca',
    '1663011': '6956cd468015332b00933dcb',
    '1664376': '6956cd468015332b00933dcc',
    '1665171': '6956cd468015332b00933dcd',
    '1665293': '6956cd468015332b00933dce',
    '1665435': '6956cd468015332b00933dcf',
    '1676306': '6956cd468015332b00933dd0',
    '1676644': '6956cd468015332b00933dd1',
    '1676832': '6956cd478015332b00933dd2',
    '1677316': '6956cd478015332b00933dd3',
    '1677466': '6956cd478015332b00933dd4'
};

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('✓ Connected to MongoDB\n'))
    .catch(err => {
        console.error('✗ MongoDB connection error:', err);
        process.exit(1);
    });

async function resetAndMapCondolences() {
    console.log('==========================================');
    console.log('RESETTING AND MAPPING CONDOLENCES');
    console.log('==========================================\n');

    try {
        // Step 1: Delete all existing condolences
        console.log('Step 1: Deleting all existing condolences...');
        const deleteResult = await Condolence.deleteMany({});
        console.log(`✓ Deleted ${deleteResult.deletedCount} condolences\n`);

        // Step 2: Read CSV file
        const csvPath = './data/condolences.csv';
        if (!fs.existsSync(csvPath)) {
            console.error(`✗ CSV file not found: ${csvPath}`);
            process.exit(1);
        }

        console.log('Step 2: Reading CSV file...');
        const rows = [];

        await new Promise((resolve, reject) => {
            fs.createReadStream(csvPath)
                .pipe(csv())
                .on('data', (row) => rows.push(row))
                .on('end', resolve)
                .on('error', reject);
        });

        console.log(`✓ Read ${rows.length} rows from CSV\n`);

        // Step 3: Process and insert condolences
        console.log('Step 3: Creating new condolences with mapped IDs...');

        let successCount = 0;
        let skippedCount = 0;
        const skippedOldIds = [];

        for (const row of rows) {
            const oldId = row.OID;
            const newId = ID_MAPPING[oldId];

            // Skip if no obituary mapping
            if (!newId) {
                skippedCount++;
                if (!skippedOldIds.includes(oldId)) {
                    skippedOldIds.push(oldId);
                }
                continue;
            }

            // Skip if no condolence message (empty rows)
            if (!row.CONDOLENCE || row.CONDOLENCE.trim() === '') {
                skippedCount++;
                continue;
            }

            // Verify obituary exists
            const obituaryExists = await Obituary.findById(newId);
            if (!obituaryExists) {
                console.log(`⚠️  Obituary ${newId} not found for old ID ${oldId}`);
                skippedCount++;
                continue;
            }

            // Create condolence
            const condolence = new Condolence({
                obituaryId: newId,
                name: row.NAME || 'Anonymous',
                email: row.EMAIL || '',
                message: row.CONDOLENCE.trim(),
                relationship: '', // Not in CSV
                isApproved: row.PRIVATE === '0', // Assuming PRIVATE=0 means approved
                createdAt: row.DATE ? new Date(row.DATE) : new Date()
            });

            await condolence.save();
            successCount++;

            if (successCount % 50 === 0) {
                console.log(`  Processed ${successCount} condolences...`);
            }
        }

        console.log('\n==========================================');
        console.log('RESULTS');
        console.log('==========================================');
        console.log(`✓ Successfully created: ${successCount} condolences`);
        console.log(`⚠️  Skipped (no mapping): ${skippedCount} condolences`);

        if (skippedOldIds.length > 0) {
            console.log('\nSkipped Old IDs:');
            skippedOldIds.forEach(id => console.log(`  - ${id}`));
        }

        console.log('\n✓ Process completed successfully!');

    } catch (error) {
        console.error('✗ Error:', error);
        process.exit(1);
    }
}

resetAndMapCondolences().then(() => {
    mongoose.connection.close();
    process.exit(0);
});