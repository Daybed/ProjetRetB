var on = false;
var speed = 500;
var clockwise = true; 

var changestate = function(io,fonction,chenillard,mySocket,connection,light){
    chenillard.on=!chenillard.on;
    mySocket.socketEmitChenillard(io,chenillard);
    if(on==true){
        fonction.looptest(connection,chenillard,light);
    }
}
var changeclockwise = function(io,mySocket,chenillard,sens){
    if(sens==true || sens==false){
        chenillard.clockwise = sens;
    }
    else{
    chenillard.clockwise=!chenillard.clockwise;
    }
mySocket.socketEmitChenillard(io,chenillard);
}

var setspeed = function(io,mySocket,newspeed,chenillard){
    if(newspeed<500){
        chenillard.speed=500;
    }
    else{
        chenillard.speed=newspeed;
    }
    mySocket.socketEmitChenillard(io,chenillard);
}

exports.changestate=changestate;
exports.changeclockwise=changeclockwise;
exports.setspeed=setspeed;
exports.on=on;
exports.speed=speed;
exports.clockwise=clockwise;