import { getAddressesService } from '../../services/user/addressService.js'

const getAddresses = async (req, res) => {
    try {
        const userId = req.session?.user?.id || req.user?._id;
        if (!userId) {
            return res.redirect('/login');
        }
        const address = await getAddressesService(userId);
        res.render('User/address.ejs', { address });
    } catch (error) {
        console.log("controller Err = "+error)
        res.status(500).json({ success: false, messgae: error.message })
    }
}

export {
    getAddresses,
}