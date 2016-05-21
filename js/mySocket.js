var conf = require("../conf.json");
var fonction = require("./fonction.js");
var BDD = require("./BDD.js");
var chenillard = require("./chenillard.js");
var lastModeleEnclenché = "";
var modeleActuel="";
//|===================================================================================|
//|================================== socket client ==================================|
//|===================================================================================|
var socketClient = function(io, mySocket, connection) {

    io.on('connection', function(socket) {
        console.log("Un client s'est connecté");

        socket.emit('lampes', fonction.light);

        BDD.findAll(function(rep) {
            socket.emit('Modeles', rep);
        });

        socket.emit('Chenillard', {
            on: chenillard.on,
            speed: chenillard.speed,
            sens: chenillard.clockwise
        });

        fonction.initialisationHue(socket,mySocket);

        socket.emit('lastModeleEnclenché',{last:lastModeleEnclenché,nouveau:modeleActuel});
        socket.on('disconnection',function(socket){
            console.log("Un client s'est déconnecté");
        });

        socket.on('setlampe', function(data) {
            if (chenillard.on == true) {
                chenillard.changestate(io, fonction, mySocket, connection);
            }
            fonction.setknx(connection, data.adresse, data.etat);
        });
        socket.on('sethue', function(data) {
            var url = "http://" + conf.ipAdresseHue + '/api/' + conf.hueUsername + "/lights/" + data.lampe + "/state";
            var param = JSON.stringify({
                "on": data.on,
                "bri": data.bri,
                "sat": data.sat
            });
            var res = fonction.Put(url, param);
            var json = JSON.parse(res);
            if(json[0].success){
                fonction.initialisationHue(io,mySocket);
            }
        });
        socket.on('setsens', function(data) {
            chenillard.changeclockwise(io, mySocket, data);
        });
        socket.on('setspeed', function(vitesse) {
            chenillard.setspeed(io, mySocket, vitesse);
        });
        socket.on('setstate', function() {
            chenillard.changestate(io, fonction, mySocket, connection,socket);
        });
        socket.on('NouveauModele',function(data){
            BDD.add(data.nom,data.infos.chenillard,data.infos.lampes,data.infos.hue,function(data){
                io.emit('nouveauModele',data.nom);
                BDD.findAll(function(rep){
                    io.emit('Modeles',rep);
                });
            });

        });
        socket.on('setCouleurHue', function(data) {
            var url = "http://" + conf.ipAdresseHue + '/api/' + conf.hueUsername + "/lights/" + data.lampe + "/state";
            var param = JSON.stringify({
                "xy": [fonction.rgbToXyBri(data.r, data.g, data.b).x, fonction.rgbToXyBri(data.r, data.g, data.b).y],
                "bri": Math.round(fonction.rgbToXyBri(data.r, data.g, data.b).bri)
            });
            var res = fonction.Put(url, param);
            var json = JSON.parse(res);
            if (json[0].success) {
                fonction.initialisationHueIo(io, mySocket);
            }
        });

        socket.on('modeleEnclenché',function(modele){
            modeleActuel=modele.nom;
            modele.light= JSON.parse(modele.light);
            modele.hue=JSON.parse(modele.hue);
           /* var hue=[];
            hue[0]=modele.hue.substring(1);
            hue[0]= hue[0].substring(0, hue[0].length-1);
            var huesplit=hue[0].split(',');
            var j= 0;
            for (var i = 0; i < huesplit.length/14; i++) {
                hue[i]=""
                for(j; j<(13*(i+1)+i) ; j++){
                    hue[i]=hue[i]+huesplit[j]+',';
                }
                hue[i]=JSON.parse(hue[i]+huesplit[13*(i+1)+i]);
                j=(13*(i+1)+i)+1;
            }
            modele.hue=hue;
            var lampes=[];
            lampes[0]=modele.light.substring(1);
            lampes[0]= lampes[0].substring(0, lampes[0].length-1);
            var lampesSplit=lampes[0].split(',');
            console.log("lampesSplit : "+lampesSplit +"\n");
            var j= 0;
            for (var i = 0; i < lampesSplit.length/5; i++) {
                lampes[i]=""
                for(j; j<(4*(i+1)+i) ; j++){
                    lampes[i]=lampes[i]+lampesSplit[j]+',';
                }
                lampes[i]=JSON.parse(lampes[i]+lampesSplit[4*(i+1)+i]);
                j=(4*(i+1)+i)+1;
            }
            modele.light=lampes;
            */

            io.emit('lastModeleEnclenché',{last:lastModeleEnclenché,nouveau:modele.nom});
            lastModeleEnclenché=modele.nom;
            if(modele.sens=='droite'){
                chenillard.changeclockwise(io,mySocket,true);
            }
            else if(modele.sens=="gauche"){
                chenillard.changeclockwise(io,mySocket,false);
            }
            chenillard.setspeed(io,mySocket,modele.speed);
            for(i in modele.light){
                if(modele.light[i].etat!="error"){
                fonction.setknx(connection, modele.light[i].adresse, modele.light[i].etat);
                }
                else{
                fonction.setknx(connection,modele.light[i].adresse,false);
                }
            }
            if(fonction.Get("http://"+conf.ipAdresseHue +'/api/'+conf.hueUsername+'/lights/')!='error'){
                if(modele.hue[0]!=undefined){
                    for(i in modele.hue){

                        var url= "http://"+conf.ipAdresseHue +'/api/'+conf.hueUsername+'/lights/'+modele.hue[i].lampe+'/state';
                        var requete="{"+
                            '"on":'+modele.hue[i].on+","+
                            '"bri":'+modele.hue[i].bri+","+
                            '"xy": ['+[fonction.rgbToXyBri(parseInt(modele.hue[i].rgb.r), parseInt(modele.hue[i].rgb.g), parseInt(modele.hue[i].rgb.b)).x,fonction.rgbToXyBri(parseInt(modele.hue[i].rgb.r), parseInt(modele.hue[i].rgb.g), parseInt(modele.hue[i].rgb.b)).y]+"]"+
                        "}";
                        var res = fonction.Put(url, requete);
                        var json = JSON.parse(res);
                        if (json[0].success) {
                        } else {
                            console.log("Erreur : :" +modele+". Type de l'erreur : " + json[0].error.description);
                        }

                    }
                    fonction.initialisationHue(io, mySocket);
                }
            }
        });

        socket.on('supprimerModele', function(nom) {
            BDD.removeByName(nom, function(fichier) {
                io.emit('modeleSupprimé', fichier.nom);
            });
            BDD.findAll(function(rep) {
                io.emit('Modeles', rep);
            });
        });
    });
}
//|===================================================================================|
//|================================== Listener KNK====================================|
//|===================================================================================|
var startDiminuer, endDiminuer;
var startAugmenter, endAugmenter;
var intervalUp, intervalDown;
var socketListenerKNX = function(io, connection, mySocket) {
        connection.on('status', function(data, data1, data2) {
            console.log('status : L\'adresse ' + data + " est a l'état : " + data1);
                fonction.light[data[4] - 1].etat = data1;
        });
        connection.on('event', function(data, data1, data2) {
            console.log('event : L\'adresse ' + data + " est a l'état : " + data1);
            if (data[0] == 0) {
                fonction.light[data[4] - 1].etat = data1;
                io.emit('lampes', fonction.light);
            } else if (data[0] == 1) {
                if (data1 == 1) {
                    if (data[4] == 1) {
                        chenillard.changestate(io, fonction, mySocket, connection);
                    } else if (data[4] == 2) {
                        chenillard.changeclockwise(io, mySocket);
                    } else if (data[4] == 3) {
                        startDiminuer = new Date().getTime();
                        intervalDown = setInterval(function() {
                            chenillard.setspeed(io, mySocket, chenillard.speed + 100);
                        }, 100);
                    } else if (data[4] == 4) {
                        startAugmenter = new Date().getTime();
                        intervalUp = setInterval(function() {
                            chenillard.setspeed(io, mySocket, chenillard.speed - 100);
                        }, 100);
                    }
                } else if (data1 == 0) {
                    if (data[4] == 3) {
                        endDiminuer = new Date().getTime();
                        clearInterval(intervalDown);
                        if ((endDiminuer - startDiminuer) < 100) {
                            chenillard.setspeed(io, mySocket, chenillard.speed + 100);
                        }
                    } else if (data[4] == 4) {
                        endAugmenter = new Date().getTime();
                        clearInterval(intervalUp);
                        if ((endAugmenter - startAugmenter) < 100) {
                            chenillard.setspeed(io, mySocket, chenillard.speed - 100);
                        }
                    }
                }
            }
        });
    }
    
    //|===================================================================================|
    //|========================================= Emit ====================================|
    //|===================================================================================|
var socketEmitChenillard = function(socket) {
    socket.emit('Chenillard', {
        on: chenillard.on,
        speed: chenillard.speed,
        sens: chenillard.clockwise
    });
}
var socketInitHue = function(socket, hue) {
        socket.emit('Hue', hue);
    }
var socketInitHueIo = function(io, hue) {
        io.emit('Hue', hue);
    }
var socketKNXIdentiques= function(socket){
    socket.emit('erreur',"Pas besoin de lancer le chenillard, les lampes sont toutes aux mêmes état");
}

var socketKNXDisconnected=function(socket){
    socket.emit('erreur',"Impossible de lancer le chenillard, KNX non connecté");
}
    //|===================================================================================|
    //|============================= Exports des fonctions utiles ========================|
    //|===================================================================================|
exports.socketClient = socketClient;
exports.socketListenerKNX = socketListenerKNX;
exports.socketEmitChenillard = socketEmitChenillard;
exports.socketInitHue = socketInitHue;
exports.socketInitHueIo=socketInitHueIo;
exports.socketKNXIdentiques=socketKNXIdentiques;
exports.socketKNXDisconnected=socketKNXDisconnected;