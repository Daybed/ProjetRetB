var on = false;
var speed = 500;
var clockwise = true; 
var changestate = function(io,fonction,objet,socket,connection,light){
    on=!on;
    socket.socketEmitChenillard(io,this);
    if(this.on==true){
        fonction.looptest(connection,objet,light);
    }
}
var changeclockwise = function(io,socket){
    clockwise=!clockwise;
    socket.socketEmitChenillard(io,this);
}
var setspeed = function(io,socket,newspeed){
    if(newspeed<500){
        speed=500;
    }
    else{
        speed=newspeed;
    }
    socket.socketEmitChenillard(io,this);
}

exports.changestate=changestate;
exports.changeclockwise=changeclockwise;
exports.setspeed=setspeed;
exports.on=on;
exports.speed=speed;
exports.clockwise=clockwise;