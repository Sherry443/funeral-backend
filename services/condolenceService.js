// ==========================================
// services/condolenceService.js
// ==========================================
const Condolence = require('../models/Condolence');
const Obituary = require('../models/Obituary');

class CondolenceService {
    // Get all condolences for a specific obituary
    async getCondolencesByObituaryId(obituaryId, includePrivate = false) {
        try {
            console.log('Fetching condolences for obituary:', obituaryId);

            // Verify obituary exists
            const obituary = await Obituary.findById(obituaryId);
            if (!obituary) {
                return {
                    success: false,
                    statusCode: 404,
                    error: 'Obituary not found'
                };
            }

            // Build query - exclude private condolences unless specified
            const query = { obituaryId };
            if (!includePrivate) {
                query.isPrivate = false;
            }
            query.isApproved = true;  // Only show approved condolences

            const condolences = await Condolence.find(query)
                .sort({ createdAt: -1 })
                .lean();

            return {
                success: true,
                data: {
                    obituaryId,
                    count: condolences.length,
                    condolences
                }
            };
        } catch (error) {
            console.error('Error in getCondolencesByObituaryId:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get condolences by obituary slug
    async getCondolencesBySlug(slug, includePrivate = false) {
        try {
            console.log('Fetching condolences for obituary slug:', slug);

            // Find obituary by slug
            const obituary = await Obituary.findOne({ slug });
            if (!obituary) {
                return {
                    success: false,
                    statusCode: 404,
                    error: 'Obituary not found'
                };
            }

            return await this.getCondolencesByObituaryId(obituary._id, includePrivate);
        } catch (error) {
            console.error('Error in getCondolencesBySlug:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Create a new condolence
    async createCondolence(condolenceData) {
        try {
            console.log('Creating condolence:', condolenceData);

            // Verify obituary exists
            const obituary = await Obituary.findById(condolenceData.obituaryId);
            if (!obituary) {
                return {
                    success: false,
                    statusCode: 404,
                    error: 'Obituary not found'
                };
            }

            // Create the condolence
            const condolence = new Condolence(condolenceData);
            await condolence.save();

            return {
                success: true,
                data: condolence
            };
        } catch (error) {
            console.error('Error in createCondolence:', error);
            if (error.name === 'ValidationError') {
                return {
                    success: false,
                    statusCode: 400,
                    error: Object.values(error.errors).map(e => e.message).join(', ')
                };
            }
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Update a condolence (for moderation)
    async updateCondolence(id, updateData) {
        try {
            console.log('Updating condolence:', id);

            const condolence = await Condolence.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            );

            if (!condolence) {
                return {
                    success: false,
                    statusCode: 404,
                    error: 'Condolence not found'
                };
            }

            return {
                success: true,
                data: condolence
            };
        } catch (error) {
            console.error('Error in updateCondolence:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Delete a condolence
    async deleteCondolence(id) {
        try {
            console.log('Deleting condolence:', id);

            const condolence = await Condolence.findByIdAndDelete(id);

            if (!condolence) {
                return {
                    success: false,
                    statusCode: 404,
                    error: 'Condolence not found'
                };
            }

            return {
                success: true,
                message: 'Condolence deleted successfully'
            };
        } catch (error) {
            console.error('Error in deleteCondolence:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get all condolences (admin view with pagination)
    async getAllCondolences(page = 1, limit = 50) {
        try {
            const skip = (page - 1) * limit;

            const condolences = await Condolence.find()
                .populate('obituaryId', 'firstName lastName slug')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            const total = await Condolence.countDocuments();

            return {
                success: true,
                data: {
                    condolences,
                    pagination: {
                        page,
                        limit,
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            };
        } catch (error) {
            console.error('Error in getAllCondolences:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    async createCondolenceFromOrder(orderData) {
        try {
            const {
                obituaryId,
                orderId,
                customerName,
                customerEmail,
                dedicationMessage,
                products // Array of { product, quantity, price, variant }
            } = orderData;

            // Get first product for details (or combine all)
            const firstProduct = products[0];
            const productType = firstProduct.product.type || 'tree';

            // Build message
            const productSummary = products.map(item => {
                const variantText = item.variant?.name ? ` (${item.variant.name})` : '';
                return `${item.product.name}${variantText} x${item.quantity}`;
            }).join(', ');

            const message = dedicationMessage ||
                `${customerName} planted: ${productSummary}`;

            // Calculate total
            const totalPrice = products.reduce((sum, item) =>
                sum + (item.price * item.quantity), 0
            );

            const condolenceData = {
                obituaryId,
                name: customerName,
                email: customerEmail || null,
                message,
                type: productType,
                orderId,
                isApproved: true, // Auto-approve purchases
                isPrivate: false,
                hasCandle: false,
                productDetails: {
                    productId: firstProduct.product._id,
                    productName: firstProduct.product.name,
                    productType: productType,
                    variantName: firstProduct.variant?.name || null,
                    quantity: products.reduce((sum, item) => sum + item.quantity, 0),
                    totalPrice: totalPrice,
                    sku: firstProduct.product.sku
                }
            };

            const condolence = await Condolence.create(condolenceData);

            console.log(`✓ Auto-created condolence ${condolence._id} for order ${orderId}`);

            return {
                success: true,
                data: { condolence }
            };

        } catch (error) {
            console.error('Error creating condolence from order:', error);
            return { success: false, error: error.message };
        }
    }

    // Get condolence statistics for an obituary
    async getCondolenceStats(obituaryId) {
        try {
            const stats = await Condolence.aggregate([
                { $match: { obituaryId: obituaryId } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        withCandles: { $sum: { $cond: ['$hasCandle', 1, 0] } },
                        private: { $sum: { $cond: ['$isPrivate', 1, 0] } },
                        public: { $sum: { $cond: ['$isPrivate', 0, 1] } }
                    }
                }
            ]);

            return {
                success: true,
                data: stats[0] || { total: 0, withCandles: 0, private: 0, public: 0 }
            };
        } catch (error) {
            console.error('Error in getCondolenceStats:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new CondolenceService();