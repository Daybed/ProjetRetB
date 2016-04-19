var app = angular.module("myApp",[]);
var ip;
var socket=io();
var Lampes=[];

app.controller('myCtrl', function($scope,$http) {
    
    socket.on('init',function(data){
      ip = data.ipserver;
      $scope.speed=data.chenillardspeed;

      $scope.$apply(function () {
       if (data.chenillardstate==true){
        $scope.loopstart="Stop chenillard";
       }
       else{
        $scope.loopstart="Start chenillard";
       }
     });
    });
    

     socket.on('lampes',function(data){
          for(i in data){
            if(data[i].etat==1){
              Lampes[i]={img:"../img/stormtrooperon-2.png",adresse:data[i].adresse,etat:true, num: data[i].numero}; 
            }
            else if(data[i].etat==0){
              Lampes[i]={img:"../img/stormtrooperoff.png",adresse:data[i].adresse,etat:false, num:data[i].numero};
            }
            else{
              Lampes[i]={img:"../img/stormtroopererreur.png",adresse:data[i].adresse,etat:"error", num: data[i].numero};
            }
          }
          $scope.$apply(function(){$scope.lampes=Lampes;});
      });
       


     socket.on('etat chenillard',function(data){
        $scope.$apply(function () {
              if (data==true){
              $scope.loopstart="Stop chenillard";
              }
              else{
              $scope.loopstart="Start chenillard";
              }
        });
     });

     $scope.loop=function(){
      socket.emit('changestate');
     };

    $scope.changedirection=function(){
      socket.emit('changedirection');
     };

     $scope.setspeed = function(){
     socket.emit('setspeed',$scope.vitesse);
   };

    $scope.lampe= function(numero){
      if(Lampes[numero-1].etat==="error"){
        /* ngToast.create({
         content: "Erreur. Cette lampe ne fonctionne pas ou n'est pas branchée, veuillez utilisez les autres.",
         dismissOnTimeout : true,
         timeout: 3000,
         className: 'danger',
        });*/
      }
      else{
      socket.emit('setlampe',{adresse:Lampes[numero-1].adresse,etat:!Lampes[numero-1].etat});
     }
    };

    socket.on('speedchenillard',function(vitesse){
      $scope.speed=vitesse;
    });

});