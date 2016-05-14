var app = angular.module("myApp", ['ngMaterial', 'ngToast', 'ngSanitize']);
var ip;
var socket = io();
var Lampes = [];
var initialisation = false;

function couleur(picker, numero) {
    var resultat = {
        lampe: numero,
        r: parseInt(picker.rgb[0]),
        g: parseInt(picker.rgb[1]),
        b: parseInt(picker.rgb[2])
    };
    socket.emit('setCouleurHue', resultat);
};
app.controller('myCtrl', function($scope, $http, ngToast) {
    $scope.test = [1, 2, 5, 5, 2, 9, 0, 0, 0, 1, 2, 980];
    socket.on('Chenillard', function(data) {
        $scope.$apply(function() {
            $scope.speed = data.speed;
            $scope.sens = data.sens;
            $scope.on = data.on;
            if (data.on == true) {
                $scope.loopstart = "public/img/pause.png";
            } else {
                $scope.loopstart = "public/img/play.png";
            }
            if (data.sens == true) {
                $scope.rightSens = "public/img/chevron-double-right_on.png";
                $scope.leftSens = "public/img/chevron-double-left_off.png";
            } else if (data.sens == false) {
                $scope.rightSens = "public/img/chevron-double-right_off.png";
                $scope.leftSens = "public/img/chevron-double-left_on.png";
            }
        });
    });
    $scope.loop = function() {
        socket.emit('setstate');
    };
    $scope.setsens = function(sens) {
        socket.emit('setsens', sens);
    };
    $scope.setspeed = function() {
        socket.emit('setspeed', $scope.speed);
    };
    socket.on('lampes', function(data) {
        var total = 0;
        for (i in data) {
            if (data[i].etat == 1) {
                Lampes[i] = {
                    img: "public/img/lampeon.png",
                    adresse: data[i].adresse,
                    etat: true,
                    num: data[i].numero
                };
                total++;
            } else if (data[i].etat == 0) {
                Lampes[i] = {
                    img: "public/img/lampeoff.png",
                    adresse: data[i].adresse,
                    etat: false,
                    num: data[i].numero
                };
                total++;
            } else {
                Lampes[i] = {
                    img: "public/img/lampeerror.png",
                    adresse: data[i].adresse,
                    etat: "error",
                    num: data[i].numero
                };
            }
        }
        $scope.$apply(function() {
            $scope.lampes = Lampes;
        });
        if (total > 0) {
            document.getElementById("knx").style.visibility = "visible";
        } else {
            document.getElementById("knx").style.visibility = "hidden";
        }
    });
    socket.on('Hue', function(data) {
        $scope.$apply(function() {
            $scope.Hue = data;
        });
        if (data[0] != null) {
            document.getElementById("hue").style.visibility = "visible";
        } else {
            document.getElementById("hue").style.visibility = "hidden";
        }
        if (initialisation == false) {
            initialisation = true;
            for (i in data) {
                window['input' + i] = document.createElement('INPUT');
                window['picker' + i] = new jscolor(window['input' + i]);
                window['picker' + i].hash = true;
                window['picker' + i].onchange = function() {
                    couleur(window['picker' + i], data[i].lampe);
                };
                document.getElementById('container').appendChild(window['input' + i]);
            }
        }
        for (i in data) {
            if (data[i].on == true) {
                document.getElementById("hue " + data[i].lampe).style.backgroundColor = 'rgb(' + data[i].rgb.r + ',' + data[i].rgb.g + ',' + data[i].rgb.b + ')';
            } else {
                document.getElementById("hue " + data[i].lampe).style.backgroundColor = 'rgb( 0 , 0 , 0 )';
            }
        }
    });
    $scope.changehue = function(numero) {
        for (i in $scope.Hue) {
            if ($scope.Hue[i].lampe == numero) {
                socket.emit('sethue', {
                    lampe: numero,
                    bri: $scope.Hue[i].bri,
                    sat: $scope.Hue[i].sat,
                    on: !$scope.Hue[i].on
                });
            }
        }
    };
    $scope.lampe = function(numero) {
        if (Lampes[numero - 1].etat === "error") {
            ngToast.create({
                content: "Erreur. Cette lampe ne fonctionne pas ou n'est pas branchée, veuillez utiliser les autres.",
                dismissOnTimeout: true,
                timeout: 3000,
                className: 'danger',
            });
        } else {
            socket.emit('setlampe', {
                adresse: Lampes[numero - 1].adresse,
                etat: !Lampes[numero - 1].etat
            });
        }
    };
    $scope.infoversbdd = function() {
        var modele = {
            hue: $scope.Hue,
            lampes: $scope.lampes,
            chenillard: {
                on: $scope.on,
                speed: $scope.speed,
                sens: $scope.sens,
                color: $scope.fond
            }
        };
        socket.emit('NouveauModele', modele);
        $scope.infosBdd = modele;
        document.getElementById("bdd").style.visibility = "visible";
        setTimeout(function() {
            document.getElementById("bdd").style.visibility = "hidden";
            $scope.$apply(function() {
                $scope.infosBdd = ""
            })
        }, 5000);
    };
})