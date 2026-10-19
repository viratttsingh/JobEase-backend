const mongoose=require("mongoose");

const jobSchema=new mongoose.Schema(
    {
        company:{
            type:String,
            required:true,
            trim:true,
        },

        role:{
           type:String,
            required:true,
            trime:true,
        },
        status:{
            type:String,
            enum:["Applied", "Interview", "Rejected", "Offer"],
            default:"Applied",
        },
       
          jobUrl: {
      type: String,
      default: "",
      trim: true,
    },

    appliedDate: {
      type: String,
      default: "",
    },

    updatedDate: {
      type: String,
      default: "",
    },
    },
    {
       timestamps:true,
    },
);

module.exports=mongoose.model("Job",jobSchema);