    import User from '../../model/userModel.js';
import bcrypt  from 'bcrypt';

const registerUser = async (data)=>{
    const {name, email, password, confirmPassword, terms} = data;

    if(!name || !email || !password){
        const err = new Error("All required fields missing");
        err.field = 'general';
        throw err;
    }

    if(!terms){
        const err = new Error("You must agree to the Terms and Conditions");
        err.field = 'terms';
        throw err;
    }
    
    if (!/^[A-Za-z\s]+$/.test(name.trim())) {
        const err = new Error("Name must contain only letters");
        err.field = 'name';
        throw err;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        const err = new Error('Please enter a valid email address');
        err.field = 'email';
        throw err;
    }

    const existingUser = await User.findOne({email});
    if(existingUser){
        const err = new Error('Email already exists');
        err.field = 'email';
        throw err;
    }
    
    if(password !== confirmPassword){
        const err = new Error("Password and confirm password do not match");
        err.field = 'confirmPassword';
        throw err;
    }

    if(password.length < 6){
        const err = new Error("Password must be at least 6 characters");
        err.field = 'password';
        throw err;
    }
    

    
    const hashedPassword =  await bcrypt.hash(password,10);

    const newUser = await User.create({
    name,
    email,
    password: hashedPassword,
    terms: true,
  });

  return{
    success:true
  }

}

export { registerUser };