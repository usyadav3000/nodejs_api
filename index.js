var express=require('express');
var app=express();
const port=7000;
const bodyParser=require('body-parser');
const bcrypt=require('bcrypt');
const cors=require('cors');

app.use(cors());

const swaggerDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');
const path=require('path');

require('./models/db');
const userDetails=require('./models/user');
const jwtoken=require('jsonwebtoken');
const {errorHandler}=require('./middleware/errorHandler');
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/',express.static('public'));

// parse application/json
app.use(bodyParser.json())

const Players=require('./models/topPlayers');
const FormData1=require('./models/form');
const { accessSync } = require('fs');

const option = {
  definition: {
    //openapi: '3.0.0',
      info: {
          "title": "PLM REST API",
          "description": "This is description",
          "version":"1.0.0"
          
      },
      tags:[
        {"name":"playersData"},
        {"name":"userData"}
      ],
      servers: [
       {"url": "http://localhost:7000"}
      ],

  },
  //['routes/*.js']
  apis: ["index.js"]
};

const swaggerDocs1 = swaggerDoc(option);
const swaggerUIOpt={
  swaggerOptions:{
      docExpansion:"none",
      tagsSorter:"alpha"
  }
}

app.use(express.static(path.join(__dirname, 'public')));

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocs1,swaggerUIOpt));


/** 
* @swagger 
* /user:
*   get: 
*     tags:
*      - userData
*     summary: All user Data
*     description: return all user successfuly!
*     responses:  
*       '200': 
*         description: Success  
*   
*/ 

//find all user 
app.get('/user', async (req, res, next) => {
  try {
    const userData2 = await userDetails.aggregate([
      {
        $facet: {
          "data": [{
            $project: {
              _id: 0,
              userName: 1,
              email: 1,
              date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }
            }
          }],
          "count": [{ $count: "count" }]
        }

      }

    ]);
    const count=userData2[0].count.length ? userData2[0].count[0].count :0;
    //console.log("h",userData2[0].count.length);
    res.send({
      "success": true,
      "message": "records return successfully",
      data: userData2[0].data,
      timestamp: new Date().getTime(),
      "totalCount":count
    })
  }
  catch (err) {
    //next(new errorHandler(400, "bad request", err));
    res.status(400).json({
      "success":false,
      "message":"bad request"
    })
  }
});

/** 
* @swagger 
* /players:
*   get: 
*     tags:
*       - playersData
*     summary: All userData
*     description: Get all user data 
*     responses:  
*       '200': 
*         description: Success  
*         content:
*           application/json:
*             schema:
*               type: object
*               required:
*                 - success
*                 - message
*                 - data
*               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 message:
*                   type: string
*                   example: records returns successfully
*                 data:
*                   type: array
*                   items:
*                     properties:
*                       Name:
*                         type: string
*                         example: Kane Williamson
*                       Rank: 
*                         type: Number
*                         example: 2
*                       Rating:
*                         type: Number
*                         example: 812
*                       Team:
*                         type: string
*                         example: NZ
*                       
*                 timestamp:
*                   type: integer
*                   example: 1247683633    
*       '400':
*         description: bad request  
*         content:
*             application/json:
*               schema:
*                 type: object
*                 required:
*                   - success
*                   - message
*                 properties:
*                   success:
*                     type: boolean
*                     example: false
*                   message:
*                     type: string
*                     example: bad request                  
*                         
*   
*/ 

app.get('/players', async (req, res, next) => {
  try {
    const playerData1 = await Players.aggregate([
      { $sort: { Rating: -1 } },
      {$lookup:{
         from:"IPL records",
         localField:"Name",
         foreignField:"Name",
         as:"IPLrecords"
      }
    },
    { $unwind: { path: "$IPLrecords", preserveNullAndEmptyArrays: true } },
    {$lookup:{
        from:"TestRecords",
        localField:"Name",
        foreignField:"Name",
        as:"TestRecordsData"
    }},
    {$unwind:{path:"$TestRecordsData",preserveNullAndEmptyArrays:true}},
      {
        $project: {
          _id: 0,
          Name: 1,
          Rank: 1,
          Rating: 1,
          Team: 1,
          IPLrecords:{
            Mat:1,
            Inn:1,
            Runs:1,
            Avg:1,
            SR:1,
            100:1,
            50:1
          },
          TestRecordsData:{
            mat:1,
            Inn:1,
            Runs:1,
            Avg:1,
            SR:1,
            100:1,
            50:1
          },
        }
      }
    ]);
    res.send({
      "success": true,
      "message": "all records returns successfully",
      data: playerData1,
      timestamp: new Date().getTime()
    });
  }
  catch (err) {
    res.status(400).json({
      "success": false,
      "message": "bad request"
    })
  }
});



