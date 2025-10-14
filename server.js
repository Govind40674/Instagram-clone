require ("dotenv").config();
const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const Chat = require("./models/chat");
const Member = require("./models/member");
const Login = require("./models/login"); 
const Reel = require("./models/reel");
const cookieParser = require("cookie-parser");
const csrf=require("csurf");
const {body,validationResult}=require("express-validator");
const auth = require("./auth/auth");
const csrfProtection=csrf({cookie:true});
const multer=require("multer");
const { upload,videoUpload } = require("./multer/uploadvideo");
const bcrypt = require("bcryptjs");
const Post = require("./models/post");
const Invite = require("./models/invite");
const validationRegistrationlogin=require("./validation/login");
const Profile = require("./models/profile");
const validationRegistrationprofile=require("./validation/edit-profile");
const fs = require("fs");

const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});








const app = express();
const server = http.createServer(app);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));



app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/images", express.static(path.join("images")));


async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}

main();

const io = new Server(server);

app.get("/login",csrfProtection,(req, res) => {
  const error=req.query.error || null;
  res.render("login",{csrfToken:req.csrfToken(),error:error});
});
app.post("/login",validationRegistrationlogin,csrfProtection, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      return res.redirect("/login?error:errors.array()[0].msg");
    
  }
  const { name, email, password } = req.body;
  const user = await Login.findOne({ name, email });
  // const passwordMatch=await bcrypt.compare(password,user.password);
 
  if (!user) {
    return res.redirect("/?error=Invalid credentials");
  }
  if(!await bcrypt.compare(password,user.password)){
    return res.redirect("/login?error=Invalid password");
  }
  res.cookie("user", name,
     {
       httpOnly: true,
       maxAge: 24*60* 60 * 1000, // 1 day
      }
    );
  res.redirect("/");


});


app.get("/signup",csrfProtection,async (req, res) => {
  const error=req.query.error || null;
  res.render("signup",{csrfToken:req.csrfToken(),error:error});

});
app.post("/signup",validationRegistrationlogin,csrfProtection, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.redirect("/signup?error="+errors.array()[0].msg);
  }

  const { name, email, password } = req.body;
  const existingUser = await Login.findOne({ name });
  if (existingUser) {
    return res.redirect("/signup?error=try another name");
  }
  const existingmail = await Login.findOne({ email});
  if (existingmail) {
    return res.redirect("/signup?error=try another email");
  };
  let hashedPassword = await bcrypt.hash(password, 10);
  const data = new Login({ name, email, password: hashedPassword });
  await data.save();
  const member=new Member({name:name});
  await member.save();
  const profile=new Profile({name:name});
  await profile.save();
  const invite=new Invite({name:name,invitation:[]});
  await invite.save();
  res.redirect("/login?error=now you can login");
});

app.use(auth);






app.get("/", async (req, res) => {
  try {
    const member = await Member.findOne({ name: req.cookies.user });

    if (!member) {
      // If no user found, clear cookie and redirect to login
      res.clearCookie("user");
      return res.redirect("/login?error=User not found");
    }

    const followers = member.followers || []; // safe fallback if empty
    const posts = await Post.find({ name: { $in: followers } }).sort({ createdAt: -1 });


    const posts_admin=await Post.find({name:"admin"}).sort({createdAt:-1});


    res.render("index", { posts,posts_admin });
  } catch (err) {
    
    // res.status(500).send("Internal Server Error");
    res.render("error", { error: err.message });
  }
});




app.get("/upload",csrfProtection,(req, res) => {
  const errorreel=req.query.errorreel || null;
  const errorpost=req.query.errorpost || null;


  res.render("upload",{csrfToken:req.csrfToken(),errorreel:errorreel,errorpost:errorpost});
});

// app.post("/upload-reel", upload.single("video"),body("description").escape(), csrfProtection, async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.redirect("/upload?error=No video uploaded");
//     }


//     const { description } = req.body;

//     const videoData = new Reel({
//       name: req.cookies.user,
//       videoUrl:req.file.path,
//       description:description,
//     });

//     await videoData.save();
//     res.redirect("/");
//   } catch (err) {
  
//     res.redirect("/upload-reel?errorreel=Upload failed");
//   }
// });
// app.post(
//   "/upload-reel",
//   videoUpload.single("video"),
//   body("description").escape(),
//   csrfProtection,
//   async (req, res) => {
//     try {
//       if (!req.file) {
//         return res.redirect("/upload?errorreel=No video uploaded");
//       }

//       const { description } = req.body;

//       const videoData = new Reel({
//         name: req.cookies.user,
//         videoUrl: req.file.path, // Cloudinary video URL
//         description: description,
//       });

