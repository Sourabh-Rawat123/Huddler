class api_sucess {
    constructor(statusCode,data,message="Success") {
        this.statusCode=statusCode
        this.data=data
        this.message=message
        this.success=statusCode<400;
    }
}
module.exports=api_sucess;