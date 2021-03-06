
var app = angular.module("myApp", ['ngMaterial', 'ngToast', 'ngSanitize', 'ui.router']);
var ip;
var socket = io();
var initialisation = false;
var Lampes = [];
var enregistrement=false;
var activation=false;
var EnregistrementEnCours=false;
var nomDuModeleEnCours=null;

function couleur(picker, numero) {
    var resultat = {
        lampe: numero,
        r: parseInt(picker.rgb[0]),
        g: parseInt(picker.rgb[1]),
        b: parseInt(picker.rgb[2])
    };
    socket.emit('setCouleurHue', resultat);
};

function listernerColor(picker, numero) {
    picker.onchange = function() {
        couleur(picker, numero);
    };
}

app.controller('myCtrl', function($scope, $http, ngToast, $state,$window) {
    $scope.fenetre = $window.innerWidth<500;
    $scope.modeles = [];

    socket.on('Chenillard', function(data) {
        $scope.$apply(function() {

            if(EnregistrementEnCours==true){
                var chenillard={speed:null,sens:null};
                chenillard.speed=data.speed;
                if(data.sens==false){
                    chenillard.sens="gauche";
                }
                else{
                    chenillard.sens="droite";
                }
                 $scope.EnregistrementModele.chenillard=chenillard;
            }

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
                if(EnregistrementEnCours==true){
                 $scope.EnregistrementModele.lampes=$scope.lampes;
                }
        });
        if (total > 0) {
            $scope.lampeKnx = true;
        } else {
            $scope.lampeKnx = false;
        }
    });

socket.on('erreur',function(data){
     ngToast.create({
                content: data,
                dismissOnTimeout: true,
                timeout: 3000,
                className: 'danger',
            });
});

    socket.on('Hue', function(data) {
        $scope.$apply(function() {
            $scope.Hue = data;
            if (data[0] == null) {
                $scope.lampeHue = false;
            } else {
                $scope.lampeHue = true;
            }
             if(EnregistrementEnCours==true){
                $scope.EnregistrementModele.hue=$scope.Hue;
            }

        });

        if (initialisation == false) {
            initialisation = true;

            for (i in data) {
                window['input' + i] = document.createElement('BUTTON');
                window['picker' + i] = new jscolor(window['input' + i]);
                window['input'+i].setAttribute('style',"width:75px;");
                function initPicker(picker){
                    picker.backgroundColor='#282828';
                    picker.width= 150;
                    picker.height = 100;
                    picker.position = 'bottom';
                    picker.smartPosition = false;
                    picker.sliderSize = 3;
                    picker.padding = 6; 
                    picker.borderWidth=0;
                    picker.borderRadius=10;
                    picker.shadow = false; // whether to display shadow
                    picker.pointerBorderWidth = 0; 
                    picker.pointerColor = '#C8C8C8';
                }
                initPicker(window['picker' + i]);
                
                listernerColor(window['picker' + i], data[i].lampe);
                document.getElementById('container' + data[i].lampe).appendChild(window["input"+i]);
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

    socket.on('changementCouleurHue', function(data) {
        document.getElementById("hue " + data.numero).style.backgroundColor = data[i].couleur;
    });

    $scope.lampe = function(numero) {
        if(EnregistrementEnCours==true){

        }

        if ($scope.lampes[numero - 1].etat === "error") {
            ngToast.create({
                content: "Erreur. Cette lampe ne fonctionne pas ou n'est pas branchée, veuillez utiliser les autres.",
                dismissOnTimeout: true,
                timeout: 3000,
                className: 'danger',
            });
        } else {
            socket.emit('setlampe', {
                adresse: $scope.lampes[numero - 1].adresse,
                etat: !$scope.lampes[numero - 1].etat
            });
        }
    };


    socket.on("lastModeleEnclenché",function(data){
        if(data.nouveau!=""){
            document.getElementById(data.nouveau).style.color="rgb(255, 64, 129)";
        }

        if(data.last!=""){
            document.getElementById(data.last).style.color="white";
        }
    });


    $scope.VoirModele = function(modele) {
        var sens;
        if (modele == undefined) {
            EnregistrementEnCours=true;
            enregistrement=!enregistrement;
            activation=false;

            if ($scope.sens == true) {
                sens = "droite";
            } else {
                sens = "gauche";
            }
            if ($scope.Hue[0] == null) {
                $scope.lampeHue = false;
            } else {
                $scope.lampeHue = true;
            }
            var theModele = {
                hue: $scope.Hue,
                lampes: $scope.lampes,
                chenillard: {
                    on: $scope.on,
                    speed: $scope.speed,
                    sens: sens
                }
            };
            $scope.EnregistrementModele = theModele;
            EnregistrementEnCours=true;
        } 
        else {
            EnregistrementEnCours=false;
            enregistrement=false;
            if(modele.nom==nomDuModeleEnCours){
                activation=!activation;
            }
            else{
                activation=true;
            }
            nomDuModeleEnCours=modele.nom;
            var huee = JSON.parse(modele.hue);
            var lightt= JSON.parse(modele.light);

            var somme=0;
        if (huee[0]==undefined) {
                $scope.activationHue = false;
            } else {
                $scope.activationHue = true;
            }
        for(i in lightt){
            if(lightt[i].etat!=0 && lightt[i].etat!=1){
                somme++;
            }
        }
        if(somme==4){
            $scope.activationKNX=false;
        }
        else{
            $scope.activationKNX=true;
        }

            var infos = {
                chenillard: {
                    sens: modele.sens,
                    speed: modele.speed
                },
                hue: huee,
                lampes: lightt
            };
            if (infos.chenillard.sens == true) {
                infos.chenillard.sens = "droite";
            } else {
                infos.chenillard.sens = "gauche";
            }
            $scope.EnregistrementModele = infos;
            $scope.nomModele = modele.nom;
        }
        if(enregistrement==false){
            EnregistrementEnCours=false;
        }
        if(activation==false && enregistrement==false){
        $scope.modele = false;
        }
        else{
            $scope.modele=true;
        }
    };


    $scope.EnregistrerModele = function() {
        var present=false;
        var nouveauModele=$scope.EnregistrementModele;

        nouveauModele.hue=JSON.stringify(nouveauModele.hue);
        nouveauModele.lampes=JSON.stringify(nouveauModele.lampes);
        console.log(nouveauModele);
        sommeHue=0;
        sommeKnx=0;
        var i = 0;
        var j = 0;

        while(nouveauModele.hue.charAt(i)!="["){
            sommeHue++;
            i++;
        }
        while(nouveauModele.lampes.charAt(j)!="["){
            sommeKnx++;
            j++;
        }
        nouveauModele.hue=nouveauModele.hue.substring(sommeHue,nouveauModele.hue.length-sommeHue);
        nouveauModele.lampes = nouveauModele.lampes.substring(sommeKnx,nouveauModele.lampes.length-sommeKnx);


        for (i in nouveauModele.lampes){
            nouveauModele.lampes =nouveauModele.lampes.replace(/\\/, "");
        }
        for(i in nouveauModele.hue){
            nouveauModele.hue=nouveauModele.hue.replace(/\\/,"");
        }

        if ($scope.modeles.length < 5) {
            var nom = document.getElementById('name_modele').value;
            for (i in $scope.modeles){
                if ($scope.modeles[i].nom==nom){
                    present=true;
                }
            }
            if (nom == "") {
                ngToast.create({
                    content: "Vous devez indiquer un nom pour votre nouveau modèle.",
                    dismissOnTimeout: true,
                    timeout: 3000,
                    className: "danger",
                });
            } 

            else if(present==true){
                 ngToast.create({
                    content: "Nom de modèle déjà existant, choisissez un autre nom.",
                    dismissOnTimeout: true,
                    timeout: 3000,
                    className: "danger",
                });
            }
            else {
                socket.emit('NouveauModele', {
                    nom: nom,
                   infos:nouveauModele
                });
                document.getElementById('name_modele').value = "";
            }
        }
    else{
        ngToast.create({
                    content: "Nombre de modèles max atteint, veuillez en supprimer un.",
                    dismissOnTimeout: true,
                    timeout: 3000,
                    className: "danger",
                });
    }
    };

    socket.on('Modeles', function(listeModeles) {
        if(listeModeles.length>0){
        document.getElementById('bdd').style.visibility="visible";
        }
        else{
        document.getElementById('bdd').style.visibility="hidden"; 
        }
        $scope.$apply(function(){
            $scope.modeles = listeModeles;
        });
    });

    $scope.LancerModele = function(modele) {
        socket.emit("modeleEnclenché", modele);
    };


    $scope.changehue = function(numero, commutation) {
        for (i in $scope.Hue) {
            if ($scope.Hue[i].lampe == numero) {
                if (commutation == true) {
                    socket.emit('sethue', {
                        lampe: numero,
                        bri: $scope.Hue[i].bri,
                        sat: $scope.Hue[i].sat,
                        on: !$scope.Hue[i].on
                    });
                } else {
                    socket.emit('sethue', {
                        lampe: numero,
                        bri: $scope.Hue[i].bri,
                        sat: $scope.Hue[i].sat,
                        on: $scope.Hue[i].on
                    });
                }
            }
        }
    };

    $scope.fermerAffichage=function(){
        $scope.modele=false;
    };

    socket.on('nouveauModele', function(data) {
        ngToast.create({
            content: "Le modèle " + data + " est enregistré",
            dismissOnTimeout: true,
            timeout: 3000,
        });
    });

    socket.on('modeleSupprimé', function(data) {
        ngToast.create({
            content: "Le modèle " + data + " est supprimé",
            dismissOnTimeout: true,
            timeout: 3000,
        });
          if($scope.nomModele==data){
            $scope.$apply(function(){
                $scope.modele=false;
            });
          }
    });

    $scope.SupprimerModele=function(nom){
      socket.emit('supprimerModele',nom);
    };

}).config(function($stateProvider, $urlRouterProvider) {
    $stateProvider.state('activerModele', {
        url: "/activationModele",
        views: {
            "view": {
                templateUrl: "public/templates/activationModele.html"
            }
        },
        controller: "myCtrl"
    }).state('enregistrerModele', {
        url: "/enregistrementModele",
        views: {
            "view": {
                templateUrl: "public/templates/enregistrementModele.html"
            }
        },
        controller: "myCtrl"
    });
});