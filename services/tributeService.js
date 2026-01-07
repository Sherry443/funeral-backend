// ==========================================
// services/tributeService.js
// ==========================================
const Tribute = require('../models/Tribute');

class TributeService {
    // Get tributes by obituary
    async getTributesByObituary(req, res) {
        try {
            const { obituaryId } = req.params;

            const tributes = await Tribute.find({
                obituaryId,
                isApproved: true
            })
                .sort({ createdAt: -1 })
                .lean();

            res.status(200).json(tributes);
        } catch (error) {
            console.error('Error fetching tributes:', error);
            res.status(500).json({
                message: 'Failed to fetch tributes',
                error: error.message
            });
        }
    }

    // Create tribute
    async createTribute(req, res) {
        try {
            const { name, email, message, obituaryId } = req.body;

            if (!name || !message || !obituaryId) {
                return res.status(400).json({
                    message: 'Name, message, and obituaryId are required'
                });
            }

            const initial = name.charAt(0).toUpperCase();

            const tribute = new Tribute({
                obituaryId,
                name,
                email,
                message,
                initial,
                isApproved: false // Admin approval required
            });

            await tribute.save();
            res.status(201).json(tribute);
        } catch (error) {
            console.error('Error creating tribute:', error);
            res.status(500).json({
                message: 'Failed to create tribute',
                error: error.message
            });
        }
    }

    // Update tribute
    async updateTribute(req, res) {
        try {
            const { id } = req.params;
            const tribute = await Tribute.findByIdAndUpdate(
                id,
                req.body,
                { new: true, runValidators: true }
            );

            if (!tribute) {
                return res.status(404).json({ message: 'Tribute not found' });
            }

            res.status(200).json(tribute);
        } catch (error) {
            console.error('Error updating tribute:', error);
            res.status(500).json({
                message: 'Failed to update tribute',
                error: error.message
            });
        }
    }

    // Delete tribute
    async deleteTribute(req, res) {
        try {
            const { id } = req.params;
            const tribute = await Tribute.findByIdAndDelete(id);

            if (!tribute) {
                return res.status(404).json({ message: 'Tribute not found' });
            }

            res.status(200).json({ message: 'Tribute deleted successfully' });
        } catch (error) {
            console.error('Error deleting tribute:', error);
            res.status(500).json({
                message: 'Failed to delete tribute',
                error: error.message
            });
        }
    }

    // Approve tribute
    async approveTribute(req, res) {
        try {
            const { id } = req.params;
            const tribute = await Tribute.findByIdAndUpdate(
                id,
                { isApproved: true },
                { new: true }
            );

            if (!tribute) {
                return res.status(404).json({ message: 'Tribute not found' });
            }

            res.status(200).json(tribute);
        } catch (error) {
            console.error('Error approving tribute:', error);
            res.status(500).json({
                message: 'Failed to approve tribute',
                error: error.message
            });
        }
    }
}

module.exports = new TributeService();