//       await videoData.save();
//       res.redirect("/");
//     } catch (err) {
//       // console.error("Video upload failed:", err);
//       res.redirect("/upload-reel?errorreel=Upload failed");
//     }
//   }
// );
app.post(
  "/upload-reel",
  (req, res, next) => {
    videoUpload.single("video")(req, res, (err) => {
      if (err) {
        console.error("Multer/Cloudinary Video Upload Error:", err.message);
        return res.redirect("/upload?errorreel=" + encodeURIComponent(err.message));
      }
      next();
    });
  },
  body("description").escape(),
  csrfProtection,
  async (req, res) => {
    try {
      // If file didn’t upload
      if (!req.file) {
        return res.redirect("/upload?errorreel=No video uploaded");
      }

      const { description } = req.body;

      const videoData = new Reel({
        name: req.cookies.user,
        videoUrl: req.file.path, // Cloudinary video URL
        description: description,
      });

      await videoData.save();
      res.redirect("/");
    } catch (err) {
      console.error("Server Error During Video Upload:", err);
      res.redirect("/upload-reel?errorreel=Upload failed");
    }
  }
);



// app.post("/upload-post", upload.single("image"),body("caption").escape(), csrfProtection, async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.redirect("/upload?error=No image uploaded");
//     }


//     const { caption } = req.body;

//     const postData = new Post({
//       name: req.cookies.user,
//       image:req.file.path,
//       caption:caption,
//     });

//     await postData.save();
//     res.redirect("/");
//   } catch (err) {
//     console.error(err);
//     res.redirect("/upload-post?errorpost=Upload failed");
//   }
// });
// app.post(
//   "/upload-post",
//   upload.single("image"),
//   body("caption").escape(),
//   csrfProtection,
//   async (req, res) => {
//     try {
//       // Check if file exists
//       if (!req.file) {
//         return res.redirect("/upload?errorpost=No image uploaded");
//       }

//       const { caption } = req.body;

//       // req.file.path will now contain the Cloudinary URL
//       const postData = new Post({
//         name: req.cookies.user,
//         image: req.file.path, // Cloudinary image URL
//         caption: caption,
//       });

//       await postData.save();
//       res.redirect("/");
//     } catch (err) {
//       // console.error("Upload failed:", err);
//       res.redirect("/upload-post?errorpost=Upload failed");
//     }
//   }
// );
app.post(
  "/upload-post",
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        // console.error("Multer/Cloudinary Upload Error:", err.message);
        return res.redirect("/upload?errorpost=" + encodeURIComponent(err.message));
      }
      next();
    });
  },
  body("caption").escape(),
  csrfProtection,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.redirect("/upload?errorpost=No image uploaded");
      }

      const { caption } = req.body;

      const postData = new Post({
        name: req.cookies.user,
        image: req.file.path, // Cloudinary URL
        caption: caption,
      });

      await postData.save();
      res.redirect("/");
    } catch (err) {
      // console.error("Server Error During Upload:", err);
      res.redirect("/upload-post?errorpost=Upload failed");
    }
  }
);



app.get("/profile", async (req, res) => {
  const user=req.cookies.user;
  const member=await Member.findOne({name:user});
  const reel=await Reel.find({name:user});
  let post=await Post.find({name:user});
  let invite=await Invite.findOne({name:user});
 
  let profile=await Profile.findOne({name:user});
  res.render("profile", { member, reel, post,invite,profile});
});





app.get("/followers", async (req, res) => {
  const member = await Member.findOne({name:req.cookies.user});
  memberlist=member.followers;
  const memberpic=await Profile.find({name:{$in:memberlist}});
  res.render("follower", { memberpic });
});

app.get("/message/:name", async (req, res) => {
  let {name}=req.params;
 
  const user=req.cookies.user;
  const chat=await Chat.find({
    $or:[
      {sendername:user,receivername:name},
      {sendername:name,receivername:user}
    ]
  }).sort({date:1});
  res.render("chat", { name,user,chat});

});
io.on("connection", (socket) => {
  

  socket.on("joinRoom", (data) => {
    socket.join(data.room);

  });

  socket.on("sendMessage", async (data) => {
    const { sendername, receivername, message, room } = data;
    const chat = new Chat({ sendername, receivername, message, date: new Date() });
    await chat.save();
    io.to(room).emit("receiveMessage", chat);
  });

  socket.on("disconnect", () => {
    // console.log("🔴 User disconnected");
  });
});


app.get("/message-list", async (req, res) => {
  try {
    const user = req.cookies.user;

    // Find current member
    const member = await Member.findOne({ name: user });
    // if (!member) return res.status(404).send("Member not found");

    const followerNames = member.followers;

    // Find follower profiles with name, image, and bio
    const followers = await Profile.find(
      { name: { $in: followerNames } },
      { name: 1, image: 1, bio: 1, _id: 0 }
    );

    // Render and send to EJS
    res.render("message-list", { user, followers });
  } catch (err) {
    // console.error(err);
    res.status(500).send("Server Error");
  }
});



