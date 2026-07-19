import { getOfferProductsService } from '../../services/user/offersService.js';

export const getOffersPage = async (req, res) => {
    try {
        const serviceResult = await getOfferProductsService(req.query);

        res.render('User/offers', {
            products: serviceResult.products,
            categories: serviceResult.categories,
            selectedCategories: serviceResult.selectedCategories,
            selectedPrices: serviceResult.selectedPrices,
            selectedSort: serviceResult.selectedSort,
            selectedSearch: serviceResult.selectedSearch || '',
            user: req.session.user || req.user || null
        });
    } catch (error) {
        console.error('getOffersPage error:', error);
        res.status(500).send('Internal Server Error');
    }
};
