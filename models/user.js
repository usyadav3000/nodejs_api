const mongoose=require('mongoose');
const Schema=mongoose.Schema;

var userDetailsSchema=new Schema({ 
 userName:{type:String,required:true},
 password:{type:String,required:true},
 email:{type:String,required:true,
    match:/^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/
},
 date:{type:Date,default:Date.now}
},
{
collection:'userDetails'
});
module.exports=mongoose.model('userDetails',userDetailsSchema);