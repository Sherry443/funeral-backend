// ==========================================
// services/obituaryService.js - FIXED
// ==========================================
const Obituary = require('../models/Obituary');
const mongoose = require('mongoose');

class ObituaryService {
    // Get recent obituaries
    async getRecentObituaries(limit = 12) {
        try {
            const obituaries = await Obituary.find({ isPublished: true })
                .sort({ deathDate: -1 })
                .limit(limit)
                .select('firstName middleName lastName deathDate location photo slug')
                .lean();

            return { success: true, data: obituaries };
        } catch (error) {
            console.error('Error fetching recent obituaries:', error);
            return { success: false, error: error.message };
        }
    }

    // Search obituaries
    async searchObituaries(searchQuery) {
        try {
            if (!searchQuery || searchQuery.trim() === '') {
                return { success: false, error: 'Search query is required', statusCode: 400 };
            }

            const searchRegex = new RegExp(searchQuery.trim(), 'i');

            const obituaries = await Obituary.find({
                isPublished: true,
                $or: [
                    { firstName: searchRegex },
                    { middleName: searchRegex },
                    { lastName: searchRegex },
                    { location: searchRegex }
                ]
            })
                .sort({ deathDate: -1 })
                .limit(50)
                .select('firstName middleName lastName deathDate location photo slug')
                .lean();

            return { success: true, data: obituaries };
        } catch (error) {
            console.error('Error searching obituaries:', error);
            return { success: false, error: error.message };
        }
    }

    // Get single obituary
    async getObituaryBySlug(slug) {
        try {
            // Check if slug is a valid MongoDB ObjectId
            const isObjectId = mongoose.Types.ObjectId.isValid(slug);

            const query = isObjectId
                ? { $or: [{ slug: slug }, { _id: slug }], isPublished: true }
                : { slug: slug, isPublished: true };

            const obituary = await Obituary.findOne(query).lean();

            if (!obituary) {
                return { success: false, error: 'Obituary not found', statusCode: 404 };
            }

            return { success: true, data: obituary };
        } catch (error) {
            console.error('Error fetching obituary:', error);
            return { success: false, error: error.message };
        }
    }

    // Get all obituaries with pagination
    async getAllObituaries(page = 1, limit = 20) {
        try {
            const skip = (page - 1) * limit;

            const [obituaries, total] = await Promise.all([
                Obituary.find({ isPublished: true })
                    .sort({ deathDate: -1 })
                    .skip(skip)
                    .limit(limit)
                    .select('firstName middleName lastName deathDate location photo slug')
                    .lean(),
                Obituary.countDocuments({ isPublished: true })
            ]);

            return {
                success: true,
                data: {
                    obituaries,
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(total / limit),
                        totalItems: total,
                        itemsPerPage: limit
                    }
                }
            };
        } catch (error) {
            console.error('Error fetching obituaries:', error);
            return { success: false, error: error.message };
        }
    }

    // Create obituary
    async createObituary(obituaryData) {
        try {
            const obituary = new Obituary(obituaryData);
            await obituary.save();
            return { success: true, data: obituary };
        } catch (error) {
            console.error('Error creating obituary:', error);
            return { success: false, error: error.message };
        }
    }

    // Update obituary
    async updateObituary(id, updateData) {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return { success: false, error: 'Invalid obituary ID', statusCode: 400 };
            }

            const obituary = await Obituary.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            );

            if (!obituary) {
                return { success: false, error: 'Obituary not found', statusCode: 404 };
            }

            return { success: true, data: obituary };
        } catch (error) {
            console.error('Error updating obituary:', error);
            return { success: false, error: error.message };
        }
    }

    // Delete obituary
    async deleteObituary(id) {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return { success: false, error: 'Invalid obituary ID', statusCode: 400 };
            }

            const obituary = await Obituary.findByIdAndDelete(id);

            if (!obituary) {
                return { success: false, error: 'Obituary not found', statusCode: 404 };
            }

            return { success: true, message: 'Obituary deleted successfully' };
        } catch (error) {
            console.error('Error deleting obituary:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new ObituaryService();