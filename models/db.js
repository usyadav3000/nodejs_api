const mongoose=require('mongoose');
const dbUrl='mongodb://localhost:27017/demo';
mongoose.connect(dbUrl);
mongoose.connection.on('connected',()=>{
    console.log('database connected on the urls ',dbUrl);
});
mongoose.connection.on('error',(err)=>{
    console.log(err);
});
mongoose.connection.on('disconnected',(err)=>{
    console.log('disconnected');
});