// ==========================================
// scripts/debugCSV.js
// Debug what's in the CSV file
// Run: node scripts/debugCSV.js
// ==========================================

const fs = require('fs');
const csv = require('csv-parser');

const csvPath = './data/condolences.csv';

console.log('==========================================');
console.log('DEBUGGING CSV CONTENT');
console.log('==========================================\n');

const rows = [];

fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (row) => rows.push(row))
    .on('end', () => {
        console.log('CSV Headers:');
        console.log(Object.keys(rows[0]));
        console.log('\n==========================================');
        console.log('First 10 rows:');
        console.log('==========================================\n');

        rows.slice(0, 10).forEach((row, index) => {
            console.log(`Row ${index + 1}:`);
            console.log(JSON.stringify(row, null, 2));
            console.log('---');
        });

        console.log('\n==========================================');
        console.log('Unique OID values (first 20):');
        console.log('==========================================\n');

        const uniqueOIDs = [...new Set(rows.map(r => r.OID))];
        uniqueOIDs.slice(0, 20).forEach(oid => {
            console.log(oid);
        });

        console.log(`\nTotal rows: ${rows.length}`);
        console.log(`Unique OIDs: ${uniqueOIDs.length}`);
    });