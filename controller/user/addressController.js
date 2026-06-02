import {
    getAddressesService,
    addAddressService
} from '../../services/user/addressService.js'

const getAddresses = async (req, res) => {
    try {
        const userId = req.session?.user?.id || req.user?._id;
        if (!userId) {
            return res.redirect('/login');
        }
        const address = await getAddressesService(userId);
        const user = req.session?.user || req.user;
        res.render('User/address.ejs', { address, user });
    } catch (error) {
        console.log("controller Err = " + error);
        res.status(500).json({ success: false, message: error.message });
    }
}
const addAddress = async (req, res) => {
    try {
        const userId = req.session?.user?.id || req.user?._id;
        if (!userId) return res.redirect('/login');
        await addAddressService(userId, req.body);
        return res.redirect('/address');
    } catch (error) {
        console.error("addAddressControllerError: " + error);
        // If validation error, re-render with errors and form data
        if (error.statusCode === 400 && error.errors) {
            const userId = req.session?.user?.id || req.user?._id;
            const user = req.session?.user || req.user;
            const address = await getAddressesService(userId);
            return res.render('User/address.ejs', {
                address,
                user,
                errors: error.errors,
                formData: req.body
            });
        }
        res.status(500).json({ success: false, message: error.message });
    }
}
export {
    getAddresses,
    addAddress
}