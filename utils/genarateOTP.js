import crypto from "crypto";
  
  const generateOTP = () => {
  const otp = crypto.randomInt(100000, 999999);
  return otp;

};
export { generateOTP }