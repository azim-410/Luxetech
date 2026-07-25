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
