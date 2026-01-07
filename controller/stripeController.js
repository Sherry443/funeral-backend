/**
 * STRIPE CONTROLLER - HANDLES MISSING CART ID
 * This version can work even without cart ID in localStorage
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/order');
const Cart = require('../models/cart');
const Product = require('../models/product');

/**
 * Create Payment Intent - ENHANCED VERSION
 * Can handle: cart ID, products array, or find user's cart
 */
exports.createPaymentIntent = async (req, res) => {
    console.log('\n========================================');
    console.log('🔵 CREATE PAYMENT INTENT - START');
    console.log('========================================');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    try {
        let { cartId, amount, products, billingDetails, shippingDetails } = req.body;
        let cart = null;

        // ========================================
        // STRATEGY 1: Use provided cart ID
        // ========================================
        if (cartId) {
            console.log('1️⃣ Using provided cart ID:', cartId);
            cart = await Cart.findById(cartId)
                .populate({
                    path: 'products.product',
                    populate: { path: 'brand' }
                });

            if (!cart) {
                console.warn('⚠️ Cart ID provided but not found in database');
            } else {
                console.log('✓ Cart found by ID');
            }
        }

        // ========================================
        // STRATEGY 2: Find user's latest cart
        // ========================================
        if (!cart && req.user) {
            console.log('2️⃣ No cart ID, trying to find user cart...');
            cart = await Cart.findOne({
                user: req.user._id
            })
                .sort({ created: -1 })
                .populate({
                    path: 'products.product',
                    populate: { path: 'brand' }
                });

            if (cart) {
                console.log('✓ Found user cart:', cart._id);
                cartId = cart._id.toString();
            }
        }

        // ========================================
        // STRATEGY 3: Create cart from products array
        // ========================================
        if (!cart && products && products.length > 0) {
            console.log('3️⃣ No cart found, creating from products array...');
            console.log('Products to add:', products);

            // Fetch full product details
            const productIds = products.map(p => p.product);
            const fullProducts = await Product.find({ _id: { $in: productIds } });

            // Create cart items with proper pricing
            const cartItems = products.map(p => {
                const fullProduct = fullProducts.find(fp =>
                    fp._id.toString() === p.product.toString()
                );

                return {
                    product: p.product,
                    quantity: p.quantity,
                    purchasePrice: p.price || fullProduct?.price || 0,
                    totalPrice: (p.price || fullProduct?.price || 0) * p.quantity,
                    status: 'Not processed'
                };
            });

            // Create new cart
            cart = new Cart({
                user: req.user?._id || null,
                products: cartItems,
                created: new Date()
            });

            await cart.save();
            cartId = cart._id.toString();
            console.log('✓ New cart created:', cartId);

            // Populate for calculations
            cart = await Cart.findById(cartId)
                .populate({
                    path: 'products.product',
                    populate: { path: 'brand' }
                });
        }

        // ========================================
        // VALIDATION: Must have cart by now
        // ========================================
        if (!cart) {
            console.error('❌ Could not find or create cart');
            console.error('   - No cart ID provided');
            console.error('   - No user logged in to find cart');
            console.error('   - No products array to create cart');
            return res.status(400).json({
                error: 'Could not find or create cart. Please add items to cart first.'
            });
        }

        if (!cart.products || cart.products.length === 0) {
            console.error('❌ Cart is empty');
            return res.status(400).json({
                error: 'Cart is empty. Please add items to cart first.'
            });
        }

        console.log(`✓ Using cart: ${cart._id} with ${cart.products.length} items`);

        // ========================================
        // CALCULATE TOTALS
        // ========================================
        console.log('4️⃣ Calculating totals...');
        const subtotal = cart.products.reduce((sum, item) => {
            const itemPrice = item.purchasePrice || item.product?.price || 0;
            const itemTotal = itemPrice * item.quantity;
            console.log(`   - ${item.product?.name || 'Unknown'}: $${itemPrice} x ${item.quantity} = $${itemTotal.toFixed(2)}`);
            return sum + itemTotal;
        }, 0);

        const taxRate = 0.08; // 8% tax
        const totalTax = subtotal * taxRate;
        const totalWithTax = subtotal + totalTax;

        console.log('✓ Totals:', {
            subtotal: `$${subtotal.toFixed(2)}`,
            tax: `$${totalTax.toFixed(2)}`,
            total: `$${totalWithTax.toFixed(2)}`
        });

        // ========================================
        // CREATE PENDING ORDER
        // ========================================
        console.log('5️⃣ Creating pending order...');
        const order = new Order({
            cart: cart._id,
            user: req.user?._id || null,
            total: subtotal,
            totalTax,
            totalWithTax,
            paymentStatus: 'pending',
            orderStatus: 'pending',
            billingDetails: billingDetails || null,
            shippingDetails: shippingDetails || null
        });

        await order.save();
        console.log('✓ Order created:', order._id);

        // ========================================
        // CREATE STRIPE PAYMENT INTENT
        // ========================================
        console.log('6️⃣ Creating Stripe payment intent...');

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(totalWithTax * 100), // Convert to cents
            currency: 'usd',
            metadata: {
                orderId: order._id.toString(),
                cartId: cart._id.toString(),
                userId: req.user?._id?.toString() || 'guest'
            },
            automatic_payment_methods: {
                enabled: true
            }
        });

        console.log('✅ Stripe payment intent created:', paymentIntent.id);

        // Link payment intent to order
        order.stripePaymentIntentId = paymentIntent.id;
        await order.save();

        console.log('========================================');
        console.log('✅ CREATE PAYMENT INTENT - SUCCESS');
        console.log('========================================\n');

        res.status(200).json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            orderId: order._id,
            cartId: cart._id, // ✅ RETURN CART ID SO FRONTEND CAN SAVE IT
            amount: totalWithTax,
            tax: totalTax
        });

    } catch (error) {
        console.error('\n========================================');
        console.error('❌ CREATE PAYMENT INTENT - ERROR');
        console.error('========================================');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        console.error('========================================\n');

        res.status(400).json({
            error: error.message || 'Failed to create payment intent'
        });
    }
};

