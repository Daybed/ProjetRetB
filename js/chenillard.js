var on = false;
var speed = 500;
var clockwise = true; 
var changestate = function(io,fonction,chenillard,mySocket,connection,light){
    chenillard.on=!chenillard.on;
    mySocket.socketEmitChenillard(io,chenillard);
    console.log('le chenillard est en marche : '+chenillard.on);
    if(on==true){
        fonction.looptest(connection,chenillard,light);
    }
}
var changeclockwise = function(io,mySocket,chenillard){
    chenillard.clockwise=!chenillard.clockwise;
    console.log('le chenillard est dans le sens des aigluies d\'une montre : ' + chenillard.clockwise);
    mySocket.socketEmitChenillard(io,chenillard);
}
var setspeed = function(io,mySocket,newspeed,chenillard){
    if(newspeed<500){
        chenillard.speed=500;
    }
    else{
        chenillard.speed=newspeed;
    }
    console.log('la vitesse du chenillard est maintenant à : '+chenillard.speed+' ms.');
    mySocket.socketEmitChenillard(io,chenillard);
}

exports.changestate=changestate;
exports.changeclockwise=changeclockwise;
exports.setspeed=setspeed;
exports.on=on;
exports.speed=speed;
exports.clockwise=clockwise;