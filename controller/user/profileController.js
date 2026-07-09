import {
  getUserById,
  updateProfileService,
  verifyOtpService,
  resendOtpService,
  verifyOldPasswordService,
  changePasswordService,
  deleteProfileImageServices,
  getProfileOtpTimerData,
  getProfileDashboardData,
  verifyCurrentOtpService,
  resendCurrentOtpService,
  getProfileCurrentOtpTimerData
} from '../../services/user/profileService.js';

const getProfile = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const user = await getUserById(userId);

    if (!user) return res.redirect('/login');

    const { recentOrders, savedAddresses } = await getProfileDashboardData(userId);

    return res.render('User/profile', { user, recentOrders, savedAddresses });

  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).send('Server error');
  }
};

const updateProfile = async (req, res) => {
  console.log('start')
  try {
    console.log("part 1 ")

    const { name, email } = req.body;

    console.log('[updateProfile] START - data:', { name, email });
    const userId = req.session.user.id;
    console.log('[updateProfile] userId:', userId);

    const profileImage = req.file ? req.file.path : null;
    console.log('[updateProfile] profileImage:', profileImage);

    console.log('[updateProfile] calling updateProfileService...');
    const result = await updateProfileService(userId, name, email, profileImage);
    console.log('[updateProfile] result:', result);

    if (result.requiresOtp) {
      console.log('[updateProfile] requiresOtp=true → redirecting to /verify-current-email-otp');
      return res.redirect('/verify-current-email-otp');
    }

    const user = await getUserById(userId);
    console.log('[updateProfile] done, rendering profile with success');

    const { recentOrders, savedAddresses } = await getProfileDashboardData(userId);

    return res.status(200).render('User/profile', {
      user,
      successMessage: result.message,
      recentOrders,
      savedAddresses
    });
  } catch (error) {
    console.error('[updateProfile] ERROR:', error.message, error.stack);
    const userId = req.session.user.id;
    const user = await getUserById(userId);
    const { recentOrders, savedAddresses } = await getProfileDashboardData(userId);
    return res.status(400).render('User/profile', { user, errorMessage: error.message, recentOrders, savedAddresses });
  }
};

const deleteProfileImage = async (req, res) => {
  try {
    const userId = req.session.user.id;

    const result = await deleteProfileImageServices(userId);
    const user = await getUserById(userId);
    const { recentOrders, savedAddresses } = await getProfileDashboardData(userId);
    return res.status(200).render('User/profile', {
      user,
      successMessage: result.message,
      recentOrders,
      savedAddresses
    });
  } catch (error) {
    console.error('Delete image error:', error.message);
    const userId = req.session.user.id;
    const user = await getUserById(userId);
    const { recentOrders, savedAddresses } = await getProfileDashboardData(userId);
    return res.status(400).render('User/profile', { user, errorMessage: error.message, recentOrders, savedAddresses });
  }
};

const showCurrentOtpPage = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { remainingSeconds, resendCooldownSeconds, email } = await getProfileCurrentOtpTimerData(userId);
    return res.render('User/auth/otp-verification', {
      actionUrl:             '/verify-current-email-otp',
      resendUrl:             '/verify-current-email-otp/resend',
      errorMessage:          null,
      successMessage:        null,
      remainingSeconds,
      resendCooldownSeconds,
      email
    });
  } catch (error) {
    console.error('[showCurrentOtpPage] ERROR:', error.message);
    return res.status(500).send('Server error');
  }
};

const verifyCurrentOtp = async (req, res) => {
  try {
    const otp = Object.values(req.body).join('');
    const userId = req.session.user.id;
    await verifyCurrentOtpService(userId, otp);
    return res.redirect('/verify-emailChange-otp');
  } catch (error) {
    console.error('[verifyCurrentOtp] ERROR:', error.message);
    const userId = req.session.user.id;
    const { remainingSeconds, resendCooldownSeconds, email } = await getProfileCurrentOtpTimerData(userId);
    return res.status(400).render('User/auth/otp-verification', {
      actionUrl:             '/verify-current-email-otp',
      resendUrl:             '/verify-current-email-otp/resend',
      errorMessage:          error.message,
      successMessage:        null,
      remainingSeconds,
      resendCooldownSeconds,
      email
    });
  }
};

