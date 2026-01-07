const express = require('express');
const router = express.Router();
const Order = require('../../models/order');
const Cart = require('../../models/cart');
const Product = require('../../models/product');
const stripeService = require('../../services/stripe');
const mailgun = require('../../services/mailgun');

/**
 * @route   POST /api/webhook/stripe
 * @desc    Handle Stripe webhook events
 * @access  Public (but verified)
 * 
 * IMPORTANT: This endpoint should use raw body parser
 * Add this middleware in your app.js BEFORE express.json():
 * 
 * app.use('/api/webhook/stripe', express.raw({ type: 'application/json' }));
 */
router.post('/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        // Verify webhook signature
        event = stripeService.constructWebhookEvent(req.body, sig);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    try {
        switch (event.type) {
            case 'payment_intent.succeeded':
                await handlePaymentIntentSucceeded(event.data.object);
                break;

            case 'payment_intent.payment_failed':
                await handlePaymentIntentFailed(event.data.object);
                break;

            case 'payment_intent.canceled':
                await handlePaymentIntentCanceled(event.data.object);
                break;

            case 'charge.refunded':
                await handleChargeRefunded(event.data.object);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook handler error:', error);
        res.status(500).json({ error: 'Webhook handler failed' });
    }
});

/**
 * Handle successful payment
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
    console.log('Payment succeeded:', paymentIntent.id);

    try {
        // Find order by payment intent ID
        const order = await Order.findOne({
            stripePaymentIntentId: paymentIntent.id
        });

        if (order) {
            // Update order status
            order.paymentStatus = 'succeeded';
            order.orderStatus = 'processing';
            await order.save();

            console.log(`Order ${order._id} payment confirmed`);
        } else {
            console.log('Order not found for payment intent:', paymentIntent.id);
            // This is normal if webhook arrives before order is created
            // The order will be created with succeeded status
        }
    } catch (error) {
        console.error('Error handling payment success:', error);
        throw error;
    }
}

/**
 * Handle failed payment
 */
async function handlePaymentIntentFailed(paymentIntent) {
    console.log('Payment failed:', paymentIntent.id);

    try {
        const order = await Order.findOne({
            stripePaymentIntentId: paymentIntent.id
        });

        if (order) {
            // Update order status
            order.paymentStatus = 'failed';
            order.orderStatus = 'cancelled';
            await order.save();

            // Restore product quantities
            const cart = await Cart.findById(order.cart);
            if (cart) {
                await restoreProductQuantities(cart.products);
            }

            console.log(`Order ${order._id} marked as failed`);
        }
    } catch (error) {
        console.error('Error handling payment failure:', error);
        throw error;
    }
}

/**
 * Handle canceled payment
 */
async function handlePaymentIntentCanceled(paymentIntent) {
    console.log('Payment canceled:', paymentIntent.id);

    try {
        const order = await Order.findOne({
            stripePaymentIntentId: paymentIntent.id
        });

        if (order) {
            // Update order status
            order.paymentStatus = 'cancelled';
            order.orderStatus = 'cancelled';
            await order.save();

            // Restore product quantities
            const cart = await Cart.findById(order.cart);
            if (cart) {
                await restoreProductQuantities(cart.products);
            }

            console.log(`Order ${order._id} cancelled`);
        }
    } catch (error) {
        console.error('Error handling payment cancellation:', error);
        throw error;
    }
}

/**
 * Handle refund
 */
async function handleChargeRefunded(charge) {
    console.log('Charge refunded:', charge.id);

    try {
        const order = await Order.findOne({
            stripePaymentIntentId: charge.payment_intent
        });

        if (order) {
            // Update order status
            order.paymentStatus = 'cancelled';
            order.orderStatus = 'cancelled';
            await order.save();

            // Restore product quantities
            const cart = await Cart.findById(order.cart);
            if (cart) {
                await restoreProductQuantities(cart.products);
            }

            console.log(`Order ${order._id} refunded`);
        }
    } catch (error) {
        console.error('Error handling refund:', error);
        throw error;
    }
}

/**
 * Helper: Restore product quantities
 */
async function restoreProductQuantities(products) {
    const bulkOptions = products.map(item => ({
        updateOne: {
            filter: { _id: item.product },
            update: { $inc: { quantity: item.quantity } }
        }
    }));

    await Product.bulkWrite(bulkOptions);
    console.log('Product quantities restored');
}

module.exports = router;