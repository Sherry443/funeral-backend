// ==========================================
// 2. controller/obituaryController.js - ENHANCED DEBUGGING
// ==========================================
const obituaryService = require('../services/obituaryService');

class ObituaryController {
    async getRecentObituaries(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 12;
            const result = await obituaryService.getRecentObituaries(limit);

            if (result.success) {
                return res.status(200).json(result.data);
            }
            return res.status(500).json({ message: 'Failed to fetch recent obituaries', error: result.error });
        } catch (error) {
            console.error('Error in getRecentObituaries:', error);
            return res.status(500).json({ message: 'Server error', error: error.message });
        }
    }

    async searchObituaries(req, res) {
        try {
            const { q } = req.query;
            const result = await obituaryService.searchObituaries(q);

            if (result.success) {
                return res.status(200).json(result.data);
            }
            return res.status(result.statusCode || 500).json({ message: result.error });
        } catch (error) {
            console.error('Error in searchObituaries:', error);
            return res.status(500).json({ message: 'Server error', error: error.message });
        }
    }

    async getObituaryBySlug(req, res) {
        try {
            const { slug } = req.params;
            const result = await obituaryService.getObituaryBySlug(slug);

            if (result.success) {
                return res.status(200).json(result.data);
            }
            return res.status(result.statusCode || 500).json({ message: result.error });
        } catch (error) {
            console.error('Error in getObituaryBySlug:', error);
            return res.status(500).json({ message: 'Server error', error: error.message });
        }
    }

    async getAllObituaries(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const result = await obituaryService.getAllObituaries(page, limit);

            if (result.success) {
                return res.status(200).json(result.data);
            }
            return res.status(500).json({ message: 'Failed to fetch obituaries', error: result.error });
        } catch (error) {
            console.error('Error in getAllObituaries:', error);
            return res.status(500).json({ message: 'Server error', error: error.message });
        }
    }

    async createObituary(req, res) {
        try {
            console.log('\n==========================================');
            console.log('CREATE OBITUARY - START');
            console.log('==========================================');
            console.log('1. Headers:', {
                'content-type': req.headers['content-type'],
                'content-length': req.headers['content-length']
            });
            console.log('2. Body keys:', Object.keys(req.body));
            console.log('3. Body data:', req.body);
            console.log('4. Files:', req.files);
            console.log('==========================================\n');

            // Check if multer processed the request
            if (!req.body || Object.keys(req.body).length === 0) {
                console.error('ERROR: req.body is empty - multer may not be working');
                return res.status(400).json({
                    message: 'No form data received',
                    error: 'Request body is empty. Make sure Content-Type is multipart/form-data'
                });
            }

            // Prepare obituary data from form fields
            const obituaryData = {};

            // Copy all non-empty fields from req.body
            Object.keys(req.body).forEach(key => {
                const value = req.body[key];
                if (value !== '' && value !== null && value !== undefined) {
                    // Convert string 'true'/'false' to boolean for isPublished
                    if (key === 'isPublished') {
                        obituaryData[key] = value === 'true' || value === true;
                    } else {
                        obituaryData[key] = value;
                    }
                }
            });

            console.log('5. Processed obituary data:', obituaryData);

            // Validate required fields
            if (!obituaryData.firstName) {
                console.error('ERROR: firstName is missing');
                return res.status(400).json({
                    message: 'Validation failed',
                    error: 'First name is required',
                    received: obituaryData
                });
            }

            if (!obituaryData.lastName) {
                console.error('ERROR: lastName is missing');
                return res.status(400).json({
                    message: 'Validation failed',
                    error: 'Last name is required',
                    received: obituaryData
                });
            }

            // Handle photo upload
            if (req.files && req.files.photo && req.files.photo[0]) {
                obituaryData.photo = `/uploads/obituaries/${req.files.photo[0].filename}`;
                console.log('6. Photo uploaded:', obituaryData.photo);
            }

            // Handle background image upload
            if (req.files && req.files.backgroundImage && req.files.backgroundImage[0]) {
                obituaryData.backgroundImage = `/uploads/obituaries/${req.files.backgroundImage[0].filename}`;
                console.log('7. Background uploaded:', obituaryData.backgroundImage);
            }

            console.log('8. Calling obituaryService.createObituary...');
            const result = await obituaryService.createObituary(obituaryData);

            if (result.success) {
                console.log('9. SUCCESS - Obituary created');
                console.log('==========================================\n');
                return res.status(201).json(result.data);
            }

            console.error('9. FAILED - Service returned error:', result.error);
            console.log('==========================================\n');
            return res.status(500).json({ message: 'Failed to create obituary', error: result.error });
        } catch (error) {
            console.error('\n==========================================');
            console.error('EXCEPTION in createObituary controller:');
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            console.error('==========================================\n');
            return res.status(500).json({
                message: 'Failed to create obituary',
                error: error.message,
                type: error.name
            });
        }
    }

    async updateObituary(req, res) {
        try {
            const { id } = req.params;
            const updateData = {};

            // Copy all non-empty fields from req.body
            Object.keys(req.body).forEach(key => {
                const value = req.body[key];
                if (value !== '' && value !== null && value !== undefined) {
                    if (key === 'isPublished') {
                        updateData[key] = value === 'true' || value === true;
                    } else {
                        updateData[key] = value;
                    }
                }
            });

            // Handle photo upload
            if (req.files && req.files.photo && req.files.photo[0]) {
                updateData.photo = `/uploads/obituaries/${req.files.photo[0].filename}`;
            }

            // Handle background image upload
            if (req.files && req.files.backgroundImage && req.files.backgroundImage[0]) {
                updateData.backgroundImage = `/uploads/obituaries/${req.files.backgroundImage[0].filename}`;
            }

            const result = await obituaryService.updateObituary(id, updateData);

            if (result.success) {
                return res.status(200).json(result.data);
            }
            return res.status(result.statusCode || 500).json({ message: result.error });
        } catch (error) {
            console.error('Error in updateObituary controller:', error);
            return res.status(500).json({ message: 'Failed to update obituary', error: error.message });
        }
    }

    async deleteObituary(req, res) {
        try {
            const { id } = req.params;
            const result = await obituaryService.deleteObituary(id);

            if (result.success) {
                return res.status(200).json({ message: result.message });
            }
            return res.status(result.statusCode || 500).json({ message: result.error });
        } catch (error) {
            console.error('Error in deleteObituary controller:', error);
            return res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
}

module.exports = new ObituaryController();