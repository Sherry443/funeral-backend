// ==========================================
// testCSV.js - Check CSV Structure
// ==========================================
const fs = require('fs');
const csv = require('csv-parser');

const csvFilePath = process.argv[2] || './obituaries.csv';

console.log(`\n📁 Analyzing CSV file: ${csvFilePath}\n`);

let rowCount = 0;
let headers = [];

fs.createReadStream(csvFilePath)
    .pipe(csv({
        mapHeaders: ({ header }) => header.trim().toUpperCase()
    }))
    .on('headers', (headerList) => {
        headers = headerList;
        console.log('========================================');
        console.log('📋 CSV COLUMNS FOUND:');
        console.log('========================================');
        headerList.forEach((header, index) => {
            console.log(`${index + 1}. "${header}"`);
        });
        console.log('========================================\n');
    })
    .on('data', (row) => {
        rowCount++;

        // Show first 2 rows in detail
        if (rowCount <= 2) {
            console.log(`\n========================================`);
            console.log(`ROW ${rowCount} DATA:`);
            console.log('========================================');

            Object.keys(row).forEach(key => {
                const value = row[key];
                const preview = value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : '[EMPTY]';
                console.log(`${key}: "${preview}"`);
            });

            console.log('========================================\n');
        }
    })
    .on('end', () => {
        console.log(`\n✅ Analysis Complete`);
        console.log(`Total Rows: ${rowCount}`);
        console.log(`Total Columns: ${headers.length}\n`);
    })
    .on('error', (err) => {
        console.error('❌ Error reading CSV:', err.message);
    });