app.get("/invite", async (req, res) => {
  const invite=await Invite.findOne({name:req.cookies.user});
  const invitemember=await Profile.find({name:{$in:invite.invitation}});
  res.render("invite",{invitemember});
});
app.get("/invite/accept/:name", async (req, res) => {
  const {name}=req.params;
  const user=req.cookies.user;
 
  await Invite.updateOne({name:user},{$pull:{invitation:name}});
  await Member.updateOne({name:user},{$push:{followers:name}});
  await Member.updateOne({name:name},{$push:{followers:user}});

 
 
  
  res.redirect("/invite");
});
app.get("/invite/reject/:name", async (req, res) => {
  const {name}=req.params;
  const user=req.cookies.user;
await Invite.updateOne(
  { name: req.cookies.user },
  { $pull: { invitation: name } }
);

  res.redirect("/invite");
});
app.get("/reels", async (req, res) => {
  const reel=await Reel.find({}).sort({createdAt:-1});
  res.render("reel",{reel});
});
app.get("/profile-other/:name", async (req, res) => {
  const { name } = req.params;
  
  if (!name) return res.redirect("/search");

  const profile = await Profile.findOne({ name: name }); 
  // console.log(profile.image);// 👈 changed from findOne to find
  if (!profile || profile.length === 0) return res.redirect("/search");

  const members = await Member.findOne({ name: req.cookies.user });
  const current = members.followers || [];

  const member = await Profile.find({
    $and: [
      { name: { $ne: req.cookies.user } },
      { name: { $nin: current } }
    ]
  });

  const memberlist = member.map(m => m.name);
  if (!memberlist.includes(name)) {
    return res.redirect("/search");
  }

  res.render("profile-other", { profile });
});








app.get("/send-invite/:name", async (req, res) => {
  const {name}=req.params;
  const user=req.cookies.user;
  let exit= await Invite.findOne({name:name});
  if(!exit){
    const invite=new Invite({name:name,invitation:[user]});
    await invite.save();
    return res.redirect("/search");
  }

  const invite=await Invite.findOne({name:name,invitation:user});
  if(invite){
    return res.redirect("/search");
  }
  await Invite.updateOne({name:name},{$push:{invitation:user}});
  res.redirect("/search");
});
app.get("/search", async (req, res) => {

const members = await Member.findOne({ name: req.cookies.user });
const current=members.followers;
const member = await Profile.find({
  $and: [
    { name: { $ne: req.cookies.user } },  // name not equal to logged-in user
    { name: { $nin: current } }           // name not in "current" array
  ]
});


  res.render("search",{member});
});

app.get("/edit-profile",csrfProtection, async (req, res) => {
  const error=req.query.error || null;
  const profile=await Profile.findOne({name:req.cookies.user});
  res.render("edit-profile",{csrfToken:req.csrfToken(),error:error,profile:profile});
});
app.post("/edit-profile", upload.single("image"),body("bio").escape(), csrfProtection, async (req, res) => {
  try {
   
    const { bio } = req.body;
    const user = req.cookies.user;
    await Profile.updateOne(
  { name: user },
  { $set: { bio: bio } }
);

    if (req.file) {
      await Profile.updateOne({ name: user }, { $set: { image: req.file.path }});
    }
   
    res.redirect("/profile");
  } catch (error) {
    res.redirect(`/edit-profile?error=${encodeURIComponent(error.message)}`);
  }
});





app.get("/delete-post/:id", async (req, res) => {
  const { id } = req.params;
  await Post.findByIdAndDelete(id);
  res.redirect("/profile");
});

app.get("/delete-reel/:id", async (req, res) => {
  const { id } = req.params;
  await Reel.findByIdAndDelete(id);
  res.redirect("/profile");
});


app.get("/search-message", async (req, res) => {
  let {query}=req.query;
  if(!query){
    return res.redirect("/search");
  }
  
  const member = await Profile.findOne({name:query});
  if(!member){
    return res.redirect("/search");
  }
   

  res.render("search-message",{member});
});


app.get("/delete-follower/:name", async (req, res) => {
  const {name}=req.params;
  const user=req.cookies.user;
  await Member.updateOne({name:user},{$pull:{followers:name}});
  await Member.updateOne({name:name},{$pull:{followers:user}});
   await Chat.deleteMany({
      $or: [
        { sendername: user, receivername: name },
        { sendername: name, receivername: user }
      ]
    });
  

  res.redirect("/followers");
});


app.get("/logout", async (req, res) => {
  res.clearCookie("user");
  res.redirect("/");
});


app.get("/:id", async (req, res) => {
  res.render("error", { error: "Page not found" });
})
app.get("/:id/:id", async (req, res) => {
  res.render("error", { error: "Page not found" });
})
app.get("/:id/:id/:id", async (req, res) => {
  res.render("error", { error: "Page not found" });
})
app.get("/:id/:id/:id/:id", async (req, res) => {
  res.render("error", { error: "Page not found" });
})
app.get("/:id/:id/:id/:id/:id", async (req, res) => {
  res.render("error", { error: "Page not found" });
})
app.get("/:id/:id/:id/:id/:id/:id", async (req, res) => {
  res.render("error", { error: "Page not found" });
})



app.use((err, req, res, next) => {
 
  res.render("error", { error: err.message });
})





   



 


server.listen(process.env.PORT, () => {
  console.log(`✅ Server running on port ${process.env.PORT}`);
});


