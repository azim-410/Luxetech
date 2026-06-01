import {
  getUserById,
  updateProfileService,
  verifyOtpService,
  resendOtpService,
  verifyOldPasswordService,
  changePasswordService
} from '../../services/user/profileService.js';

const getProfile = async (req, res) => {
  try {

    const user = await getUserById(req.session.user.id);
    // console.log("user from profile",user);

    if (!user) return res.redirect('/login');

    res.render('User/profile', { user });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).send('Server error');
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    console.log('Received profile update data:', { name, email });
    const userId = req.session.user.id;

    const result = await updateProfileService(userId, name, email);
    if (result.requiresOtp) {
      return res.redirect('/verify-emailChange-otp');
    }

    const user = await getUserById(userId);
    return res.status(200).render('User/profile', {
      user,
      successMessage: result.message
    });


  } catch (error) {
    console.error('Profile update error:', error.message);
    const userId = req.session.user.id;
    const user = await getUserById(userId);
    res.status(400).render('User/profile', { user, errorMessage: error.message });
  }
};

const showOtpPage = async (req, res) => {
  try {
    res.render('User/auth/otp-verification.ejs', {
      actionUrl: '/verify-emailChange-otp',
      resendUrl: '/verify-emailChange-otp/resend',
    });
  } catch (error) {
    console.error('Show OTP page error:', error.message);
    res.status(500).send('Server error');
  }
};

const verifyOtp = async (req, res) => {
  try {

    const otp = Object.values(req.body).join('');
    const userId = req.session.user.id;

    const result = await verifyOtpService(userId, otp);
    const user = await getUserById(userId);

    return res.status(200).render('User/profile', {
      user,
      successMessage: result.message
    });
  } catch (error) {
    console.error('Verify OTP error:', error.message);
    res.status(400).render('User/auth/otp-verification.ejs', {
      actionUrl: '/verify-emailChange-otp',
      resendUrl: '/verify-emailChange-otp/resend',
      errorMessage: error.message
    });
  }
}

const resendOtp = async (req, res) => {
  try {
    const userId = req.session.user.id;

    const result = await resendOtpService(userId);

    res.render('User/auth/otp-verification.ejs', {
      actionUrl: '/verify-emailChange-otp',
      resendUrl: '/verify-emailChange-otp/resend',
      successMessage: result.message
    });

  } catch (error) {
    console.error('Resend OTP error:', error.message);
    res.render('User/auth/otp-verification.ejs', {
      actionUrl: '/verify-emailChange-otp',
      resendUrl: '/verify-emailChange-otp/resend',
      errorMessage: error.message
    });
  }
};

const showChangePasswordPage = async (req, res) => {
  try {
    res.render('User/changepassword', {
      actionUrl: '/change-password/verify-old'
    });
  } catch (error) {
    console.error('Change password page error:', error.message);
    res.status(500).send('Server error');
  }
};

const verifyOldPassword = async (req, res) => {
  try {
    const { oldPassword } = req.body;
    const userId = req.session.user.id;

    await verifyOldPasswordService(userId, oldPassword);

    req.session.passwordVerified = true;

    return res.redirect('/change-password/new');

  } catch (error) {
    console.error('Verify old password error:', error.message);
    res.status(400).render('User/changepassword', {
      actionUrl: '/change-password/verify-old',
      errorMessage: error.message
    });
  }
};

const showNewPasswordPage = async (req, res) => {
  try {
    if (!req.session.passwordVerified) {
      return res.redirect('/change-password');
    }
    res.render('User/auth/reset-password', {
      actionUrl: '/change-password/new',
    });
  } catch (error) {
    console.error('New password page error:', error.message);
    res.status(500).send('Server error');
  }
};

const changePassword = async (req, res) => {
  try {
    if (!req.session.passwordVerified) {
      return res.redirect('/change-password');
    }

    const { newPassword, confirmPassword } = req.body;
    const userId = req.session.user.id;

    await changePasswordService(userId, newPassword, confirmPassword);

    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).send('Server error');
      }
      res.clearCookie('connect.sid');
      return res.redirect('/login');
    });

  } catch (error) {
    console.error('Change password error:', error.message);
    res.status(400).render('User/auth/reset-password', {
      actionUrl: '/change-password/new',
      errorMessage: error.message
    });
  }
};
export {
  getProfile,
  updateProfile,
  showOtpPage,
  verifyOtp,
  resendOtp,
  showChangePasswordPage,
  verifyOldPassword,
  showNewPasswordPage,
  changePassword
}