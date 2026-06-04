import {
  getUserById,
  updateProfileService,
  verifyOtpService,
  resendOtpService,
  verifyOldPasswordService,
  changePasswordService,
  deleteProfileImageServices,
  getProfileOtpTimerData
} from '../../services/user/profileService.js';

const getProfile = async (req, res) => {
  try {

    const user = await getUserById(req.session.user.id);
    // console.log("user from profile",user);

    if (!user) return res.redirect('/login');

    return res.render('User/profile', { user });

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
      console.log('[updateProfile] requiresOtp=true → redirecting to /verify-emailChange-otp');
      return res.redirect('/verify-emailChange-otp');
    }

    const user = await getUserById(userId);
    console.log('[updateProfile] done, rendering profile with success');

    return res.status(200).render('User/profile', {
      user,
      successMessage: result.message
    });
  } catch (error) {
    console.error('[updateProfile] ERROR:', error.message, error.stack);
    const userId = req.session.user.id;
    const user = await getUserById(userId);
    return res.status(400).render('User/profile', { user, errorMessage: error.message });
  }
};

const deleteProfileImage = async (req, res) => {
  try {
    const userId = req.session.user.id;
   
    const result = await deleteProfileImageServices(userId);
    const user = await getUserById(userId);
    return res.status(200).render('User/profile', {
       user,
       successMessage: result.message
     });
  } catch (error) {
    console.error('Delete image error:', error.message);
    const userId = req.session.user.id;
    const user = await getUserById(userId);
    return res.status(400).render('User/profile', { user, errorMessage: error.message });
  }
};

const showOtpPage = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { remainingSeconds, resendCooldownSeconds } = await getProfileOtpTimerData(userId);
    return res.render('User/auth/otp-verification', {
      actionUrl:             '/verify-emailChange-otp',
      resendUrl:             '/verify-emailChange-otp/resend',
      remainingSeconds,
      resendCooldownSeconds
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

    return res.status(200).render('User/profile', {
      user,
      successMessage: result.message
    });
  } catch (error) {
    console.error('[verifyOtp] ERROR:', error.message);
    const userId = req.session.user.id;
    const { remainingSeconds, resendCooldownSeconds } = await getProfileOtpTimerData(userId);
    return res.status(400).render('User/auth/otp-verification', {
      actionUrl:             '/verify-emailChange-otp',
      resendUrl:             '/verify-emailChange-otp/resend',
      errorMessage:          error.message,
      remainingSeconds,
      resendCooldownSeconds
    });
  }
}

const resendOtp = async (req, res) => {
  try {
    const userId = req.session.user.id;

    const result = await resendOtpService(userId);
    const { remainingSeconds, resendCooldownSeconds } = await getProfileOtpTimerData(userId);

    return res.render('User/auth/otp-verification', {
      actionUrl:             '/verify-emailChange-otp',
      resendUrl:             '/verify-emailChange-otp/resend',
      successMessage:        result.message,
      remainingSeconds,
      resendCooldownSeconds
    });

  } catch (error) {
    console.error('Resend OTP error:', error.message);
    const userId = req.session.user.id;
    const { remainingSeconds, resendCooldownSeconds } = await getProfileOtpTimerData(userId);
    return res.render('User/auth/otp-verification', {
      actionUrl:             '/verify-emailChange-otp',
      resendUrl:             '/verify-emailChange-otp/resend',
      errorMessage:          error.message,
      remainingSeconds,
      resendCooldownSeconds
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

const getAddresses = async (req,res)=>{
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
  
  getAddresses
}