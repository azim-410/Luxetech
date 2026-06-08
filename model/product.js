import mongoose from "mongoose";

const productSchema = new mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
    },
    price:{
        type:Number,
        required:true
    },
    image:{
        type:String,
        required:true
    },
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"categoryModel",
        required:true
    },
    status:{
        type:Boolean,
        default:true
    }
},{
    timestamps:true
})

const productModel = new mongoose.model("product",productSchema);
export default productModel