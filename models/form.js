const mongoose=require('mongoose');
const Schema=mongoose.Schema;

const formSchema=new Schema({
  FirstName:String,
  LastName:String,
  city:String
},
{
 collation:'form1'   
});
module.exports=mongoose.model('form1',formSchema);