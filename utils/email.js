const nodemailer = require('nodemailer');

// Email Transporter Configuration
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Send Order Confirmation Email
exports.sendOrderConfirmationEmail = async (order) => {
    try {
        const products = order.cart.products
            .map(item => {
                const product = item.product;
                return `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">
              ${product.name}
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
              ${item.quantity}
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
              $${item.totalPrice.toFixed(2)}
            </td>
          </tr>
        `;
            })
            .join('');

        const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .order-details { background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .total-row { font-weight: bold; font-size: 16px; }
          .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Order Confirmed!</h1>
          </div>
          
          <div class="content">
            <p>Hi ${order.billingDetails.name},</p>
            <p>Thank you for your order! We've received your payment and are processing your order.</p>
            
            <div class="order-details">
              <h3>Order Details</h3>
              <p><strong>Order ID:</strong> ${order._id}</p>
              <p><strong>Order Date:</strong> ${new Date(order.created).toLocaleDateString()}</p>
              
              <table>
                <thead>
                  <tr style="background-color: #f0f0f0;">
                    <th style="padding: 10px; text-align: left;">Product</th>
                    <th style="padding: 10px; text-align: center;">Quantity</th>
                    <th style="padding: 10px; text-align: right;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${products}
                  <tr>
                    <td colspan="2" style="padding: 10px; text-align: right;"><strong>Subtotal:</strong></td>
                    <td style="padding: 10px; text-align: right;">$${order.total.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding: 10px; text-align: right;"><strong>Tax:</strong></td>
                    <td style="padding: 10px; text-align: right;">$${order.totalTax.toFixed(2)}</td>
                  </tr>
                  <tr class="total-row">
                    <td colspan="2" style="padding: 10px; text-align: right; border-top: 2px solid #333;">Total:</td>
                    <td style="padding: 10px; text-align: right; border-top: 2px solid #333;">$${order.totalWithTax.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
              
              <h4>Shipping Address</h4>
              <p>
                ${order.shippingDetails.name}<br>
                ${order.shippingDetails.address.line1}<br>
                ${order.shippingDetails.address.line2 ? order.shippingDetails.address.line2 + '<br>' : ''}
                ${order.shippingDetails.address.city}, ${order.shippingDetails.address.state} ${order.shippingDetails.address.postal_code}<br>
                ${order.shippingDetails.address.country}
              </p>
            </div>
            
            <p>We'll send you another email when your order ships.</p>
            <p>Thank you for shopping with us!</p>
          </div>
          
          <div class="footer">
            <p>If you have any questions, please contact our support team.</p>
            <p>&copy; ${new Date().getFullYear()} Your Store Name. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: order.billingDetails.email,
            subject: `Order Confirmation - #${order._id}`,
            html: emailHTML
        });

        console.log('✅ Order confirmation email sent');
    } catch (error) {
        console.error('Error sending confirmation email:', error);
    }
};

// Send Payment Failed Email
exports.sendPaymentFailedEmail = async (order) => {
    try {
        const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Payment Failed</h1>
          </div>
          <div class="content">
            <p>Hi ${order.billingDetails.name},</p>
            <p>Unfortunately, your payment for order #${order._id} could not be processed.</p>
            <p>Please check your payment method and try again.</p>
            <p>If you continue to experience issues, please contact your bank or try a different payment method.</p>
            <p>Thank you for your understanding.</p>
          </div>
        </div>
      </body>
      </html>
    `;

        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: order.billingDetails.email,
            subject: `Payment Failed - Order #${order._id}`,
            html: emailHTML
        });

        console.log('❌ Payment failed email sent');
    } catch (error) {
        console.error('Error sending payment failed email:', error);
    }
};