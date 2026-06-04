// import { errorMonitor } from 'nodemailer/lib/xoauth2/index.js';
import AddressModel from '../../model/address.js';
import axios from 'axios';
const getAddressesService = async (userId) => {
    const addresses = await AddressModel.find({ userId });
    // console.log("address in Services = "+addresses)
    return addresses;
}


// ── Validation helpers ───────────────────────────────────────
const LETTERS_SPACES = /^[A-Za-z\s]+$/;       
const ZIP_REGEX      = /^[A-Za-z0-9]{4,10}$/; 
const PHONE_REGEX    = /^[0-9]{10}$/;          
const address_regex  = /^[a-zA-Z0-9\s,.'#-]{5,100}$/ 

const validateAddressData = ({ fullName, streetAddress, city, zipCode, state, country, phoneNumber }) => {
    const errors = {};

    // ─ Full Name ─
    if (!fullName || fullName.trim() === '') {
        errors.fullName = 'Full name is required.';
    } else if (fullName.trim().length < 3) {
        errors.fullName = 'Full name must be at least 3 characters.';
    } else if (fullName.trim().length > 60) {
        errors.fullName = 'Full name must not exceed 60 characters.';
    } else if (!LETTERS_SPACES.test(fullName.trim())) {
        errors.fullName = 'Full name must contain only letters and spaces.';
    }

    // ─ Street Address ─
    if (!streetAddress || streetAddress.trim() === '') {
        errors.streetAddress = 'Street address is required.';
    } else if (streetAddress.trim().length < 5) {
        errors.streetAddress = 'Street address must be at least 5 characters.';
    } else if (streetAddress.trim().length > 120) {
        errors.streetAddress = 'Street address must not exceed 120 characters.';
    } else if(!address_regex.test(streetAddress.trim())){
        errors.streetAddress = 'Street address must be letters and numbers.';
    }

    // ─ City ─
    if (!city || city.trim() === '') {
        errors.city = 'City is required.';
    } else if (city.trim().length < 2) {
        errors.city = 'City name must be at least 2 characters.';
    } else if (city.trim().length > 60) {
        errors.city = 'City name must not exceed 60 characters.';
    } else if (!LETTERS_SPACES.test(city.trim())) {
        errors.city = 'City name must contain only letters and spaces.';
    }

    // ─ State ─
    if (!state || state.trim() === '') {
        errors.state = 'State is required.';
    } else if (state.trim().length < 2) {
        errors.state = 'State name must be at least 2 characters.';
    } else if (state.trim().length > 60) {
        errors.state = 'State name must not exceed 60 characters.';
    } else if (!LETTERS_SPACES.test(state.trim())) {
        errors.state = 'State name must contain only letters and spaces.';
    }

    // ─ Country ─
    if (!country || country.trim() === '') {
        errors.country = 'Country is required.';
    } else if (country.trim().length < 2) {
        errors.country = 'Country name must be at least 2 characters.';
    } else if (country.trim().length > 60) {
        errors.country = 'Country name must not exceed 60 characters.';
    } else if (!LETTERS_SPACES.test(country.trim())) {
        errors.country = 'Country name must contain only letters and spaces.';
    }

    // ─ Zip Code ─
    if (!zipCode || zipCode.trim() === '') {
        errors.zipCode = 'Zip / postal code is required.';
    } else if (!ZIP_REGEX.test(zipCode.trim())) {
        errors.zipCode = 'Zip code must be 4–10 alphanumeric characters (e.g. 110001).';
    }

    // ─ Phone Number ─
    if (!phoneNumber || phoneNumber.trim() === '') {
        errors.phoneNumber = 'Phone number is required.';
    } else if (!PHONE_REGEX.test(phoneNumber.trim())) {
        errors.phoneNumber = 'Phone number must be exactly 10 digits (no spaces or dashes).';
    }

    return errors;
};

const addAddressService = async (userId, addressData) => {

    const { fullName, streetAddress, city, zipCode, state, country, phoneNumber, type, isDefault } = addressData;

    const errors = validateAddressData({ fullName, streetAddress, city, zipCode, state, country, phoneNumber });

    if (Object.keys(errors).length > 0) {
        const error = new Error('Validation failed');
        error.statusCode = 400;
        error.errors = errors;
        throw error;
    }

    if (isDefault) {
        await AddressModel.updateMany({ userId }, { isDefault: false });
    }

    const newAddress = new AddressModel({
        userId,
        fullName:      fullName.trim(),
        streetAddress: streetAddress.trim(),
        city:          city.trim(),
        zipCode:       zipCode.trim(),
        state:         state.trim(),
        country:       country.trim(),
        phoneNumber:   phoneNumber.trim(),
        type:          type || 'home',
        isDefault:     isDefault === 'true' || isDefault === 'on'
    });

    await newAddress.save();
    return { success: true };
};
const editAddressService = async (addressId, addressData) => {

    const { fullName, streetAddress, city, zipCode, state, country, phoneNumber, type, isDefault } = addressData;

    const errors = validateAddressData({ fullName, streetAddress, city, zipCode, state, country, phoneNumber });

    if (Object.keys(errors).length > 0) {
        const error = new Error('Validation failed');
        error.statusCode = 400;
        error.errors = errors;
        throw error;
    }

    // If marking as default, clear others first
    if (isDefault === 'true' || isDefault === 'on') {
        const existing = await AddressModel.findById(addressId);
        if (existing) {
            await AddressModel.updateMany({ userId: existing.userId }, { isDefault: false });
        }
    }

    const updated = await AddressModel.findByIdAndUpdate(
        addressId,
        {
            fullName:      fullName.trim(),
            streetAddress: streetAddress.trim(),
            city:          city.trim(),
            zipCode:       zipCode.trim(),
            state:         state.trim(),
            country:       country.trim(),
            phoneNumber:   phoneNumber.trim(),
            type:          type || 'home',
            isDefault:     isDefault === 'true' || isDefault === 'on'
        },
        { new: true }
    );

    return updated;
};

const deleteAddressServices =async (addressId)=>{
    const isExist = await AddressModel.findById(addressId)
    console.log("from service isexist"+isExist);
    if(!isExist){
        throw new Error("address not found");
    }
    await AddressModel.findByIdAndDelete(addressId)
    return{success:true};
}

export {
    getAddressesService,
    addAddressService,
    editAddressService,
    deleteAddressServices
}