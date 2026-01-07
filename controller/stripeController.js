
// ==========================================
// 5. NEW: controller/stripeController.js
// Complete Stripe integration with auto-condolence
// ==========================================
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/order');
const Cart = require('../models/cart');
const Product = require('../models/product');
const condolenceService = require('../services/condolenceService');

// Create Payment Intent
exports.createPaymentIntent = async (req, res) => {
    try {
        const { amount, currency = 'usd', metadata = {} } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                error: 'Invalid amount'
            });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency,
            metadata,
            automatic_payment_methods: {
                enabled: true
            }
        });

        res.status(200).json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });
    } catch (error) {
        console.error('Create payment intent error:', error);
        res.status(400).json({
            error: error.message
        });
    }
};

// Confirm Payment and Create Order with Auto-Condolence
exports.confirmPayment = async (req, res) => {
    try {
        console.log('\n==========================================');
        console.log('CONFIRM PAYMENT - START');
        console.log('==========================================');
        console.log('Request body:', req.body);

        const {
            paymentIntentId,
            cartId,
            billingDetails,
            shippingDetails,
            obituaryId,
            obituaryName,
            dedicationMessage
        } = req.body;

        // Validate required fields
        if (!paymentIntentId || !cartId) {
            return res.status(400).json({
                error: 'Payment intent ID and cart ID are required'
            });
        }

        // Verify payment with Stripe
        console.log('1. Verifying payment with Stripe...');
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({
                error: 'Payment not completed',
                status: paymentIntent.status
            });
        }
        console.log('✓ Payment verified');

        // Get cart with products
        console.log('2. Fetching cart...');
        const cart = await Cart.findById(cartId)
            .populate({
                path: 'products.product',
                populate: { path: 'brand' }
            });

        if (!cart) {
            return res.status(404).json({
                error: 'Cart not found'
            });
        }
        console.log(`✓ Cart found with ${cart.products.length} items`);

        // Calculate totals
        const subtotal = cart.products.reduce((sum, item) => {
            return sum + (item.purchasePrice * item.quantity);
        }, 0);

        const taxRate = 0.08; // 8% tax
        const totalTax = subtotal * taxRate;
        const totalWithTax = subtotal + totalTax;

        console.log('3. Creating order...');
        // Create order
        const order = new Order({
            cart: cartId,
            user: req.user?._id || null,
            total: subtotal,
            totalTax,
            totalWithTax,
            stripePaymentIntentId: paymentIntentId,
            paymentStatus: 'succeeded',
            orderStatus: 'processing',
            billingDetails,
            shippingDetails,
            obituaryId: obituaryId || null,
            obituaryName: obituaryName || null,
            dedicationMessage: dedicationMessage || null
        });

        await order.save();
        console.log(`✓ Order created: ${order._id}`);

        // ==========================================
        // AUTO-CREATE CONDOLENCE FOR OBITUARY
        // ==========================================
        let condolenceCreated = false;

        if (obituaryId && cart.products.length > 0) {
            console.log('4. Checking for memorial products...');

            // Filter memorial products (tree, flower, gift)
            const memorialProducts = cart.products.filter(item =>
                item.product &&
                ['tree', 'flower', 'gift'].includes(item.product.type)
            );

            console.log(`Found ${memorialProducts.length} memorial products`);

            if (memorialProducts.length > 0) {
                console.log('5. Creating auto-condolence...');

                const customerName = billingDetails?.name || 'A friend';
                const customerEmail = billingDetails?.email || null;

                // Prepare products data for condolence
                const productsData = memorialProducts.map(item => ({
                    product: item.product,
                    quantity: item.quantity,
                    price: item.purchasePrice,
                    variant: item.variant || null
                }));

                // Create condolence via service
                const condolenceResult = await condolenceService.createCondolenceFromOrder({
                    obituaryId,
                    orderId: order._id,
                    customerName,
                    customerEmail,
                    dedicationMessage,
                    products: productsData
                });

                if (condolenceResult.success) {
                    // Link condolence to order
                    order.condolenceId = condolenceResult.data.condolence._id;
                    await order.save();
                    condolenceCreated = true;
                    console.log(`✓ Condolence created and linked: ${condolenceResult.data.condolence._id}`);
                } else {
                    console.error('✗ Failed to create condolence:', condolenceResult.error);
                }
            }
        }

        // Update product quantities
        console.log('6. Updating product quantities...');
        for (const item of cart.products) {
            if (item.product && item.product._id) {
                await Product.findByIdAndUpdate(
                    item.product._id,
                    { $inc: { quantity: -item.quantity } }
                );
            }
        }
        console.log('✓ Product quantities updated');

        console.log('==========================================');
        console.log('CONFIRM PAYMENT - SUCCESS');
        console.log('==========================================\n');

        res.status(200).json({
            success: true,
            message: condolenceCreated
                ? 'Order placed successfully! Your tribute has been added to the memorial.'
                : 'Order placed successfully!',
            order: {
                _id: order._id,
                total: order.totalWithTax,
                paymentStatus: order.paymentStatus,
                orderStatus: order.orderStatus,
                condolenceCreated
            }
        });

    } catch (error) {
        console.error('\n==========================================');
        console.error('CONFIRM PAYMENT - ERROR');
        console.error('Error:', error);
        console.error('==========================================\n');
        res.status(400).json({
            error: error.message
        });
    }
};

// Cancel Payment Intent
exports.cancelPayment = async (req, res) => {
    try {
        const { paymentIntentId } = req.body;

        const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);

        res.status(200).json({
            success: true,
            paymentIntent
        });
    } catch (error) {
        console.error('Cancel payment error:', error);
        res.status(400).json({
            error: error.message
        });
    }
};

// Get Payment Status
exports.getPaymentStatus = async (req, res) => {
    try {
        const { paymentIntentId } = req.params;

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        res.status(200).json({
            status: paymentIntent.status,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency
        });
    } catch (error) {
        console.error('Get payment status error:', error);
        res.status(400).json({
            error: error.message
        });
    }
};

// Refund Order
exports.refundOrder = async (req, res) => {
    try {
        const { orderId, amount, reason } = req.body;

        const order = await Order.findById(orderId);

        if (!order || !order.stripePaymentIntentId) {
            return res.status(404).json({
                error: 'Order not found or no payment intent'
            });
        }

        const refund = await stripe.refunds.create({
            payment_intent: order.stripePaymentIntentId,
            amount: amount ? Math.round(amount * 100) : undefined,
            reason: reason || 'requested_by_customer'
        });

        // Update order status
        order.paymentStatus = 'cancelled';
        order.orderStatus = 'cancelled';
        await order.save();

        // Delete associated condolence if exists
        if (order.condolenceId) {
            await Condolence.findByIdAndDelete(order.condolenceId);
        }

        res.status(200).json({
            success: true,
            refund
        });
    } catch (error) {
        console.error('Refund error:', error);
        res.status(400).json({
            error: error.message
        });
    }
};
