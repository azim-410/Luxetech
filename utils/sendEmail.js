import nodemailer from 'nodemailer';

const sendOTP = async (email, otp) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASS
        }
    })

    try {
        await transporter.verify();
    } catch (verifyError) {
        console.error('Email transporter verification failed:', verifyError);
        throw new Error('Unable to connect to email service. Check EMAIL and EMAIL_PASS settings.');
    }

    try {
        await transporter.sendMail({
            from: `"LUXETECH" <${process.env.EMAIL}>`,
            to: email,
            subject: 'LUXETECH - Your OTP Code',
            text: `YOUR OTP IS ${otp}`
        });
    } catch (sendError) {
        console.error('OTP email send failed:', sendError);
        throw new Error('Failed to send OTP email. Check email service configuration and account settings.');
    }
}

export { sendOTP } 