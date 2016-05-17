global.on = false;
global.speed = 500;
global.clockwise = true;
global.hue = false;

var changestate = function(io, fonction, mySocket, connection,socket) {
if (connection.connected || on == true || hue == true) {
    if(socket!=undefined){
        var sommePos=0;
        var sommeNeg=0;
        var sommeError=0;
        for(i in fonction.light){
            if(fonction.light[i].etat==0){
                sommeNeg++;
            }
            else if(fonction.light[i].etat==1){
                sommePos++;
            }
            else{
                sommeError++;
            }
        }
        if(sommePos==4 || sommeNeg==4 || sommeError==4){
            mySocket.socketKNXIdentiques(socket);
        }
    }
        on = !on;
        exports.on = on;
        mySocket.socketEmitChenillard(io);
        if (on == true) {
            fonction.looptest(connection);
        }
    }
}
var changeclockwise = function(io, mySocket, sens) {
    if (sens == true || sens == false) {
        clockwise = sens;
    } else {
        clockwise = !clockwise;
    }
    exports.clockwise = clockwise;
    mySocket.socketEmitChenillard(io);
}
var setspeed = function(io, mySocket, newspeed) {
    if (newspeed < 500) {
        speed = 500;
    } else {
        speed = newspeed;
    }
    exports.speed = speed;
    mySocket.socketEmitChenillard(io);
}
var presenceHue = function(rep) {
    hue = rep;
    exports.hue = hue;
}
exports.changestate = changestate;
exports.changeclockwise = changeclockwise;
exports.setspeed = setspeed;
exports.on = on;
exports.speed = speed;
exports.clockwise = clockwise;
exports.hue = hue;
exports.presenceHue = presenceHue;