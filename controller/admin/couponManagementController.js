import { getCouponsService, createCouponService, deleteCouponService, updateCouponService } from '../../services/admin/couponManagementService.js';

const getCouponList = async (req, res) => {
    try {
        const { activeCoupons, inactiveCoupons, categories, recentRedemptions } = await getCouponsService();
        res.render('Admin/couponManagement', {
            activeCoupons,
            inactiveCoupons,
            categories,
            recentRedemptions,
            successMessage: req.query.success || null,
            errorMessage: req.query.error || null
        });
    } catch (error) {
        console.error('Get coupon list error:', error.message);
        res.status(500).send('Server error');
    }
};

const createCoupon = async (req, res) => {
    try {
        await createCouponService(req.body);
        res.status(200).json({ success: true, message: 'Coupon created successfully' });
    } catch (error) {
        console.error('Create coupon error:', error.message);
        res.status(400).json({ success: false, message: error.message });
    }
};

const updateCoupon = async (req, res) => {
    try {
        await updateCouponService(req.params.id, req.body);
        res.status(200).json({ success: true, message: 'Coupon updated successfully' });
    } catch (error) {
        console.error('Update coupon error:', error.message);
        res.status(400).json({ success: false, message: error.message });
    }
};

const deleteCoupon = async (req, res) => {
    try {
        await deleteCouponService(req.params.id);
        res.status(200).json({ success: true, message: 'Coupon deleted successfully' });
    } catch (error) {
        console.error('Delete coupon error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export {
    getCouponList,
    createCoupon,
    updateCoupon,
    deleteCoupon
};
