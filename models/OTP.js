const mongoose   = require("mongoose")

const OTPSchema = new mongoose.Schema({
    _userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    OTP: { type: String, required: true },
    createdAt: { type: Date, required: true, default: Date.now, expires: 43200 }
});
module.exports=mongoose.model("OTP", OTPSchema)