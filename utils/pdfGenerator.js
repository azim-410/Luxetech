import PDFDocument from 'pdfkit';

export const generatePDFReport = async (orders) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err) => reject(err));

    // Header title
    doc.fillColor('#0f172a').fontSize(20).text('LUXE TECH', { align: 'left' });
    doc.fillColor('#64748b').fontSize(8).text('GLOBAL ORDER DIRECTORY', { align: 'left' });
    doc.moveDown(1);

    // Draw header divider line
    doc.moveTo(30, doc.y).lineTo(565, doc.y).strokeColor('#0f172a').lineWidth(1.5).stroke();
    doc.moveDown(1);

    // Table Header Row
    const tableTop = doc.y;
    doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
    doc.text('Order ID', 35, tableTop, { width: 100 });
    doc.text('Customer', 135, tableTop, { width: 100 });
    doc.text('Email', 235, tableTop, { width: 140 });
    doc.text('Date', 375, tableTop, { width: 70, align: 'center' });
    doc.text('Payment', 445, tableTop, { width: 60, align: 'center' });
    doc.text('Total', 505, tableTop, { width: 60, align: 'right' });

    doc.moveDown(0.5);
    doc.moveTo(30, doc.y).lineTo(565, doc.y).strokeColor('#f1f5f9').lineWidth(1).stroke();
    doc.moveDown(0.5);

    // Data rows
    doc.font('Helvetica').fontSize(8).fillColor('#334155');

    orders.forEach((o, index) => {
      // Check if page needs to be added
      if (doc.y > 750) {
        doc.addPage();
        // Redraw table headers on new page
        const newTop = doc.y;
        doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
        doc.text('Order ID', 35, newTop, { width: 100 });
        doc.text('Customer', 135, newTop, { width: 100 });
        doc.text('Email', 235, newTop, { width: 140 });
        doc.text('Date', 375, newTop, { width: 70, align: 'center' });
        doc.text('Payment', 445, newTop, { width: 60, align: 'center' });
        doc.text('Total', 505, newTop, { width: 60, align: 'right' });
        doc.moveDown(0.5);
        doc.moveTo(30, doc.y).lineTo(565, doc.y).strokeColor('#0f172a').lineWidth(1.5).stroke();
        doc.moveDown(0.5);
        doc.font('Helvetica').fontSize(8).fillColor('#334155');
      }

      const oDate = new Date(o.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      let refunded = 0;
      if (o.items && o.items.length > 0) {
        o.items.forEach(item => {
          if (item.status === 'Cancelled' || item.status === 'Return Confirmed' || item.status === 'Returned') {
            refunded += (item.subtotal || 0);
          }
        });
      }
      const grandTotal = (o.pricing?.grandTotal || 0) - refunded;

      const currentY = doc.y;
      doc.text(`#${o.orderId}`, 35, currentY, { width: 100, ellipsis: true });
      doc.text(o.shippingAddress?.fullName || 'N/A', 135, currentY, { width: 100, ellipsis: true });
      doc.text(o.userId?.email || 'N/A', 235, currentY, { width: 140, ellipsis: true });
      doc.text(oDate, 375, currentY, { width: 70, align: 'center' });
      doc.text(o.paymentStatus || 'Pending', 445, currentY, { width: 60, align: 'center' });
      doc.text(`INR ${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 505, currentY, { width: 60, align: 'right' });

      doc.moveDown(0.5);
      doc.moveTo(30, doc.y).lineTo(565, doc.y).strokeColor('#f1f5f9').lineWidth(0.5).stroke();
      doc.moveDown(0.5);
    });

    // Footer info
    doc.moveDown(1);
    doc.fontSize(8).fillColor('#94a3b8').text('Confidential — Luxe Tech Administration Records', { align: 'center' });

    doc.end();
  });
};

export const generateUserPDFReport = async (users) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err) => reject(err));

    // Header title
    doc.fillColor('#0f172a').fontSize(20).text('LUXE TECH', { align: 'left' });
    doc.fillColor('#64748b').fontSize(8).text('CUSTOMER DIRECTORY REPORT', { align: 'left' });
    doc.moveDown(1);

    // Draw header divider line
    doc.moveTo(30, doc.y).lineTo(565, doc.y).strokeColor('#0f172a').lineWidth(1.5).stroke();
    doc.moveDown(1);

    // Summary Section
    const activeCount = users.filter(u => !u.isBlocked).length;
    const blockedCount = users.filter(u => u.isBlocked).length;
    const totalSpendVal = users.reduce((acc, u) => acc + (u.totalSpend || 0), 0);

    doc.fillColor('#475569').fontSize(8).font('Helvetica-Bold');
    doc.text(`Total Clients: ${users.length}   |   Active: ${activeCount}   |   Blocked: ${blockedCount}   |   Total Value: INR ${totalSpendVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 35, doc.y);
    doc.moveDown(1);
    doc.moveTo(30, doc.y).lineTo(565, doc.y).strokeColor('#f1f5f9').lineWidth(1).stroke();
    doc.moveDown(0.5);

    // Table Header Row
    const tableTop = doc.y;
    doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
    doc.text('Customer Name', 35, tableTop, { width: 140 });
    doc.text('Email Address', 185, tableTop, { width: 180 });
    doc.text('Orders', 375, tableTop, { width: 50, align: 'center' });
    doc.text('Status', 435, tableTop, { width: 60, align: 'center' });
    doc.text('Total Spent', 505, tableTop, { width: 60, align: 'right' });

    doc.moveDown(0.5);
    doc.moveTo(30, doc.y).lineTo(565, doc.y).strokeColor('#f1f5f9').lineWidth(1).stroke();
    doc.moveDown(0.5);

    // Data rows
    doc.font('Helvetica').fontSize(8).fillColor('#334155');

    users.forEach((u, index) => {
      // Check if page needs to be added
      if (doc.y > 750) {
        doc.addPage();
        // Redraw table headers on new page
        const newTop = doc.y;
        doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
        doc.text('Customer Name', 35, newTop, { width: 140 });
        doc.text('Email Address', 185, newTop, { width: 180 });
        doc.text('Orders', 375, newTop, { width: 50, align: 'center' });
        doc.text('Status', 435, newTop, { width: 60, align: 'center' });
        doc.text('Total Spent', 505, newTop, { width: 60, align: 'right' });
        doc.moveDown(0.5);
        doc.moveTo(30, doc.y).lineTo(565, doc.y).strokeColor('#0f172a').lineWidth(1.5).stroke();
        doc.moveDown(0.5);
        doc.font('Helvetica').fontSize(8).fillColor('#334155');
      }

      const currentY = doc.y;
      doc.text(u.name || 'N/A', 35, currentY, { width: 140, ellipsis: true });
      doc.text(u.email || 'N/A', 185, currentY, { width: 180, ellipsis: true });
      doc.text(String(u.ordersCount || 0), 375, currentY, { width: 50, align: 'center' });
      doc.text(u.isBlocked ? 'Blocked' : 'Active', 435, currentY, { width: 60, align: 'center' });
      doc.text(`INR ${(u.totalSpend || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 505, currentY, { width: 60, align: 'right' });

      doc.moveDown(0.5);
      doc.moveTo(30, doc.y).lineTo(565, doc.y).strokeColor('#f1f5f9').lineWidth(0.5).stroke();
      doc.moveDown(0.5);
    });

    // Footer info
    doc.moveDown(1);
    doc.fontSize(8).fillColor('#94a3b8').text('Confidential — Luxe Tech Administration Records', { align: 'center' });

    doc.end();
  });
};

export const generateInvoicePDF = async (order) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err) => reject(err));

    // Header Title
    doc.fillColor('#000000').fontSize(22).font('Helvetica-Bold').text('LUXE TECH', 45, 45);
    doc.fillColor('#94a3b8').fontSize(9).font('Helvetica').text('INVOICE', 45, 70);

    // Order Meta details on the right
    const rightAlignX = 300;
    doc.fillColor('#94a3b8').fontSize(8).font('Helvetica').text('Order', rightAlignX, 45, { align: 'right', width: 250 });
    doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold').text(`#${order.orderId}`, rightAlignX, 55, { align: 'right', width: 250 });
    
    const createdStr = new Date(order.createdAt).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const updatedStr = new Date(order.updatedAt).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const downloadedStr = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    doc.fillColor('#94a3b8').fontSize(7.5).font('Helvetica').text(`Created: ${createdStr}`, rightAlignX, 70, { align: 'right', width: 250 });
    doc.text(`Updated: ${updatedStr}`, rightAlignX, 80, { align: 'right', width: 250 });
    doc.text(`Downloaded: ${downloadedStr}`, rightAlignX, 90, { align: 'right', width: 250 });

    // Divider line
    doc.moveTo(45, 105).lineTo(550, 105).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

    // Bill To & Details Section
    const billToY = 125;
    doc.fillColor('#94a3b8').fontSize(8).font('Helvetica-Bold').text('BILL TO', 45, billToY);
    doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold').text(order.shippingAddress.fullName || 'N/A', 45, billToY + 15);
    
    doc.fillColor('#475569').fontSize(9).font('Helvetica');
    doc.text(order.shippingAddress.streetAddress || '', 45, billToY + 34, { width: 220 });
    doc.text(`${order.shippingAddress.city || ''}, ${order.shippingAddress.state || ''} ${order.shippingAddress.zipCode || ''}`, 45, billToY + 47, { width: 220 });
    doc.text(order.shippingAddress.country || '', 45, billToY + 60);
    doc.text(order.shippingAddress.phoneNumber || '', 45, billToY + 73);
    doc.text(order.userId?.email || '', 45, billToY + 92);

    // Invoice Details (Payment, Status, Order)
    const detailsX = 330;
    doc.fillColor('#94a3b8').fontSize(8).font('Helvetica-Bold').text('DETAILS', detailsX, billToY);
    
    // Label/Value rows helper with symmetric spacing above/below the line
    let detailY = billToY + 15;
    const drawDetailRow = (label, val) => {
      doc.fillColor('#64748b').fontSize(9).font('Helvetica').text(label, detailsX, detailY);
      doc.fillColor('#000000').font('Helvetica-Bold').text(val.toUpperCase(), detailsX + 70, detailY, { align: 'right', width: 150 });
      doc.font('Helvetica');
      doc.moveTo(detailsX, detailY + 12).lineTo(550, detailY + 12).strokeColor('#f1f5f9').lineWidth(0.5).stroke();
      detailY += 22;
    };

    drawDetailRow('Payment', order.paymentMethod || 'N/A');
    drawDetailRow('Status', order.paymentStatus || 'Pending');
    drawDetailRow('Order', order.orderStatus || 'Pending');

    // Divider before table (pushed down for breathing room)
    doc.moveTo(45, 240).lineTo(550, 240).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

    // Table headers
    const tableHeaderY = 255;
    doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold');
    doc.text('ITEM', 45, tableHeaderY, { width: 240 });
    doc.text('UNIT', 320, tableHeaderY, { width: 80, align: 'right' });
    doc.text('QTY', 410, tableHeaderY, { width: 50, align: 'center' });
    doc.text('AMOUNT', 470, tableHeaderY, { width: 80, align: 'right' });

    doc.moveTo(45, tableHeaderY + 12).lineTo(550, tableHeaderY + 12).strokeColor('#1e293b').lineWidth(1).stroke();

    // Table rows
    let rowY = tableHeaderY + 20;
    doc.font('Helvetica').fontSize(9);

    order.items.forEach((item) => {
      const isCancelledOrReturned = ['Cancelled', 'Returned', 'Return Confirmed'].includes(item.status);
      
      // Check for page overflow
      if (rowY > 700) {
        doc.addPage();
        rowY = 50;
        doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold');
        doc.text('ITEM', 45, rowY, { width: 240 });
        doc.text('UNIT', 320, rowY, { width: 80, align: 'right' });
        doc.text('QTY', 410, rowY, { width: 50, align: 'center' });
        doc.text('AMOUNT', 470, rowY, { width: 80, align: 'right' });
        doc.moveTo(45, rowY + 12).lineTo(550, rowY + 12).strokeColor('#1e293b').lineWidth(1).stroke();
        rowY += 20;
      }

      if (isCancelledOrReturned) {
        doc.fillColor('#94a3b8');
      } else {
        doc.fillColor('#000000');
      }

      doc.font('Helvetica-Bold');
      doc.text(item.name || 'N/A', 45, rowY, { width: 240, ellipsis: true });
      doc.font('Helvetica').fontSize(8).fillColor('#94a3b8');
      if (item.variantName) {
        doc.text(item.variantName, 45, rowY + 11, { width: 240 });
      }
      if (isCancelledOrReturned) {
        doc.fillColor('#ef4444').font('Helvetica-Bold').text(`(${item.status})`, 45, rowY + (item.variantName ? 20 : 11));
      }

      doc.fontSize(9);
      if (isCancelledOrReturned) {
        doc.fillColor('#94a3b8');
      } else {
        doc.fillColor('#475569');
      }

      doc.text(`INR ${item.price.toFixed(2)}`, 320, rowY, { width: 80, align: 'right' });
      doc.text(String(item.quantity), 410, rowY, { width: 50, align: 'center' });
      if (!isCancelledOrReturned) doc.fillColor('#000000').font('Helvetica-Bold');
      doc.text(`INR ${item.subtotal.toFixed(2)}`, 470, rowY, { width: 80, align: 'right' });

      const rowHeight = item.variantName ? (isCancelledOrReturned ? 32 : 23) : (isCancelledOrReturned ? 23 : 16);
      rowY += rowHeight;

      doc.moveTo(45, rowY - 2).lineTo(550, rowY - 2).strokeColor('#f8fafc').lineWidth(0.5).stroke();
    });

    // Subtotal pricing block
    if (rowY > 580) {
      doc.addPage();
      rowY = 50;
    }

    const subtotal = order.pricing.subtotal || 0;
    const shipping = order.pricing.shipping || 0;
    const tax = order.pricing.tax || 0;
    const grandTotal = order.pricing.grandTotal || 0;
    const couponCode = order.couponCode || "";
    const refundedAmount = order.pricing.refundedAmount || 0;
    const finalGrandTotal = grandTotal - refundedAmount;

    let couponDiscount = 0;
    let offerDiscount = 0;
    if (typeof order.pricing.couponDiscount !== 'undefined') {
      couponDiscount = order.pricing.couponDiscount || 0;
      offerDiscount = order.pricing.productDiscount || 0;
    } else if (order.couponCode) {
      couponDiscount = order.pricing.discount || 0;
    } else {
      offerDiscount = order.pricing.discount || 0;
    }

    let rightColY = rowY + 15;
    const drawSummaryRow = (label, val, isBold = false, isGreen = false, isRed = false, size = 9) => {
      doc.fillColor('#475569').fontSize(size).font(isBold ? 'Helvetica-Bold' : 'Helvetica');
      if (isGreen) doc.fillColor('#16a34a');
      if (isRed) doc.fillColor('#ef4444');
      if (isBold) doc.fillColor('#000000');
      doc.text(label, 330, rightColY);
      doc.text(val, 450, rightColY, { align: 'right', width: 100 });
      rightColY += 15;
    };

    drawSummaryRow('Subtotal', `INR ${subtotal.toFixed(2)}`);
    if (offerDiscount > 0) {
      drawSummaryRow('Offer Discount', `-INR ${offerDiscount.toFixed(2)}`, false, true);
    }
    if (couponCode) {
      drawSummaryRow(`Coupon (${couponCode})`, `-INR ${couponDiscount.toFixed(2)}`, false, true);
    }
    drawSummaryRow('Shipping', shipping === 0 ? 'FREE' : `INR ${shipping.toFixed(2)}`);
    drawSummaryRow('Tax (8%)', `INR ${tax.toFixed(2)}`);
    
    // Line above Total
    doc.moveTo(330, rightColY).lineTo(550, rightColY).strokeColor('#cbd5e1').lineWidth(0.5).stroke();
    rightColY += 5;
    drawSummaryRow('Total', `INR ${grandTotal.toFixed(2)}`, true);
    
    if (refundedAmount > 0) {
      drawSummaryRow('Refunded', `-INR ${refundedAmount.toFixed(2)}`, true, false, true);
    }

    // Line under Total
    doc.moveTo(330, rightColY).lineTo(550, rightColY).strokeColor('#111111').lineWidth(1.2).stroke();
    rightColY += 7;
    drawSummaryRow('Grand Total', `INR ${finalGrandTotal.toFixed(2)}`, true, false, false, 11);

    // Footer info
    doc.moveTo(45, 735).lineTo(550, 735).strokeColor('#cbd5e1').lineWidth(0.5).stroke();
    doc.fillColor('#94a3b8').fontSize(7.5).font('Helvetica').text('Thank you for shopping with Luxe Tech. For support, contact support@luxetech.com.', 45, 745, { align: 'center', width: 505 });
    doc.text('Luxe Tech Inc.   ·   Computer generated invoice — no signature required.', 45, 755, { align: 'center', width: 505 });

    doc.end();
  });
};