//find user by using userName

app.get('/user/:username', async (req, res, next) => {
  try {
    const user_name = req.params.username;
    console.log(user_name);
    const userData = await userDetails.aggregate([
      { $match: { userName: user_name } },
      {
        $project: {
          _id: 0,
          userName: 1,
          email: 1,
          date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }
        }
      }
    ]);
    res.send({
      "success": true,
      "message": "records return successfully",
      data: userData,
      timestamp: new Date().getTime()
    })
  }
  catch (err) {
    //next(new errorHandler(400, "bad request", err));
    res.status(400).json({
      "success":false,
      "message":"bad request"
    })
  }
});


//signup user
app.post('/signup', (req, res) => {
  //var arrr3=[];
  console.log(req.body);
  bcrypt.hash(req.body.password, 10, (err, hash) => {
    if (err) {
      res.status(500).json({
        error: err
      })
    }
    else {
      const userData = new userDetails({
        userName: req.body.userName,
        email: req.body.email,
        password: hash
      });
      //arrr3.push(userData);
      userData.save();
      //const data1=`<h1>uers data save inside databases.</h1>`
      res.send({
        "success": true,
        "message": "records return successfully",
        data: userData,
        timestamp: new Date().getTime()
      });
    }
  })
});

//login user

app.post("/login", async (req, res) => {
  console.log(req.body);
  userDetails.find({ userName: req.body.userName })
    .exec()
    .then(user => {
      if (user.length < 1) {
        return res.status(401).json({
          msg: 'user not exist'
        })
      }
      bcrypt.compare(req.body.password, user[0].password, (err, result) => {
        if (!result) {
          return res.status(401).json({
            msg: 'password not match'
          })
        }
        if (result) {
          const token = jwtoken.sign({
            userName: user[0].userName,
            email: user[0].email
          },
            'umashankar',
            {
              expiresIn: "24h"
            }
          );
          res.status(200).json({
            userName: user[0].userName,
            email: user[0].email,
            token: token
          })
        }
      })
    })
    .catch(err => {
      res.status(500).json({
        err: err
      })
    })
});

//update the user 
app.put('/user/:username',async(req,res,next)=>{
try{
  console.log(req.body);
  const username=req.params.username;
  const email1=req.body.email;
  var data=await userDetails.updateOne({userName:username},{$set:{email:email1}});
  res.send({
    "success":true,
    "message":"records update successfully",
    data:data,
    timestamp:new Date().getTime()
  })
}
catch(err){
  //next(new errorHandler(400, "bad request", err));
  res.status(400).json({
    "success":false,
    "message":"bad request"
  })
}
});

//delete the user
app.delete('/user/:username',async(req,res,next)=>{
  try{
    var user = req.params.username;
  const data = await userDetails.deleteOne({ userName: user });
  res.send({
    "success": true,
    "massage": "records delete successfully.",
    data: data,
    timestamp: new Date().getTime()
  })
  }
  catch(err){
    //next(new errorHandler(400, "bad request", err));
    res.status(400).json({
      "success":false,
      "message":"bad request"
    })
  }
});


//api for players data

//top player insert
app.post('/players',async(req,res,next)=>{
  try{
    const playerData=new Players({
      Name:req.body.name,
      Rank:req.body.rank,
      Rating:req.body.rating,
      Team:req.body.team
    });
    playerData.save();
  
    res.send({
      "success":true,
      "message":"record insert successfully",
      data:playerData,
      timestamp:new Date().getTime()
    });
  }
  catch{
    res.status(400).json({
      "success":false,
      "message":"bad request"
    })
  }
});
 
