const mongoose=require('mongoose');
const Schema=mongoose.Schema;

var PlayerSchema=new Schema({
    Name:String,
    Rank:Number,
    Rating:Number,
    Team:String
},
{
    collection:'Players'
});
module.exports=mongoose.model('Players',PlayerSchema)