const mongoose = require('mongoose');
const { Schema } = mongoose;

const callSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        unique: true       
    },
    calls: [{
        calleeName: {
            type:String
        },
        phoneNumber: {
            type: String,
            unique: true
        },
        calltype: {
            type: String,
            enum:['outgoing', 'incoming']
        },
        callCategory: {
            type: String,
            enum: ['wedding', 'naming', 'house warming', 'others']
        },
        callTime: {
            type: Date
        }
    }]
});

const call = mongoose.model('Calls', callSchema);
module.exports = call;