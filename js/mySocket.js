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
                fonction.initialisationHue(socket,mySocket);
            }
        });
        socket.on('setsens', function(data) {
            chenillard.changeclockwise(io, mySocket, data);
        });
        socket.on('setspeed', function(vitesse) {
            chenillard.setspeed(io, mySocket, vitesse);
        });
        socket.on('setstate', function() {
            chenillard.changestate(io, fonction, mySocket, connection);
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
                fonction.initialisationHue(socket, mySocket);
            }
        });

        socket.on('modeleEnclenché',function(modele){
            modelActuel=modele.nom;
            io.emit('lastModeleEnclenché',{last:lastModeleEnclenché,nouveau:modele.nom});
            lastModeleEnclenché=modele.nom;

            if(modele.sens=='droite'){
                chenillard.changeclockwise(io,mySocket,true);
            }
            else if(modele.sens=="gauche"){
                chenillard.changeclockwise(io,mySocket,false);
            }
            chenillard.setspeed(io,mySocket,modele.speed);
            for(i in modele.lampes){
                if(modele.lampes[i].etat!="error"){
                fonction.setknx(connection, modele.lampes[i].adresse, modele.lampes[i].etat);
                }
                else{
                fonction.setknx(connection,modele.lampes[i].adresse,false);
                }
            }
            var url= "http://"+conf.ipAdresseHue +'/api/'+conf.hueUsername+'/lights';
            var requete;
            for(i in modele.hue){
                requete+=modele.hue[i].lampe +":{'state':{"+
                    "'on':"+modele.hue[i].on+","+
                    "'bri':"+modele.hue[i].bri+","+
                    "'sat':"+modele.hue[i].sat+","+
                    "'xy':"+[fonction.rgbToXyBri(parseInt(modele.hue[i].rgb.r), parseInt(modele.hue[i].rgb.g), parseInt(modele.hue[i].rgb.b)).x,fonction.rgbToXyBri(parseInt(modele.hue[i].rgb.r), parseInt(modele.hue[i].rgb.g), parseInt(modele.hue[i].rgb.b)).y]+
                "}}";
            }
            var res = fonction.Put(url, "{"+requete+"}");
            var json = JSON.parse(res);
            if (json[0].success) {
                fonction.initialisationHue(socket, mySocket);
            } else {
                console.log("Erreur : :" +modele+". Type de l'erreur : " + json[0].error.description);
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
            if (data1 == 0 || data1 == 1) {
                fonction.light[data[4] - 1].etat = data1;
            } else if (data1 != 0 && data1 != 1 && fonction.light[data[4] - 1].nberreur < 10) {
                fonction.getknx(connection, data);
                fonction.light[data[4] - 1].nberreur++;
            }
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
                            chenillard.setspeed(io, mySocket, chenillard.speed + 10);
                        }, 100);
                    } else if (data[4] == 4) {
                        startAugmenter = new Date().getTime();
                        intervalUp = setInterval(function() {
                            chenillard.setspeed(io, mySocket, chenillard.speed - 10);
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
    //|===================================================================================|
    //|============================= Exports des fonctions utiles ========================|
    //|===================================================================================|
exports.socketClient = socketClient;
exports.socketListenerKNX = socketListenerKNX;
exports.socketEmitChenillard = socketEmitChenillard;
exports.socketInitHue = socketInitHue;