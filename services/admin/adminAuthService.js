import userModel from '../../model/userModel.js';
import bcrypt from 'bcrypt';

const adminLoginService = async (email, password) => {
    if (!email || email.trim() === '' || !password || password.trim() === '') throw new Error('All feild required');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) throw new Error('Invalid email format');

    const admin = await userModel.findOne({ email: email.trim().toLowerCase() });
    if (!admin) throw new Error('Invalid credentials');

    if (admin.role !== 'admin') throw new Error('Access denied');

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) throw new Error('Invalid credentials');

    return { id: admin._id, email: admin.email, name: admin.name };
};

export { adminLoginService };
 