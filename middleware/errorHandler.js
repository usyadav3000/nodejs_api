class errorHandler{
    constructor(statusCode,message,nativeError){
        this.statusCode=statusCode;
        this.message=message;
        this.success=false;
        this.nativeError=nativeError ||' ';
    }
}
module.exports={
    errorHandler
}