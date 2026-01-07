// ==========================================
// controller/condolenceController.js
// ==========================================
const condolenceService = require('../services/condolenceService');

class CondolenceController {
    // GET /api/condolences/obituary/:obituaryId
    async getCondolencesByObituaryId(req, res) {
        try {
            const { obituaryId } = req.params;
            const includePrivate = req.query.includePrivate === 'true';

            const result = await condolenceService.getCondolencesByObituaryId(
                obituaryId,
                includePrivate
            );

            if (result.success) {
                return res.status(200).json(result.data);
            }
            return res.status(result.statusCode || 500).json({
                message: result.error
            });
        } catch (error) {
            console.error('Error in getCondolencesByObituaryId:', error);
            return res.status(500).json({
                message: 'Server error',
                error: error.message
            });
        }
    }


    // GET /api/condolences/obituary/slug/:slug
    async getCondolencesBySlug(req, res) {
        try {
            const { slug } = req.params;
            const includePrivate = req.query.includePrivate === 'true';

            const result = await condolenceService.getCondolencesBySlug(
                slug,
                includePrivate
            );

            if (result.success) {
                return res.status(200).json(result.data);
            }
            return res.status(result.statusCode || 500).json({
                message: result.error
            });
        } catch (error) {
            console.error('Error in getCondolencesBySlug:', error);
            return res.status(500).json({
                message: 'Server error',
                error: error.message
            });
        }
    }

    // GET /api/condolences/stats/:obituaryId
    async getCondolenceStats(req, res) {
        try {
            const { obituaryId } = req.params;
            const result = await condolenceService.getCondolenceStats(obituaryId);

            if (result.success) {
                return res.status(200).json(result.data);
            }
            return res.status(500).json({
                message: result.error
            });
        } catch (error) {
            console.error('Error in getCondolenceStats:', error);
            return res.status(500).json({
                message: 'Server error',
                error: error.message
            });
        }
    }

    // POST /api/condolences
    async createCondolence(req, res) {
        try {
            console.log('\n==========================================');
            console.log('CREATE CONDOLENCE - START');
            console.log('==========================================');
            console.log('Request body:', req.body);

            const { obituaryId, name, email, message, isPrivate, hasCandle, gestureId, gestureDescription } = req.body;

            // Validate required fields
            if (!obituaryId) {
                return res.status(400).json({
                    message: 'Validation failed',
                    error: 'Obituary ID is required'
                });
            }

            if (!name || !message) {
                return res.status(400).json({
                    message: 'Validation failed',
                    error: 'Name and message are required'
                });
            }

            const condolenceData = {
                obituaryId,
                name,
                email: email || null,
                message,
                isPrivate: isPrivate === true || isPrivate === 'true',
                hasCandle: hasCandle === true || hasCandle === 'true',
                gestureId: gestureId || null,
                gestureDescription: gestureDescription || null
            };

            console.log('Processed condolence data:', condolenceData);

            const result = await condolenceService.createCondolence(condolenceData);

            if (result.success) {
                console.log('SUCCESS - Condolence created');
                console.log('==========================================\n');
                return res.status(201).json(result.data);
            }

            console.error('FAILED - Service returned error:', result.error);
            console.log('==========================================\n');
            return res.status(result.statusCode || 500).json({
                message: 'Failed to create condolence',
                error: result.error
            });
        } catch (error) {
            console.error('\n==========================================');
            console.error('EXCEPTION in createCondolence controller:');
            console.error('Error:', error);
            console.error('==========================================\n');
            return res.status(500).json({
                message: 'Failed to create condolence',
                error: error.message
            });
        }
    }

    // PUT /api/condolences/:id
    async updateCondolence(req, res) {
        try {
            const { id } = req.params;
            const updateData = {};

            // Only allow certain fields to be updated
            const allowedFields = ['message', 'isPrivate', 'isApproved', 'hasCandle', 'gestureId', 'gestureDescription'];

            allowedFields.forEach(field => {
                if (req.body[field] !== undefined) {
                    if (field === 'isPrivate' || field === 'isApproved' || field === 'hasCandle') {
                        updateData[field] = req.body[field] === true || req.body[field] === 'true';
                    } else {
                        updateData[field] = req.body[field];
                    }
                }
            });

            const result = await condolenceService.updateCondolence(id, updateData);

            if (result.success) {
                return res.status(200).json(result.data);
            }
            return res.status(result.statusCode || 500).json({
                message: result.error
            });
        } catch (error) {
            console.error('Error in updateCondolence controller:', error);
            return res.status(500).json({
                message: 'Failed to update condolence',
                error: error.message
            });
        }
    }

    // DELETE /api/condolences/:id
    async deleteCondolence(req, res) {
        try {
            const { id } = req.params;
            const result = await condolenceService.deleteCondolence(id);

            if (result.success) {
                return res.status(200).json({
                    message: result.message
                });
            }
            return res.status(result.statusCode || 500).json({
                message: result.error
            });
        } catch (error) {
            console.error('Error in deleteCondolence controller:', error);
            return res.status(500).json({
                message: 'Server error',
                error: error.message
            });
        }
    }

    // GET /api/condolences (Admin view - all condolences)
    async getAllCondolences(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;

            const result = await condolenceService.getAllCondolences(page, limit);

            if (result.success) {
                return res.status(200).json(result.data);
            }
            return res.status(500).json({
                message: 'Failed to fetch condolences',
                error: result.error
            });
        } catch (error) {
            console.error('Error in getAllCondolences:', error);
            return res.status(500).json({
                message: 'Server error',
                error: error.message
            });
        }
    }
}

module.exports = new CondolenceController();