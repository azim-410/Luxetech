import ExcelJS from 'exceljs';

export const generateExcelReport = async (orders) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Orders Report');

  // Set up columns
  worksheet.columns = [
    { header: 'Order ID', key: 'orderId', width: 25 },
    { header: 'Customer Name', key: 'customerName', width: 25 },
    { header: 'Email Address', key: 'customerEmail', width: 30 },
    { header: 'Order Date', key: 'orderDate', width: 15 },
    { header: 'Payment Status', key: 'paymentStatus', width: 15 },
    { header: 'Total (INR)', key: 'total', width: 15 },
    { header: 'Order Status', key: 'orderStatus', width: 15 }
  ];

  // Styling header row
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F172A' } // Sleek Dark Slate header
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  headerRow.height = 25;

  // Add data rows
  orders.forEach((o) => {
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

    const row = worksheet.addRow({
      orderId: `#${o.orderId}`,
      customerName: o.shippingAddress?.fullName || 'N/A',
      customerEmail: o.userId?.email || 'N/A',
      orderDate: oDate,
      paymentStatus: o.paymentStatus || 'Pending',
      total: grandTotal,
      orderStatus: o.orderStatus || 'Pending'
    });

    // Formatting alignment and numbers
    row.getCell('orderId').alignment = { horizontal: 'left' };
    row.getCell('customerName').alignment = { horizontal: 'left' };
    row.getCell('customerEmail').alignment = { horizontal: 'left' };
    row.getCell('orderDate').alignment = { horizontal: 'center' };
    row.getCell('paymentStatus').alignment = { horizontal: 'center' };
    row.getCell('total').numFormat = '₹#,##0.00';
    row.getCell('total').alignment = { horizontal: 'right' };
    row.getCell('orderStatus').alignment = { horizontal: 'center' };
  });

  // Write workbook to buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};
