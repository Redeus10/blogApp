import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt, { hash } from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import session from "express-session";
import env from "dotenv";

const app=express();
const port=3000;
const saltRound=10;

env.config();
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:true
}))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(passport.initialize());
app.use(passport.session())

const db= new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});
db.connect();
app.get("/home",async(req,res)=>{
    const result=await db.query("SELECT posts.title, posts.content,posts.created_at,users.username FROM posts INNER JOIN users ON posts.id_user = users.id ORDER BY created_at DESC;")
    const newResult = result.rows.map(post => { return {
        ...post,
        created_at: new Date(post.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        })
    }
       
    });
    res.render("home.ejs",{posts:newResult})
})
app.get("/login",(req,res)=>{
    if(req.isAuthenticated()){
        console.log(req.user)
        res.redirect("/home")
    }
    else{
        res.render("login.ejs")
    }
    
})
app.get("/register",(req,res)=>{
    res.render("register.ejs")
})
app.get("/profile", async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const result = await db.query("SELECT * FROM posts WHERE id_user=$1", [req.user.id]);
            
            if (result.rows.length > 0) {
                const newResult = result.rows.map(post => {
                    return {
                        ...post,
                        created_at: new Date(post.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric"
                        })
                    };
                });

                res.render("profile.ejs", { username: req.user.username, posts: newResult });
            } else {
                res.render("profile.ejs", { username: req.user.username, text: "You don't have any posts yet. Why not add your first post?" });
            }

        } catch (err) {
            console.log(err);
        }
    } else {
        res.redirect("/login");
    }
});


app.get("/logout",(req,res)=>{
    req.logout(function (err) {
        if (err) {
          return next(err);
        }
        res.redirect("/home");
      });
})
app.get(
    "/auth/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
    })
);
app.get(
    "/auth/google/home",
    passport.authenticate("google", {
      successRedirect: "/home",
      failureRedirect: "/login",
    })
  );
app.post("/register",async(req,res)=>{
    const username=req.body.username;
    const email=req.body.email;
    const password=req.body.password;
    try{
        const CheckResult=await db.query("Select * from users where email=$1",[email])
        if(CheckResult.rows.length>0){
            res.render("register.ejs",{message:"User already exist try to login in"})
        }else{
             bcrypt.hash(password,saltRound,async(err,hash)=>{
                if(err){
                    console.log("error hashing password",err)
                }
                else{
                    const result=await db.query("insert into users(username,email,password)values($1,$2,$3) RETURNING * ",[username,email,hash])
                    const user = result.rows[0];
                    req.login(user, (err) => {
                        console.log("success");
                        res.redirect("/home");
                    });
                }
             })
        }
    }catch(err){
        console.log(err)
    }
    
})

app.post('/add',async(req,res)=>{
    const title=req.body.title;
    const content=req.body.content;
    try{
        if(title.trim().length>0 && content.trim().length>0){
            await db.query("insert into posts(title,content,id_user)values($1,$2,$3)",[title,content,req.user.id])
            res.redirect("/home")
        }
    }
    catch(err){
        console.log(err)
    }
})


app.post(
    "/login",
    passport.authenticate("local", {
      successRedirect: "/home",
      failureRedirect: "/login",
     
    })
  );
app.get("/delete-post/:id",async(req,res)=>{
    if(req.isAuthenticated()){
        const id=parseInt(req.params.id)
     try{
        const result=await db.query("select * from posts where id_post=$1",[id]);
        if(result.rows.length>0 ){
            if(result.rows[0].id_user===req.user.id){
                await db.query("delete from posts where id_post=$1",[id])
                res.redirect('/profile')
            }
            else{
                res.status(404).send("Post not found")
            }
            
        }
     }catch(err){
        console.log(err)
     }
    }
     
})
app.get("/edit-post/:id", async (req, res) => {
    if(req.isAuthenticated()){
        const id = Number(req.params.id); 
    
        if (isNaN(id)) {
            return res.status(400).send("Invalid Post ID");
        }
    
        try {
            const result = await db.query("SELECT * FROM posts WHERE id_post = $1", [id]);
    
            if (result.rows.length === 0) {
                return res.status(404).send("Post not found");
            }
            if(result.rows[0].id_user===req.user.id){
                res.render("edit.ejs", { postE: result.rows[0] });
            }
            else{
                return res.status(404).send("Post not found");
            }
           
        } catch (err) {
            console.error(err);
            res.status(500).send("Server Error");
        }
    }

    
       
});
app.post("/edit/:id",async(req,res)=>{
    const title=req.body.title;
    const content=req.body.content;
    const id=req.params.id
    try{
        if(title.trim().length>0 && content.trim().length>0){
            await db.query("UPDATE posts SET title = $1, content = $2 WHERE id_post = $3 RETURNING *",[title,content,id])
            res.redirect("/home")
        }
    }
    catch(err){
        console.log(err)
    }
    


})
passport.use("local",new Strategy({ usernameField: "email" ,passwordField:"password" },async function verify(email,password,cb){//the passport will think the username is the email so is should tell him what is the field im using
    try{
        const CheckResult=await db.query("select * from users where email=$1",[email])
        if(CheckResult.rows.length>0){
            const user=CheckResult.rows[0]
            const storedHashedPass=CheckResult.rows[0].password;
            bcrypt.compare(password,storedHashedPass,(err,valid)=>{
                if(err){
                    console.log("Error",err);
                    return cb(err)
                }
                else{
                    if(valid){
                        return cb(null,user)
                    }
                    else{
                        return cb(null,false)
                    }
                }
            })
        }else{
            return cb("Usernot found")
        }
    }catch(err){
        console.log(err)
        return cb(err)
    }



    
}));
passport.use(
    "google",
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/home",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
      },
      async (accessToken, refreshToken, profile, cb) => {
        try {
          
          const result = await db.query("SELECT * FROM users WHERE email = $1", [
            profile.email,
          ]);
          if (result.rows.length === 0) {
            const username=(profile.given_name || '') + (profile.family_name || '');
            const newUser = await db.query(
              "INSERT INTO users (username,email, password) VALUES ($1, $2, $3)",
              [username,profile.email, "google"]
            );
            return cb(null, newUser.rows[0]);
          } else {
            return cb(null, result.rows[0]);
          }
        } catch (err) {
          return cb(err);
        }
      }
    )
  );



passport.serializeUser((user,cb)=>{
    cb(null,user)
});
passport.deserializeUser((user,cb)=>{
    cb(null,user)
})
app.listen(port,()=>{
    console.log(`The app running in the port ${port}`)
} )