// ==========================================
// scripts/mapByNames.js
// Maps old IDs to new MongoDB IDs using NAME MATCHING
// Run: node scripts/mapByNames.js
// ==========================================

const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const Obituary = require('../models/Obituary');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://shahzadrasool443_db_user:KjWPfl2MBNeMvU4K@cluster-mern.o0wfyvn.mongodb.net/?appName=Cluster-mern';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('✓ Connected to MongoDB\n'))
    .catch(err => {
        console.error('✗ MongoDB connection error:', err);
        process.exit(1);
    });

// Old ID to Name mapping
const oldIdMapping = {
    "1349227": { first: "Leone", middle: "Annabelle", last: "Moncur" },
    "1521147": { first: "Sandra", middle: "C", last: "Dallago" },
    "1349226": { first: "Lloyd", middle: "Alexander", last: "Moncur" },
    "1349228": { first: "Barbara", middle: "J.", last: "McKichan" },
    "1349229": { first: "Timothy", middle: "C.", last: "Rawhouser" },
    "1521139": { first: "Michael", middle: "Lee", last: "Schwendeman" },
    "1524864": { first: "Bonnie", middle: "C.", last: "Plooster" },
    "1527011": { first: "Cheryl", middle: "Lynn", last: "Daugherty" },
    "1536116": { first: "Brit", middle: "", last: "Jones" },
    "1540614": { first: "Douglas", middle: "Almon", last: "Caney" },
    "1541678": { first: "Alta", middle: "Beverly", last: "Bachofer" },
    "1542011": { first: "Jose \"Chris\"", middle: "C.", last: "Barrera" },
    "1550165": { first: "Luke", middle: "Jorge", last: "Massee" },
    "1550410": { first: "Harley", middle: "Dean", last: "Wilson Jr." },
    "1551328": { first: "Roger", middle: "D.", last: "Pressley" },
    "1552166": { first: "Mildred", middle: "Patricia", last: "Perry" },
    "1554563": { first: "Toni", middle: "A.", last: "Long" },
    "1559253": { first: "Carolyn", middle: "Fay", last: "Rains" },
    "1555458": { first: "Len", middle: "G.", last: "Hofer" },
    "1560489": { first: "Michael", middle: "Albert", last: "Matson" },
    "1561102": { first: "Beverly", middle: "Kay", last: "Nash" },
    "1561873": { first: "Dawn", middle: "Janelle", last: "Doucette" },
    "1561872": { first: "Ruben", middle: "Lamoine", last: "McCloskey" },
    "1563385": { first: "Dale", middle: "Edward", last: "Hayford" },
    "1563665": { first: "Timothy", middle: "Gene", last: "Nordquist" },
    "1564322": { first: "Ronald", middle: "Lee", last: "Penn" },
    "1569435": { first: "Joseph", middle: "Edward", last: "Kutil" },
    "1569775": { first: "Tanja", middle: "Lee", last: "Murraine" },
    "1589810": { first: "Leona", middle: "Annette", last: "Carney" },
    "1590092": { first: "John", middle: "Lee", last: "Feddersen" },
    "1591224": { first: "Michael", middle: "Patrick", last: "Evans" },
    "1590689": { first: "Justin", middle: "Lee", last: "Sogn" },
    "1591368": { first: "Donald", middle: "Robert", last: "Perdue" },
    "1592670": { first: "Bernhard", middle: "Michael", last: "Winkler" },
    "1596064": { first: "Vaun", middle: "Howard", last: "Boyd" },
    "1597058": { first: "Venus", middle: "Pearl", last: "Sierra" },
    "1597378": { first: "Gary", middle: "Ray", last: "Muck" },
    "1600443": { first: "Ronald", middle: "Joseph Patrick", last: "Christensen" },
    "1600161": { first: "Rodger", middle: "Paul", last: "LeFebvre" },
    "1603452": { first: "Michael", middle: "Clayton", last: "Bradshaw" },
    "1604323": { first: "Nora", middle: "Rose", last: "Alexander" },
    "1604455": { first: "Robert", middle: "Lyle", last: "Lang" },
    "1607508": { first: "Dave", middle: "Gene", last: "Paulson" },
    "1609342": { first: "Joseph", middle: "Eugene", last: "Lopez" },
    "1609341": { first: "Cheryl \"Charlie\"", middle: "Diane", last: "Lindgren" },
    "1609734": { first: "Larry", middle: "Paul", last: "Flannagan" },
    "1612108": { first: "Bryan", middle: "Alexander", last: "Pittman" },
    "1612892": { first: "Linda", middle: "Jo", last: "Trobee" },
    "1614261": { first: "Shirley", middle: "Mae", last: "Latham" },
    "1615060": { first: "Tera", middle: "May", last: "Smith" },
    "1618673": { first: "Janice", middle: "Kaye", last: "Kahler" },
    "1619207": { first: "Gary", middle: "Davis", last: "Gartenberg" },
    "1619614": { first: "Mary", middle: "Louise", last: "Marsh" },
    "1624280": { first: "David", middle: "Lee", last: "McBee" },
    "1624279": { first: "Michael", middle: "T", last: "Lyke" },
    "1627379": { first: "Eddie", middle: "Lee", last: "Woods" },
    "1627568": { first: "Galen", middle: "Royce", last: "Burgett" },
    "1627377": { first: "Barbara", middle: "Ann", last: "Schneider" },
    "1629988": { first: "Jeffrey", middle: "James", last: "Thorstenson" },
    "1630130": { first: "Marvin", middle: "Lee", last: "Heggem" },
    "1630639": { first: "Donna", middle: "Marie", last: "Sweeney" },
    "1631128": { first: "Richard", middle: "Eugene", last: "Jones, Jr" },
    "1631026": { first: "John", middle: "Clifford", last: "Duggan" },
    "1631019": { first: "Jeremy", middle: "Grant", last: "Simpson" },
    "1631130": { first: "Donald", middle: "Franklin", last: "Sweeney" },
    "1633587": { first: "Lorraine", middle: "", last: "Van Pelt" },
    "1633318": { first: "Hannelore", middle: "", last: "Ausdal" },
    "1634286": { first: "Jaimie", middle: "Lynnette", last: "Rivers-Chapman" },
    "1634289": { first: "Cheryle", middle: "Lee", last: "Slagle" },
    "1634325": { first: "Rebecca", middle: "Ann", last: "Chambers" },
    "1634657": { first: "Patricia", middle: "A.", last: "Colleran" },
    "1636597": { first: "Roger", middle: "", last: "Anderson" },
    "1636742": { first: "Dillon", middle: "Scott", last: "Brigman" },
    "1637274": { first: "Gregory \"Greg\"", middle: "R.", last: "Blom" },
    "1637688": { first: "John", middle: "L.", last: "Lambert" },
    "1637620": { first: "William", middle: "Herman", last: "Krokel" },
    "1638089": { first: "James", middle: "Alan", last: "Greenberg" },
    "1638340": { first: "Kenneth", middle: "William", last: "Novotny" },
    "1638838": { first: "Jane", middle: "Ann", last: "Roberts" },
    "1639211": { first: "Michael", middle: "Terry", last: "Waisanen" },
    "1638995": { first: "Mary", middle: "Ellen", last: "Miller" },
    "1639200": { first: "David", middle: "Dean", last: "Sacry" },
    "1639308": { first: "Debra", middle: "K.", last: "Wanous" },
    "1641272": { first: "Joan", middle: "Theresia", last: "Perdue" },
    "1641808": { first: "Sheri", middle: "LeeRay", last: "Fernandez" },
    "1642599": { first: "Arthur", middle: "Lloyd", last: "Anderson" },
    "1642595": { first: "Andrew", middle: "Lee", last: "Warren" },
    "1642596": { first: "Kathleen \"Kitty\"", middle: "", last: "Nordstrom" },
    "1642979": { first: "Robert", middle: "Bernard", last: "Sava" },
    "1643001": { first: "Raymond", middle: "Deon", last: "Aubert, Sr." },
    "1643024": { first: "Sandra", middle: "Maurice", last: "Boyd" },
    "1643863": { first: "Sierra", middle: "Gail", last: "Borland" },
    "1644706": { first: "Linda", middle: "Diane", last: "Cantrell" },
    "1644796": { first: "Donna", middle: "Lou", last: "Gannon" },
    "1645186": { first: "Shawna", middle: "Marie", last: "Scott" },
    "1645200": { first: "Ernest", middle: "Edgar", last: "Landrum" },
    "1645782": { first: "Timothy", middle: "James", last: "Chamberlain" },
    "1646169": { first: "Charles", middle: "E.", last: "Wood" },
    "1646275": { first: "James", middle: "Roland", last: "Munyon" },
    "1646434": { first: "Virginia", middle: "Tawney", last: "Lopez-Whitecalf" },
    "1646921": { first: "Josephine", middle: "Jerone", last: "Blocker" },
    "1647066": { first: "Susan", middle: "M", last: "Eagleton" },
    "1647322": { first: "Zachery", middle: "Wayne", last: "Morgan" },
    "1647627": { first: "Carla", middle: "Joy", last: "Halverson" },
    "1647981": { first: "Michael", middle: "James", last: "Spaulding" },
    "1649477": { first: "Jo Ann", middle: "", last: "Hayes" },
    "1649803": { first: "Mitchell", middle: "Ward", last: "Conklin" },
    "1649695": { first: "Janet", middle: "Ellen", last: "Mason" },
    "1649801": { first: "Michael", middle: "Leon", last: "Austin" },
    "1650056": { first: "Sheryl", middle: "Annette", last: "Montgomery" },
    "1650336": { first: "Mavis", middle: "Monell", last: "Cochran" },
    "1650664": { first: "Dallas", middle: "Robert", last: "Latham" },
    "1650870": { first: "Dane", middle: "Axel", last: "Nordquist" },
    "1650726": { first: "Larry", middle: "John", last: "Johnson" },
    "1651957": { first: "Jacquline", middle: "Lee", last: "Blome" },
    "1652324": { first: "Rodney", middle: "Stewart", last: "Smith" },
    "1652347": { first: "Rosalind", middle: "Jean", last: "McPherson" },
    "1653011": { first: "Carol", middle: "Sue", last: "Barney" },
    "1653955": { first: "Young", middle: "Sik", last: "Kim" },
    "1653320": { first: "Jay", middle: "David", last: "Morse" },
    "1653338": { first: "Robert", middle: "Roy", last: "Plato" },
    "1654335": { first: "Jace", middle: "Keg", last: "Scherbarth" },
    "1654250": { first: "Michael", middle: "Anthony", last: "Gonzales" },
    "1654518": { first: "Joyce", middle: "A.", last: "Giedd" },
    "1654824": { first: "Robert", middle: "Edward", last: "Kline" },
    "1654874": { first: "Bernard", middle: "Thomas", last: "Smoot, III" },
    "1655207": { first: "Jon", middle: "David", last: "Boe" },
    "1655130": { first: "Eileen", middle: "Carol", last: "Bolhouse" },
    "1656202": { first: "Michael", middle: "Jay", last: "Champagne" },
    "1656665": { first: "Patricia", middle: "Ann", last: "Ratzlaff" },
    "1657245": { first: "Sharon", middle: "Kay", last: "Warkentine" },
    "1657425": { first: "Maria", middle: "Ester", last: "Oleson" },
    "1657618": { first: "Kenny", middle: "Allen", last: "Harvison" },
    "1658819": { first: "Joseph", middle: "John", last: "Kerfont" },
    "1659001": { first: "Hao", middle: "", last: "Fong" },
    "1659241": { first: "Kyle", middle: "Ralph", last: "Gray" },
    "1659427": { first: "Wallace", middle: "Reuben", last: "Kehrberg" },
    "1659737": { first: "Paul", middle: "E.", last: "Lyttle" },
    "1659736": { first: "Diane", middle: "Carol", last: "Reid" },
    "1660785": { first: "Heather", middle: "Lynne", last: "Clifton" },
    "1661272": { first: "Lynette", middle: "", last: "Vorachek" },
    "1661570": { first: "Elgene", middle: "Sue", last: "Noisy Hawk" },
    "1661870": { first: "Devyn", middle: "Paul", last: "Hendricks" },
    "1661955": { first: "Robert", middle: "Allen", last: "Berube" },
    "1662146": { first: "Albert", middle: "Herman", last: "Kant" },
    "1662458": { first: "Jeffrey", middle: "Joseph", last: "Vickerman" },
    "1662836": { first: "Stephanie", middle: "Ann", last: "Ellis" },
    "1662837": { first: "Harry", middle: "Baird", last: "Niceley, III" },
    "1663011": { first: "Robert", middle: "Andrew", last: "Amerson" },
    "1664376": { first: "Jean", middle: "Marie", last: "McMahon" },
    "1665171": { first: "Barry", middle: "Todd", last: "Bisbee" },
    "1665293": { first: "James", middle: "Everett", last: "Arnold" },
    "1665435": { first: "Ricky", middle: "Joe", last: "Geiken" },
    "1676306": { first: "Darcy", middle: "Lynn", last: "Hart" },
    "1676644": { first: "Michael", middle: "Joy", last: "Carter" },
    "1676832": { first: "Kerry", middle: "Dean", last: "Daly" },
    "1677316": { first: "Robert", middle: "Morse", last: "Eggers" },
    "1677466": { first: "Kelly", middle: "L.", last: "Denny" },
    "1632656": { first: "Jeffrey", middle: "Michael", last: "Daley" }
};

