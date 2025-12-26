const Async_handler=(Request_handler)=>{
   return (req,res,next)=>{
      Promise.resolve(Request_handler(req,res,next)).catch((err)=>next(err));
    }
}
module.exports=Async_handler;