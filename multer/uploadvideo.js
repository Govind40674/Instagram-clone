// const multer=require("multer");
// const path=require("path");

// const storage=multer.diskStorage({
//   destination:(req,file,cb)=>{
//     cb(null,"./uploads");
//   },
//   filename:(req,file,cb)=>{
//     const filename=Date.now()+path.extname(file.originalname);
//     cb(null,filename);
    
//   }
// });
// const upload=multer({storage:storage});

// module.exports={upload};

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "interior_project", // Cloudinary folder name
    // allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});
const upload = multer({ storage });


const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "interior_reels", // Folder name on Cloudinary
    resource_type: "video", // VERY IMPORTANT for video uploads
  },
});

const videoUpload = multer({ storage: videoStorage });

module.exports = { upload, videoUpload };