function normalizeString(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '')
        .replace(/\s+/g, '');
}

function matchNames(oldName, dbObituary) {
    const oldFirst = normalizeString(oldName.first);
    const oldLast = normalizeString(oldName.last);

    const dbFirst = normalizeString(dbObituary.firstName);
    const dbLast = normalizeString(dbObituary.lastName);
    const dbMiddle = normalizeString(dbObituary.middleName);

    // Exact match
    if (oldFirst === dbFirst && oldLast === dbLast) {
        return true;
    }

    // Match with middle name
    if (oldName.middle) {
        const oldMiddle = normalizeString(oldName.middle);
        if (oldFirst === dbFirst && oldMiddle === dbMiddle && oldLast === dbLast) {
            return true;
        }
    }

    return false;
}

async function mapCondolences() {
    console.log('==========================================');
    console.log('NAME-BASED ID MAPPING');
    console.log('==========================================\n');

    // Get all obituaries from database
    const obituaries = await Obituary.find().select('_id firstName middleName lastName');
    console.log(`✓ Loaded ${obituaries.length} obituaries from database\n`);

    // Create old ID to new ID mapping
    const idMap = {};
    let matchedCount = 0;
    let unmatchedOldIds = [];

    console.log('🔍 Matching names...\n');

    Object.keys(oldIdMapping).forEach(oldId => {
        const oldName = oldIdMapping[oldId];

        const match = obituaries.find(obit => matchNames(oldName, obit));

        if (match) {
            idMap[oldId] = match._id.toString();
            matchedCount++;
            console.log(`✓ ${oldId} → ${match._id} | ${oldName.first} ${oldName.last}`);
        } else {
            unmatchedOldIds.push({ oldId, name: oldName });
            console.log(`✗ ${oldId} | ${oldName.first} ${oldName.last} - NO MATCH`);
        }
    });

    console.log('\n==========================================');
    console.log('MATCHING RESULTS');
    console.log('==========================================');
    console.log(`✓ Matched: ${matchedCount}`);
    console.log(`✗ Unmatched: ${unmatchedOldIds.length}`);

    if (unmatchedOldIds.length > 0) {
        console.log('\n⚠️  Unmatched Old IDs:');
        unmatchedOldIds.slice(0, 10).forEach(item => {
            console.log(`   ${item.oldId} - ${item.name.first} ${item.name.last}`);
        });
        if (unmatchedOldIds.length > 10) {
            console.log(`   ... and ${unmatchedOldIds.length - 10} more`);
        }
    }

    // Save mapping to file
    fs.writeFileSync(
        './exports/id-mapping.json',
        JSON.stringify(idMap, null, 2)
    );
    console.log('\n✓ Saved mapping to: ./exports/id-mapping.json');

    // Now map condolences CSV
    console.log('\n==========================================');
    console.log('MAPPING CONDOLENCES CSV');
    console.log('==========================================\n');

    const oldCsvPath = './data/condolences.csv';
    const rows = [];

    await new Promise((resolve) => {
        fs.createReadStream(oldCsvPath)
            .pipe(csv())
            .on('data', (row) => rows.push(row))
            .on('end', resolve);
    });

    console.log(`✓ Read ${rows.length} condolence rows\n`);

    // Create new CSV with mapped IDs
    let csvContent = 'OID,NAME,DATE,EMAIL,PRIVATE,CONDOLENCE,CANDLE,GESTUREID,GESTURE_DESCRIPTION\n';
    let mappedCount = 0;
    let skippedCount = 0;

    rows.forEach(row => {
        const oldId = row.OID;
        const newId = idMap[oldId];

        // Skip if no name or no condolence or no ID mapping
        if (!row.NAME || !row.NAME.trim() ||
            !row.CONDOLENCE || !row.CONDOLENCE.trim() ||
            !newId) {
            skippedCount++;
            return;
        }

        const csvRow = [
            newId,  // NEW MongoDB ID
            `"${row.NAME.trim()}"`,
            row.DATE || '2024-01-15',
            row.EMAIL ? `"${row.EMAIL.trim()}"` : '',
            row.PRIVATE || '0',
            `"${row.CONDOLENCE.trim().replace(/"/g, '""')}"`,
            row.CANDLE?.trim() || '0',
            row.GESTUREID?.trim() || '',
            row.GESTURE_DESCRIPTION ? `"${row.GESTURE_DESCRIPTION.trim()}"` : ''
        ].join(',');

        csvContent += csvRow + '\n';
        mappedCount++;
    });

    const outputPath = './data/condolences-mapped.csv';
    fs.writeFileSync(outputPath, csvContent);

    console.log('==========================================');
    console.log('✓ MAPPING COMPLETE!');
    console.log('==========================================');
    console.log(`Output: ${outputPath}`);
    console.log(`✓ Successfully mapped: ${mappedCount}`);
    console.log(`✗ Skipped: ${skippedCount}`);
    console.log('\nNow run:');
    console.log(`  node scripts/importCondolences.js ${outputPath}`);
    console.log('==========================================\n');

    process.exit(0);
}

mapCondolences().catch(err => {
    console.error('✗ Error:', err);
    process.exit(1);
});