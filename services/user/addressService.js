import AddressModel from '../../model/address.js';
import axios from 'axios';
const getAddressesService = async (userId) => {
    const addresses = await AddressModel.find({ userId });
    // console.log("address in Services = "+addresses)
    return addresses;
}


const addAddressService = async (userId,addressData) => {

    console.log("reach services")
    const { fullName, streetAddress, city, zipCode, state, country, phoneNumber, type, isDefault } = addressData;
    const errors = {}
    if (!fullName || fullName.trim() === '') errors.fullName = "Full name is required.";
    if (!streetAddress || streetAddress.trim() === '') errors.streetAddress = "Street address is required.";
    if (!city || city.trim() === '') errors.city = "City is required.";
    if (!state || state.trim() === '') errors.state = "State is required.";
    if (!country || country.trim() === '') errors.country = "Country is required.";
    if (!zipCode || zipCode.trim() === '') errors.zipCode = "Zip code is required.";

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
        errors.phoneNumber = "Please enter a valid 10-digit phone number.";
    }
    console.log("error"+errors)

    if (Object.keys(errors).length > 0) {
        const error = new Error("Validation failed");
        error.statusCode = 400;
        error.errors = errors;
        throw error;
    }

    
    if (isDefault) {
        await AddressModel.updateMany({ userId }, { isDefault: false });
    }

    const newAddress = new AddressModel({
        userId,
        fullName,
        streetAddress,
        city,
        zipCode,
        state,
        country,
        phoneNumber,
        type: type || 'home',
        isDefault:isDefault === 'true' || isDefault === 'on'
    });

    await newAddress.save();

    return({success:true,})
}
const editAddressService = async (addressId, addressData) => {

    const { fullName, streetAddress, city, zipCode, state, country, phoneNumber, type, isDefault } = addressData;

    const errors = {};
    if (!fullName || fullName.trim() === '') errors.fullName = 'Full name is required.';
    if (!streetAddress || streetAddress.trim() === '')errors.streetAddress  = 'Street address is required.';
    if (!city || city.trim() === '')  errors.city  = 'City is required.';
    if (!state || state.trim() === '')   errors.state = 'State is required.';
    if (!country || country.trim() === '') errors.country = 'Country is required.';
    if (!zipCode || zipCode.trim() === '') errors.zipCode = 'Zip code is required.';

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
        errors.phoneNumber = 'Please enter a valid 10-digit phone number.';
    }

    if (Object.keys(errors).length > 0) {
        const error = new Error('Validation failed');
        error.statusCode = 400;
        error.errors = errors;
        throw error;
    }

    // ── If marking as default, clear others first ──
    if (isDefault === 'true' || isDefault === 'on') {
        const existing = await AddressModel.findById(addressId);
        if (existing) {
            await AddressModel.updateMany({ userId: existing.userId }, { isDefault: false });
        }
    }

    // ── Update the document ──
    const updated = await AddressModel.findByIdAndUpdate(
        addressId,
        {
            fullName,
            streetAddress,
            city,
            zipCode,
            state,
            country,
            phoneNumber,
            type: type || 'home',
            isDefault: isDefault === 'true' || isDefault === 'on'
        },
        { new: true }   // return the updated doc
    );

    return updated;
};

export {
    getAddressesService,
    addAddressService,
    editAddressService
}