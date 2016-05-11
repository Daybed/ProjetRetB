var on = false;
var speed = 500;
var clockwise = true; 

var changestate = function(io,fonction,mySocket,connection){
    on=!on;
    exports.on=on;
    mySocket.socketEmitChenillard(io);
    console.log('le chenillard est en marche : '+on);
    if(on==true){
        fonction.looptest(connection);
    }
}
var changeclockwise = function(io,mySocket,sens){
    if(sens==true || sens==false){
        clockwise = sens;
    }
    else{
    clockwise=!clockwise;
    }
    exports.clockwise=clockwise;
    mySocket.socketEmitChenillard(io);
}

var setspeed = function(io,mySocket,newspeed){
    if(newspeed<500){
        speed=500;
    }
    else{
        speed=newspeed;
    }
    console.log('la vitesse du chenillard est maintenant à : '+speed+' ms.');
    exports.speed=speed;
    mySocket.socketEmitChenillard(io);
}

exports.changestate=changestate;
exports.changeclockwise=changeclockwise;
exports.setspeed=setspeed;
exports.on=on;
exports.speed=speed;
exports.clockwise=clockwise;