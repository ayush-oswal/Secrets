/*j shint esversion:6
hashing is another way of making our website and user info secure, functions like md5 help us achieve it. => md5(password)--> returns hashed password
salting is the process of adding random chars at the end of hash password and use bcrypt>>md5
saltrounds specify the number of times salting is done to our hash password.
bcrypt.hash function takes plain password & saltrounds and returns a hash password.
to handle login, we use bcrypt.compare method.
cookies and sessions : cookies store the interaction data such as password and username of the user so that
he dosent have to login everytime he visits the page. Session is the time between login and logout, the user credentials
are stored in cookies until the user logs out of the website, it is useful because even if the server restarts, until 
the user logs out, his info will be stored in cookies.
*/
const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const mongoose = require('mongoose')
//const encrypt = require('mongoose-encryption')
//const md5 = require('md5')
const bcrypt = require('bcrypt')
const saltRounds = 10;
require("dotenv").config()
const app = express()
app.use(express.static("public"))
app.use(bodyParser.urlencoded({extended:"true"}));
app.set("view engine","ejs")

mongoose.connect(process.env.DATABASE_URL,{ useNewUrlParser: true, useUnifiedTopology: true })
.then(()=>{
    console.log("Mongodb Atlas Connected!!")
})
.catch(err=>{console.log(err)})

const userSchema = new mongoose.Schema ({
    email:String,
    password:String
})


//the values in the encryptedFeilds array are the data fields that need to be encrypted, refer to doc for more ways of defining it
// var secret = process.env.SOME_LONG_UNGUESSABLE_STRING;
// userSchema.plugin(encrypt, { secret: secret , encryptedFields:["password"] });

const User = mongoose.model("users",userSchema)

// const user1 = new User({
//     email:"test1",
//     password:"test2"
// })

// user1.save()


app.get("/",(req,res)=>{
    res.render("home")
});

app.get("/login",(req,res)=>{
    res.render("login")
});

app.get("/register",(req,res)=>{
    res.render("register")
});

app.post("/register",(req,res)=>{

    bcrypt.hash(req.body.password,saltRounds,(err,hash)=>{
        const newUser = new User({
            email:req.body.username,
            password:hash
        });
        newUser.save()
        .then(()=>res.render("secrets"))
        .catch(err=>{console.log(err)})
    });
    // ---------USING MD5----------
    // const newUser = new User({
    //     email:req.body.username,
    //     password:md5(req.body.password)
    // });
    // newUser.save()
    // .then(()=>res.render("secrets"))
    // .catch(err=>{console.log(err)})
});


app.post("/login",(req,res)=>{
    const username = req.body.username;
    const password = req.body.password;
    User.findOne({email:username})
    .then((founduser)=>{
        if(founduser){
            bcrypt.compare(password,founduser.password,(err,result)=>{
                if(result===true){
                    res.render("secrets")
                }
            });
        }
    })
    .catch(err=>{console.log(err)})
});







app.listen("3000",(req,res)=>{
    console.log("server started on port 3000")
})