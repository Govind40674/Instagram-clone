require ("dotenv").config();

const auth=(req,res,next)=>{
   
    const user=req.cookies.user;
    if(!user){
        return res.redirect("/login");
    }
    next();
}

module.exports=auth;
