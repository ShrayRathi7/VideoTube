class apiResponse{
    constructor(
        stausCode,
        data,
        message="success"
    ){
        this.statusCode=statusCode
        this.data=data
        this.message=message
        this.success=statusCode<400
    }
}