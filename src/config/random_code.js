let sample="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^";

function find_code(length) {
    let res=""
    for (let index = 0; index <length; index++) {
        const i=Math.floor(Math.random()*sample.length);
        res+=sample[i];
    }
    return res;
}
module.exports=find_code;