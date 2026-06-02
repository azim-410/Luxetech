import AddressModel from '../../model/address.js';

const getAddressesService = async (userId) => {
    const addresses = await AddressModel.find({ userId });
    console.log("address in Services = "+addresses)
    return addresses;
}

export {
    getAddressesService,
}