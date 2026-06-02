import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    FullName:{
        type:String,
        required:true
    },
    StreetAddress:{
        type:String,
        required:true
    },
    city:{
        type:String,
        required:true
    },
    zipCode:{
        type:Number,
        required:true
    },
    state:{
        type:String,
        required:true
    },
    Country:{
        type:String,
        required:true
    },
    phoneNumber:{
         type:String,
        required:true
    },
    isdefault:{
        type:Boolean,
        default:false
    }
}, 
    {
    timestamps: true
    }
)