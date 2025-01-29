import mongoose, {Schema} from "mongoose"

const subscriptionSchema = new Schema({
    subscriber : { //This field follows the structure of the User model because it holds a reference to a User document.
        type : Schema.Types.ObjectId, //one who is subscribing
        ref : "User"
    },
    channel : {
        type : Schema.Types.ObjectId, //jis ko subscribe kar rhe
        ref : "User"
    },
}, {timestamps : true})




export const Subscription = mongoose.model("Subscription", subscriptionSchema)