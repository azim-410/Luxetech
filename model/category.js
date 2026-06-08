import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({

       categoryName:{
        type:String,
        required:true
       },
       description:{
        type:String,
       },
       status:{
        type:Boolean,
        default:true
       },
       isHidden:{
        type:Boolean,
        default:false
       },
       slug:{
        type:String,
        required:true
       },
       image:{
        type:String
       }
},{
    timestamps:true
})

const categoryModel = mongoose.model("category",categorySchema);
export default categoryModel