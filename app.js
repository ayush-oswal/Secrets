/*jshint esversion:6
hashing is another way of making our website and user info secure, functions like md5 help us achieve it. => md5(password)--> returns hashed password
salting is the process of adding random chars at the end of hash password and use bcrypt>>md5
saltrounds specify the number of times salting is done to our hash password.
bcrypt.hash function takes plain password & saltrounds and returns a hash password.
to handle login, we use bcrypt.compare method.
cookies and sessions : cookies store the interaction data such as password and username of the user so that
he dosent have to login everytime he visits the page. Session is the time between login and logout, the user credentials
are stored in cookies until the user logs out of the website, it is useful because even if the server restarts, until 
the user logs out, his info will be stored in cookies.
to levelup our authentication, we install passport, passport-local, passport-local-mongoose, express-session
we dont need to require passport local as it is a dependency for passport-local-mongoose
passport local mongoose automatically hashes and salts passwords when we plugin it into our db
serialize and deserialize are only necessary if we are using sessions
passport js comes with really usefull methods such as authenticate, isAuthenticated(), login, logout, register, etc
Next level of authentication is Oauth 2.0, we can authenticate users by using their google profile.
we recieve an access token which can be saved in our db. first npm i passport-google-oauth20 then go to googles developer
console and create an application. Then we create credentials such as client id and client secrets.
findOrCreate is not a mongoose method, its an option we can either implement it manually using findOne and Create
or we can install findOrCreate pakage
*/
const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const mongoose = require('mongoose')
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
require("dotenv").config()
const app = express()
app.use(express.static("public"))
app.use(bodyParser.urlencoded({extended:"true"}));
app.set("view engine","ejs")



app.use(session({
    secret: process.env.SOME_LONG_UNGUESSABLE_STRING,
    resave: false,
    saveUninitialized: false,
  }))
  app.use(passport.initialize());
  app.use(passport.session());



mongoose.connect(process.env.DATABASE_URL,{ useNewUrlParser: true, useUnifiedTopology: true })
.then(()=>{
    console.log("Mongodb Atlas Connected!!")
})
.catch(err=>{console.log(err)})

//mongoose.set("useCreateIndex",true)

const userSchema = new mongoose.Schema ({
    email:String,
    password:String,
    googleId:String,
    secret:String
})


userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

const User = mongoose.model("users",userSchema)

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile)
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/",(req,res)=>{
    res.render("home")
});

app.get("/login",(req,res)=>{
    res.render("login")
});

app.get("/register",(req,res)=>{
    res.render("register")
});

app.get("/secrets",(req,res)=>{
    User.find({"secret":{$ne:null}})
    .then((foundusers)=>{
        res.render("secrets",{secrets:foundusers})
    })
    .catch(err=>{console.log(err)})
});

app.get("/logout",(req,res)=>{
    req.logout(function(err){
        if(!err){
            res.redirect("/");
        }
        else{
            console.log(err)
        }
    });
    
}); 

app.get("/submit",(req,res)=>{
    if(req.isAuthenticated()){
        res.render("submit")
    }
    else{
        res.redirect("/login")
    }
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
  );

 app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, render secrets page
    res.redirect('/secrets');
  });


app.post("/register",(req,res)=>{
    User.register({username:req.body.username},req.body.password)
    .then((user)=>{
        passport.authenticate("local")(req,res,function(){
            res.redirect("/secrets")
        })
    })
    .catch(err=>{
        console.log(err)
        res.redirect("/register")
    })
});


app.post("/login",(req,res)=>{
    const user = new User({
        username:req.body.username,
        password:req.body.password
    })
    req.login(user,function(err){
        if(!err){
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets")
            })
        }
        else{
            console.log(err)
        }
    });
});


app.post("/submit",(req,res)=>{
    const secret = req.body.secret
    console.log(req.user.id)
    User.findById(req.user.id)
    .then((founduser)=>{
        founduser.secret = secret
        founduser.save()
        res.redirect("/secrets")
    })
    .catch(err=>{console.log(err)})
});




app.listen("3000",(req,res)=>{
    console.log("server started on port 3000")
})