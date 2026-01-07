const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Stripe Service
 * Handles all Stripe API interactions
 */

class StripeService {
    /**
     * Create a payment intent
     * @param {Object} params - Payment intent parameters
     * @param {number} params.amount - Amount in dollars (will be converted to cents)
     * @param {string} params.currency - Currency code (default: 'usd')
     * @param {Object} params.metadata - Additional metadata
     * @returns {Promise<Object>} Payment intent details
     */
    async createPaymentIntent({ amount, currency = 'usd', metadata = {} }) {
        try {
            // Convert dollars to cents for Stripe
            const amountInCents = Math.round(amount * 100);

            console.log('💳 Creating Stripe payment intent:', {
                amount: amountInCents,
                currency,
                metadata
            });

            const paymentIntent = await stripe.paymentIntents.create({
                amount: amountInCents,
                currency: currency.toLowerCase(),
                metadata,
                automatic_payment_methods: {
                    enabled: true,
                },
            });

            console.log('✅ Payment intent created:', paymentIntent.id);

            return {
                paymentIntentId: paymentIntent.id,
                clientSecret: paymentIntent.client_secret,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                status: paymentIntent.status,
            };
        } catch (error) {
            console.error('❌ Stripe createPaymentIntent error:', error);
            throw new Error(error.message || 'Failed to create payment intent');
        }
    }

    /**
     * Retrieve a payment intent
     * @param {string} paymentIntentId - Payment intent ID
     * @returns {Promise<Object>} Payment intent details
     */
    async retrievePaymentIntent(paymentIntentId) {
        try {
            console.log('🔍 Retrieving payment intent:', paymentIntentId);

            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

            console.log('✅ Payment intent retrieved:', {
                id: paymentIntent.id,
                status: paymentIntent.status
            });

            return paymentIntent;
        } catch (error) {
            console.error('❌ Stripe retrievePaymentIntent error:', error);
            throw new Error(error.message || 'Failed to retrieve payment intent');
        }
    }

    /**
     * Cancel a payment intent
     * @param {string} paymentIntentId - Payment intent ID
     * @returns {Promise<Object>} Cancelled payment intent
     */
    async cancelPaymentIntent(paymentIntentId) {
        try {
            console.log('🚫 Cancelling payment intent:', paymentIntentId);

            const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);

            console.log('✅ Payment intent cancelled:', paymentIntent.id);

            return paymentIntent;
        } catch (error) {
            console.error('❌ Stripe cancelPaymentIntent error:', error);
            throw new Error(error.message || 'Failed to cancel payment intent');
        }
    }

    /**
     * Create a refund
     * @param {string} paymentIntentId - Payment intent ID
     * @param {number} amount - Amount to refund in dollars (optional, full refund if not provided)
     * @returns {Promise<Object>} Refund details
     */
    async createRefund(paymentIntentId, amount = null) {
        try {
            console.log('💸 Creating refund for payment intent:', paymentIntentId);

            const refundData = {
                payment_intent: paymentIntentId,
            };

            // If specific amount provided, convert to cents
            if (amount) {
                refundData.amount = Math.round(amount * 100);
            }

            const refund = await stripe.refunds.create(refundData);

            console.log('✅ Refund created:', refund.id);

            return refund;
        } catch (error) {
            console.error('❌ Stripe createRefund error:', error);
            throw new Error(error.message || 'Failed to create refund');
        }
    }

    /**
     * Update payment intent
     * @param {string} paymentIntentId - Payment intent ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Updated payment intent
     */
    async updatePaymentIntent(paymentIntentId, updateData) {
        try {
            console.log('🔄 Updating payment intent:', paymentIntentId);

            const paymentIntent = await stripe.paymentIntents.update(
                paymentIntentId,
                updateData
            );

            console.log('✅ Payment intent updated:', paymentIntent.id);

            return paymentIntent;
        } catch (error) {
            console.error('❌ Stripe updatePaymentIntent error:', error);
            throw new Error(error.message || 'Failed to update payment intent');
        }
    }

    /**
     * Confirm a payment intent (used for server-side confirmation)
     * @param {string} paymentIntentId - Payment intent ID
     * @param {Object} confirmData - Confirmation data
     * @returns {Promise<Object>} Confirmed payment intent
     */
    async confirmPaymentIntent(paymentIntentId, confirmData = {}) {
        try {
            console.log('✔️ Confirming payment intent:', paymentIntentId);

            const paymentIntent = await stripe.paymentIntents.confirm(
                paymentIntentId,
                confirmData
            );

            console.log('✅ Payment intent confirmed:', paymentIntent.id);

            return paymentIntent;
        } catch (error) {
            console.error('❌ Stripe confirmPaymentIntent error:', error);
            throw new Error(error.message || 'Failed to confirm payment intent');
        }
    }

    /**
     * Create a customer
     * @param {Object} customerData - Customer data
     * @returns {Promise<Object>} Customer details
     */
    async createCustomer(customerData) {
        try {
            console.log('👤 Creating Stripe customer');

            const customer = await stripe.customers.create(customerData);

            console.log('✅ Customer created:', customer.id);

            return customer;
        } catch (error) {
            console.error('❌ Stripe createCustomer error:', error);
            throw new Error(error.message || 'Failed to create customer');
        }
    }

    /**
     * Retrieve a customer
     * @param {string} customerId - Customer ID
     * @returns {Promise<Object>} Customer details
     */
    async retrieveCustomer(customerId) {
        try {
            console.log('🔍 Retrieving customer:', customerId);

            const customer = await stripe.customers.retrieve(customerId);

            console.log('✅ Customer retrieved:', customer.id);

            return customer;
        } catch (error) {
            console.error('❌ Stripe retrieveCustomer error:', error);
            throw new Error(error.message || 'Failed to retrieve customer');
        }
    }

    /**
     * List all payment methods for a customer
     * @param {string} customerId - Customer ID
     * @returns {Promise<Array>} List of payment methods
     */
    async listPaymentMethods(customerId) {
        try {
            console.log('💳 Listing payment methods for customer:', customerId);

            const paymentMethods = await stripe.paymentMethods.list({
                customer: customerId,
                type: 'card',
            });

            console.log('✅ Payment methods retrieved:', paymentMethods.data.length);

            return paymentMethods.data;
        } catch (error) {
            console.error('❌ Stripe listPaymentMethods error:', error);
            throw new Error(error.message || 'Failed to list payment methods');
        }
    }

    /**
     * Create a setup intent for saving payment method
     * @param {string} customerId - Customer ID
     * @returns {Promise<Object>} Setup intent details
     */
    async createSetupIntent(customerId) {
        try {
            console.log('🔐 Creating setup intent for customer:', customerId);

            const setupIntent = await stripe.setupIntents.create({
                customer: customerId,
                automatic_payment_methods: {
                    enabled: true,
                },
            });

            console.log('✅ Setup intent created:', setupIntent.id);

            return {
                setupIntentId: setupIntent.id,
                clientSecret: setupIntent.client_secret,
            };
        } catch (error) {
            console.error('❌ Stripe createSetupIntent error:', error);
            throw new Error(error.message || 'Failed to create setup intent');
        }
    }
}

// Export a singleton instance
module.exports = new StripeService();