/** 
* @swagger 
* /players/{id}:
*   get: 
*     tags:
*       - playersData
*     summary: All userData
*     description: Get all user data 
*     parameters:
*         - in: path
*           name: id
*           required: true
*           description: Numeric Id required
*           schema: 
*             type: integer
*         - name: $filter
*           in: query
*           description: Filter according to OData specifications. Refer to [Supported OData Segments](/a.txt).
*           example: item_code eq '0101-SHT-1790'
*           required: false
*           type: string
*     responses:  
*       '200': 
*         description: Success  
*         content:
*           application/json:
*             schema:
*               type: object
*               required:
*                 - success
*                 - message
*                 - data
*               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 message:
*                   type: string
*                   example: records returns successfully
*                 data:
*                   type: array
*                   items:
*                     properties:
*                       Name:
*                         type: string
*                         example: Kane Williamson
*                       Rank: 
*                         type: Number
*                         example: 2
*                       Rating:
*                         type: Number
*                         example: 812
*                       Team:
*                         type: string
*                         example: NZ
*                 timestamp:
*                   type: integer
*                   example: 1247683633    
*       '400':
*         description: bad request  
*         content:
*             application/json:
*               schema:
*                 type: object
*                 required:
*                   - success
*                   - message
*                 properties:
*                   success:
*                     type: boolean
*                     example: false
*                   message:
*                     type: string
*                     example: bad request                  
*                         
*   
*/ 
//get data using id
app.get('/players/:id', async (req, res, next) => {
  try{
    const id = req.params.id;
  console.log(id)
  const data = await Players.find({ Rank: id }, { Name: 1, Rank: 1, Rating: 1, Team: 1, _id: 0 });
  res.send({
    "success": true,
    "message": "records returns successfully",
    data: data,
    timestamp: new Date().getTime()
  });
  }
  catch(err){
    res.status(400).json({
      "success":false,
      "message":"bad request"
    })
  }
});

/** 
* @swagger 
* /players/{id}:
*   put: 
*     tags:
*       - playersData
*     summary: All userData
*     description: Get all user data 
*     parameters:
*         - in: path
*           name: id
*           required: true
*           description: Numeric Id required
*           schema: 
*             type: integer
*     responses:  
*       '200': 
*         description: Success  
*         content:
*           application/json:
*             schema:
*               type: object
*               required:
*                 - data
*               properties:
*                 data:
*                   type: array
*                   items:
*                     properties:
*                       Name:
*                         type: string
*                         example: Kane Williamson
*                       Rank: 
*                         type: Number
*                         example: 2
*                       Rating:
*                         type: Number
*                         example: 812
*                       Team:
*                         type: string
*                         example: NZ
*                         
*   
*/ 

//update records

app.put('/players/:id',async(req,res,next)=>{
 try{
  const id=req.params.id;
  const rank=req.body.Rank;
  const rating=req.body.Rating;
  const data=await Players.updateOne({Rank:id},{$set:{Rating:rating,Rank:rank}});
  res.send({
   "success": true,
   "message": "records updated successfully",
   data: data,
   timestamp: new Date().getTime()
 });
 }
 catch(err){
  res.status(400).json({
    "success":false,
    "message":"bad request"
  })
 }
});


//API for sending form data 

app.post('/formData',async(req,res,next)=>{
  console.log(req.body)
const formDat=new FormData1({
  FirstName:req.body.fname,
  LastName:req.body.lname,
  city:req.body.country
});

formDat.save();
res.send({
  'success':true,
  data:FormData1
})
})

app.get('/formValue',async(req,res,next)=>{
  try{
 const allData=await FormData1.aggregate([
   {
     $project:{
       _id:0,
       FirstName:1,
       LastName:1,
       city:1
     }
   }
 ]);
  res.send({
     data:allData,
  });
  //console.log(allData);
  }
  catch(err){
    res.status(400).json({
      "success":false,
      "message":"bad request"
    })
   }
})


//start a server
app.listen(port,(req,res)=>{
    console.log("server is running on the port ",port);
})

module.exports=app;
