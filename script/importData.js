// ==========================================
// scripts/importData.js - Run this to import
// ==========================================
const CSVImporter = require('../utils/csvImporter');
const path = require('path');

// Configuration
const CSV_FILE_PATH = path.join(__dirname, '../data/obituaries.csv');
const MONGODB_URI = process.env.MONGODB_URI;

// Run import
const importer = new CSVImporter(CSV_FILE_PATH, MONGODB_URI);
importer.importCSV();