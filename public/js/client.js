var app = angular.module("myApp",['ngMaterial','ngToast','ngSanitize','ui.router']);
var ip;
var socket=io();
var initialisation = false;
var Lampes=[];

function couleur(picker, numero) {
    var resultat = {
        lampe: numero,
        r: parseInt(picker.rgb[0]),
        g: parseInt(picker.rgb[1]),
        b: parseInt(picker.rgb[2])
    };
    socket.emit('setCouleurHue', resultat);
};


app.controller('myCtrl', function($scope,$http,ngToast,$state) {
    $scope.modeles=[];

    socket.on('Chenillard',function(data){
      $scope.$apply(function () {

        $scope.speed=data.speed;
        $scope.sens=data.sens;
        $scope.on = data.on;

       if (data.on==true){
        $scope.loopstart="public/img/pause.png";
       }
       else{
        $scope.loopstart="public/img/play.png";
       }

        if(data.sens==true){
          $scope.rightSens="public/img/chevron-double-right_on.png";
          $scope.leftSens="public/img/chevron-double-left_off.png";
        }
        else if(data.sens==false){
          $scope.rightSens="public/img/chevron-double-right_off.png";
          $scope.leftSens="public/img/chevron-double-left_on.png";
        }
     });
    });

     $scope.loop=function(){
      socket.emit('setstate');
     };

     $scope.setsens=function(sens){
      socket.emit('setsens',sens);
     };

     $scope.setspeed = function(){
     socket.emit('setspeed',$scope.speed);
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

          $scope.$apply(function(){$scope.lampes=Lampes;});

          if(total>0){
           $scope.lampeKnx=true;
          }
          else{
            $scope.lampeKnx=false;
          }
      });
       


    socket.on('Hue',function(data){
      console.log(data);
        $scope.$apply(function(){
        $scope.Hue=data;
        if(data[0]==null){
          $scope.lampeHue=false;
        }
        else{
          $scope.lampeHue=true;
        }
      });

        if(initialisation == false){
            initialisation = true;

            for(i in data){

            var input = document.createElement('INPUT');
            var picker = new jscolor(input);
            picker.hash=true;

            picker.onchange=function(){
            couleur(picker,data[i].lampe);

            };

            document.getElementById('container').appendChild(input);
          }
      }
        for(i in data){
         document.getElementById("hue "+data[i].lampe).style.backgroundColor = data[i].couleur;
       }
    
    });

       socket.on('changementCouleurHue',function(data){
         document.getElementById("hue "+data.numero).style.backgroundColor = data[i].couleur;
       });

    $scope.lampe= function(numero){
      if($scope.lampes[numero-1].etat==="error"){
        ngToast.create({
         content: "Erreur. Cette lampe ne fonctionne pas ou n'est pas branchée, veuillez utiliser les autres.",
         dismissOnTimeout : true,
         timeout: 3000,
         className: 'danger',
        });
      }
      else{
      socket.emit('setlampe',{adresse:$scope.lampes[numero-1].adresse,etat:!$scope.lampes[numero-1].etat});
     }
    };

  $scope.VoirModele = function(modele){
  var sens;
    if(modele==undefined){
      if($scope.sens == true){
        sens = "droite";
      }
      else{
        sens="gauche";
      }
    if($scope.Hue[0]==null){
        $scope.lampeHue=false;
      }
      else{
        $scope.lampeHue=true;
      } 
    
    var theModele = {hue : $scope.Hue, lampes : $scope.lampes, chenillard : {on : $scope.on, speed : $scope.speed , sens : sens}};
    console.log(theModele);
    $scope.EnregistrementModele = theModele;
   
    }
    else{
      if(modele.hue[0]==null){  
        $scope.lampeHue=false;
      }
      else{
        $scope.lampeHue=true;
      }
    var infos = $scope.modeles[$scope.modeles.indexOf(modele)].infos;
      if(infos.chenillard.sens == true){
        infos.chenillard.sens = "droite";
      }
      else{
        infos.chenillard.sens="gauche";
      }
      $scope.EnregistrementModele = infos;
      $scope.nomModele=modele.nom;

    }
    $scope.modele=true;
  };

  $scope.EnregistrerModele=function(){
    var nom = document.getElementById('name_modele').value;
    if(nom==""){
      ngToast.create({
         content: "Vous devez indiquer un nom pour votre nouveau modèle",
         dismissOnTimeout : true,
         timeout: 3000,
         className:"danger",
        });
    }
    else{
  socket.emit('NouveauModele',{nom:nom, infos : $scope.EnregistrementModele});
  document.getElementById("bdd").style.visibility="visible";
  document.getElementById('name_modele').value="";
  }
  };

  $scope.LancerModele = function(modele){
   /* console.log(modele);
    for(i in modele.hue){
      socket.emit("sethue",{lampe:modele.hue[i].lampe,bri:modele.hue[i].bri,sat:modele.hue[i].sat,on:modele.hue[i].on});
      socket.emit('setCouleurHue',{lampe : modele.hue[i].lampe, r: parseInt(modele.hue[i].rgb.r), g: parseInt(modele.hue[i].rgb.g), b: parseInt(modele.hue[i].rgb.b)});
    }*/

    socket.emit("modeleEnclenché",modele);
    // coloré le modele enclenché
   // document.getElementById(modele.nom).style.backgroundColor="rgb(255,64,129)";
  };

  socket.on("lastModeleEnclenché",function(data){
    if(data!=null || data!=""){
      console.log("dernier modele enclenché : "+data);
    //document.getElementById(data).style.backgroundColor="rgb(40,40,40)";
    // coloré le modele enclenché
    }

  });

  socket.on('Modeles',function(listeModeles){
    $scope.modeles=listeModeles;
  });

    $scope.changehue = function(numero,commutation){
      for(i in $scope.Hue){
        if($scope.Hue[i].lampe == numero){
          if(commutation==true){
            socket.emit('sethue',{lampe:numero,bri:$scope.Hue[i].bri,sat:$scope.Hue[i].sat,on:!$scope.Hue[i].on});
          }
          else{
            socket.emit('sethue',{lampe:numero,bri:$scope.Hue[i].bri,sat:$scope.Hue[i].sat,on:$scope.Hue[i].on});
          }
        }
      }
    };

    socket.on('nouveauModele',function(data){
      $scope.$apply(function(){
        $scope.modeles.push(data);});
          ngToast.create({
         content: "Le modèle " +data.nom+ " est enregistré",
         dismissOnTimeout : true,
         timeout: 3000,
        });
    });

    socket.on('modeleSupprimé',function(data){
          ngToast.create({
         content: "Le modèle " +data+ " est supprimé",
         dismissOnTimeout : true,
         timeout: 3000,
        });
    });

    $scope.SupprimerModele=function(nom){
      console.log(nom);
      soket.emit('supprimerModele',nom);
    };

})

.config(function($stateProvider,$urlRouterProvider){

$stateProvider.state('activerModele',{
url:"/activationModele",
views: {
  "view":{
    templateUrl:"public/templates/activationModele.html"
  }
},
controller:"myCtrl"
})
.state('enregistrerModele',{
url:"/enregistrementModele",
views: {
  "view":{
    templateUrl:"public/templates/enregistrementModele.html"
  }
},
controller:"myCtrl"
});

});