/**
 * Confirm Payment - Same as before
 */
exports.confirmPayment = async (req, res) => {
    console.log('\n========================================');
    console.log('🔵 CONFIRM PAYMENT - START');
    console.log('========================================');

    try {
        const { paymentIntentId, orderId, cartId } = req.body;

        if (!paymentIntentId) {
            return res.status(400).json({
                error: 'Payment intent ID is required'
            });
        }

        // Verify payment with Stripe
        console.log('1️⃣ Verifying payment with Stripe...');
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
            console.error('❌ Payment not completed. Status:', paymentIntent.status);
            return res.status(400).json({
                error: 'Payment not completed',
                status: paymentIntent.status
            });
        }

        console.log('✓ Payment verified');

        // Get order - try by orderId first, then by paymentIntentId
        console.log('2️⃣ Fetching order...');
        let order;

        if (orderId) {
            order = await Order.findById(orderId)
                .populate({
                    path: 'cart',
                    populate: {
                        path: 'products.product',
                        populate: { path: 'brand' }
                    }
                });
        }

        if (!order) {
            // Try finding by payment intent ID
            order = await Order.findOne({ stripePaymentIntentId: paymentIntent.id })
                .populate({
                    path: 'cart',
                    populate: {
                        path: 'products.product',
                        populate: { path: 'brand' }
                    }
                });
        }

        if (!order) {
            console.error('❌ Order not found');
            return res.status(404).json({ error: 'Order not found' });
        }

        console.log('✓ Order found:', order._id);

        // Update order status
        console.log('3️⃣ Updating order...');
        order.paymentStatus = 'succeeded';
        order.orderStatus = 'processing';
        await order.save();
        console.log('✓ Order updated');

        // Update product quantities
        console.log('4️⃣ Updating product quantities...');
        const cart = order.cart;
        for (const item of cart.products) {
            if (item.product && item.product._id) {
                await Product.findByIdAndUpdate(
                    item.product._id,
                    { $inc: { quantity: -item.quantity } }
                );
                console.log(`   ✓ ${item.product.name}: -${item.quantity}`);
            }
        }

        console.log('========================================');
        console.log('✅ CONFIRM PAYMENT - SUCCESS');
        console.log('========================================\n');

        res.status(200).json({
            success: true,
            message: 'Order placed successfully!',
            order: {
                _id: order._id,
                total: order.totalWithTax,
                paymentStatus: order.paymentStatus,
                orderStatus: order.orderStatus
            }
        });

    } catch (error) {
        console.error('\n========================================');
        console.error('❌ CONFIRM PAYMENT - ERROR');
        console.error('========================================');
        console.error('Error:', error.message);
        console.error('========================================\n');

        res.status(400).json({
            error: error.message || 'Failed to confirm payment'
        });
    }
};

// Cancel, Get Status, and Refund - Same as before
exports.cancelPayment = async (req, res) => {
    try {
        const { paymentIntentId, orderId } = req.body;

        if (paymentIntentId) {
            await stripe.paymentIntents.cancel(paymentIntentId);
        }

        if (orderId) {
            const order = await Order.findById(orderId);
            if (order) {
                order.paymentStatus = 'cancelled';
                order.orderStatus = 'cancelled';
                await order.save();
            }
        }

        res.status(200).json({ success: true, message: 'Payment cancelled' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

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
        res.status(400).json({ error: error.message });
    }
};

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

        order.paymentStatus = 'refunded';
        order.orderStatus = 'cancelled';
        await order.save();

        const cart = await Cart.findById(order.cart);
        if (cart) {
            for (const item of cart.products) {
                await Product.findByIdAndUpdate(
                    item.product,
                    { $inc: { quantity: item.quantity } }
                );
            }
        }

        res.status(200).json({ success: true, refund });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};