const resendCurrentOtp = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const result = await resendCurrentOtpService(userId);
    const { remainingSeconds, resendCooldownSeconds, email } = await getProfileCurrentOtpTimerData(userId);
    return res.render('User/auth/otp-verification', {
      actionUrl:             '/verify-current-email-otp',
      resendUrl:             '/verify-current-email-otp/resend',
      errorMessage:          null,
      successMessage:        result.message,
      remainingSeconds,
      resendCooldownSeconds,
      email
    });
  } catch (error) {
    console.error('[resendCurrentOtp] ERROR:', error.message);
    const userId = req.session.user.id;
    const { remainingSeconds, resendCooldownSeconds, email } = await getProfileCurrentOtpTimerData(userId);
    return res.render('User/auth/otp-verification', {
      actionUrl:             '/verify-current-email-otp',
      resendUrl:             '/verify-current-email-otp/resend',
      errorMessage:          error.message,
      successMessage:        null,
      remainingSeconds,
      resendCooldownSeconds,
      email
    });
  }
};

const showOtpPage = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { remainingSeconds, resendCooldownSeconds, email } = await getProfileOtpTimerData(userId);
    return res.render('User/auth/otp-verification', {
      actionUrl:             '/verify-emailChange-otp',
      resendUrl:             '/verify-emailChange-otp/resend',
      errorMessage:          null,
      successMessage:        null,
      remainingSeconds,
      resendCooldownSeconds,
      email
    });
  } catch (error) {
    console.error('[showOtpPage] ERROR:', error.message, error.stack);
    return res.status(500).send('Server error');
  }
};

const verifyOtp = async (req, res) => {
  try {
    console.log('[verifyOtp] body:', req.body);
    const otp = Object.values(req.body).join('');
    const userId = req.session.user.id;
    console.log('[verifyOtp] otp:', otp, '| userId:', userId);

    const result = await verifyOtpService(userId, otp);
    console.log('[verifyOtp] result:', result);
    const user = await getUserById(userId);
    const { recentOrders, savedAddresses } = await getProfileDashboardData(userId);

    return res.status(200).render('User/profile', {
      user,
      successMessage: result.message,
      recentOrders,
      savedAddresses
    });
  } catch (error) {
    console.error('[verifyOtp] ERROR:', error.message);
    const userId = req.session.user.id;
    const { remainingSeconds, resendCooldownSeconds, email } = await getProfileOtpTimerData(userId);
    return res.status(400).render('User/auth/otp-verification', {
      actionUrl:             '/verify-emailChange-otp',
      resendUrl:             '/verify-emailChange-otp/resend',
      errorMessage:          error.message,
      successMessage:        null,
      remainingSeconds,
      resendCooldownSeconds,
      email
    });
  }
};

const resendOtp = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const result = await resendOtpService(userId);
    const { remainingSeconds, resendCooldownSeconds, email } = await getProfileOtpTimerData(userId);

    return res.render('User/auth/otp-verification', {
      actionUrl:             '/verify-emailChange-otp',
      resendUrl:             '/verify-emailChange-otp/resend',
      errorMessage:          null,
      successMessage:        result.message,
      remainingSeconds,
      resendCooldownSeconds,
      email
    });
  } catch (error) {
    console.error('Resend OTP error:', error.message);
    const userId = req.session.user.id;
    const { remainingSeconds, resendCooldownSeconds, email } = await getProfileOtpTimerData(userId);
    return res.render('User/auth/otp-verification', {
      actionUrl:             '/verify-emailChange-otp',
      resendUrl:             '/verify-emailChange-otp/resend',
      errorMessage:          error.message,
      successMessage:        null,
      remainingSeconds,
      resendCooldownSeconds,
      email
    });
  }
};

const showChangePasswordPage = async (req, res) => {
  try {
    return res.render('User/changepassword', {
      actionUrl: '/change-password/verify-old'
    });
  } catch (error) {
    console.error('Change password page error:', error.message);
    return res.status(500).send('Server error');
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
    return res.status(400).render('User/changepassword', {
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
    return res.render('User/auth/reset-password', {
      actionUrl: '/change-password/new',
    });
  } catch (error) {
    console.error('New password page error:', error.message);
    return res.status(500).send('Server error');
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

    return req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).send('Server error');
      }
      res.clearCookie('connect.sid');
      return res.redirect('/login');
    });

  } catch (error) {
    console.error('Change password error:', error.message);
    return res.status(400).render('User/auth/reset-password', {
      actionUrl: '/change-password/new',
      errorMessage: error.message
    });
  }
};

const getAddresses = async (req, res) => {
  try {
    const user = await getUserById(req.session.user.id);

    if (!user) return res.redirect('/login');

    return res.render('User/address', { user });
  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).send('Server error');
  }
}
export {
  getProfile,
  updateProfile,
  showOtpPage,
  verifyOtp,
  resendOtp,
  showChangePasswordPage,
  verifyOldPassword,
  showNewPasswordPage,
  changePassword,
  deleteProfileImage,
  showCurrentOtpPage,
  verifyCurrentOtp,
  resendCurrentOtp,
  getAddresses
}