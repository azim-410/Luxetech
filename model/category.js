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
       slug:{
        type:String,
        required:true
       }
},{
    timestamps:true
})

const categoryModel = new mongoose.model("cetogory",categorySchema);
export default categoryModel