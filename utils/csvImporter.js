// ==========================================
// utils/csvImporter.js - FIXED FOR YOUR CSV
// ==========================================
const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const Obituary = require('../models/Obituary');
const slugify = require('slugify');

class CSVImporter {
    constructor(csvFilePath, mongodbUri) {
        this.csvFilePath = csvFilePath;
        this.mongodbUri = mongodbUri;
    }

    // =====================
    // Parse Date Safely
    // =====================
    parseDate(dateString) {
        if (!dateString || dateString === '[EMPTY]' || dateString.trim() === '') {
            return null;
        }
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date;
    }

    // =====================
    // Clean String Value
    // =====================
    cleanValue(value) {
        if (!value || value === '[EMPTY]' || value.trim() === '') {
            return null;
        }
        return value.trim();
    }

    // =====================
    // Extract Location
    // =====================
    extractLocation(text = '') {
        if (!text || text === '[EMPTY]') return 'Rapid City';

        const patterns = [
            /in\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/,
            /of\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/,
            /Rapid\s+City/i,
            /Sioux\s+Falls/i,
            /Aberdeen/i,
            /Belle\s+Fourche/i,
            /Buffalo/i
        ];

        for (const p of patterns) {
            const match = text.match(p);
            if (match) return match[0];
        }

        return 'Rapid City';
    }

    // =====================
    // Import CSV
    // =====================
    async importCSV() {
        try {
            await mongoose.connect(this.mongodbUri);
            console.log('✅ MongoDB Connected');

            const records = [];
            let success = 0;
            let failed = 0;
            let rowNumber = 0;

            fs.createReadStream(this.csvFilePath)
                .pipe(csv({
                    mapHeaders: ({ header }) => header.trim().toUpperCase()
                }))
                .on('data', (row) => {
                    rowNumber++;

                    const obituaryData = {
                        firstName: this.cleanValue(row.FIRST) || '',
                        middleName: this.cleanValue(row.MIDDLE) || '',
                        lastName: this.cleanValue(row.LAST) || '',

                        birthDate: this.parseDate(row.DOB),
                        deathDate: this.parseDate(row.DOD),

                        biography: this.cleanValue(row.OBITUARY) || '',

                        videoUrl: this.cleanValue(row.VIDEOURL),
                        externalVideo: this.cleanValue(row.EXTERNALVIDEO),
                        embeddedVideo: this.cleanValue(row.EMBEDDEDVIDEO),

                        photo: this.cleanValue(row.IMAGE),
                        backgroundImage: this.cleanValue(row.IMAGE),

                        location: this.extractLocation(row.OBITUARY),
                        isPublished: true
                    };

                    records.push({ data: obituaryData, rowNumber, id: row.ID });
                })
                .on('end', async () => {
                    console.log(`\n📄 CSV Loaded: ${records.length} rows`);
                    console.log('Starting import...\n');

                    for (const record of records) {
                        const { data, rowNumber, id } = record;

                        try {
                            // Validate required fields
                            if (!data.firstName || data.firstName.trim() === '') {
                                throw new Error('firstName is required but empty');
                            }
                            if (!data.lastName || data.lastName.trim() === '') {
                                throw new Error('lastName is required but empty');
                            }

                            // Create and save obituary
                            const obituary = new Obituary(data);
                            await obituary.save();

                            // Generate slug using the MongoDB _id
                            const baseSlug = slugify(`${obituary.firstName} ${obituary.lastName}`, {
                                lower: true,
                                strict: true,
                                remove: /[*+~.()'"!:@]/g
                            });

                            obituary.slug = `${baseSlug}-${obituary._id}`;

                            // Update without triggering validation again
                            await Obituary.updateOne(
                                { _id: obituary._id },
                                { $set: { slug: obituary.slug } }
                            );

                            success++;

                            // Show progress every 10 records
                            if (success % 10 === 0) {
                                console.log(`✔ Progress: ${success}/${records.length} imported...`);
                            }

                            // Show first few
                            if (success <= 3) {
                                console.log(`✔ [Row ${rowNumber}] Imported: ${data.firstName} ${data.lastName}`);
                            }

                        } catch (err) {
                            failed++;
                            console.error(`\n❌ Failed Row ${rowNumber} (ID: ${id})`);
                            console.error(`   Name: ${data.firstName} ${data.lastName}`);
                            console.error(`   Error: ${err.message}`);

                            // Show validation errors
                            if (err.errors) {
                                Object.keys(err.errors).forEach(key => {
                                    console.error(`   - ${key}: ${err.errors[key].message}`);
                                });
                            }

                            // Show first 3 full errors
                            if (failed <= 3) {
                                console.error(`   Stack: ${err.stack}\n`);
                            }
                        }
                    }

                    console.log('\n========= IMPORT SUMMARY =========');
                    console.log(`Total: ${records.length}`);
                    console.log(`✅ Success: ${success}`);
                    console.log(`❌ Failed: ${failed}`);
                    console.log(`Success Rate: ${((success / records.length) * 100).toFixed(1)}%`);
                    console.log('=================================\n');

                    await mongoose.connection.close();
                    console.log('🔌 MongoDB Connection Closed');
                })
                .on('error', (err) => {
                    console.error('❌ CSV Read Error:', err);
                });

        } catch (err) {
            console.error('❌ MongoDB Error:', err);
            console.error(err.stack);
        }
    }
}

module.exports = CSVImporter;