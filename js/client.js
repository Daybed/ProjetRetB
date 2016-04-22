var app = angular.module("myApp",['ngMaterial']);
var ip;
var socket=io();
var Lampes=[];

function couleur(picker){
  console.log(picker.rsb);
  console.log(picker.hsv);
  var res=["","",""];
  var k = 0;
  console.log(picker);
  for(i in picker.style.backgroundColor){
    if(i>3 && i<picker.style.backgroundColor.length-1){
      if(picker.style.backgroundColor[i]==","){
        res[k]=parseInt(res[k]);
        k+=1;
      }
      else{
      res[k]+=picker.style.backgroundColor[i];
    }
  }
  }

  for(i in res){
    res[i]=parseInt(res[i]);
  }
  console.log(res);
 socket.emit('color',res);
};

socket.on('ChangementColorHue',function(data){
  console.log(data);
});

app.controller('myCtrl', function($scope,$http) {
$scope.slider = {
    value: 0,
    options:{
      floor:0,
      ceil:255,
      step:1
    }
};
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
   /*$scope.couleur = function(picker) {
    $scope.$apply(function(){
      console.log(picker.toRGBString());
      $scope.color = picker.toRGBString();
    });
   };*/
    $scope.lampe= function(numero){
      if(Lampes[numero-1].etat==="error"){
        console.log("Erreur, etat = error");
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

    socket.on('initHue',function(data){
        console.log(data);
        $scope.$apply(function(){
        $scope.Hue=data;
      });
    
    });

    $scope.HueImg="../img/hue.png";

    $scope.changeonhue = function(numero){
      for(i in $scope.Hue){
        if($scope.Hue[i].lampe == numero){
          socket.emit('on',{lampe:numero,on:!$scope.Hue[i].on});
        }
      }
      
    };

    $scope.changebrihue=function(numero){
       for(i in $scope.Hue){
        if($scope.Hue[i].lampe == numero){
          socket.emit('bri',{lampe:numero,bri:$scope.Hue[i].bri});
        }
      }
      
     };

  
  $scope.changesathue=function(numero){
       for(i in $scope.Hue){
        if($scope.Hue[i].lampe == numero){
          socket.emit('sat',{lampe:numero,sat:$scope.Hue[i].sat});
        }
      }
      
     };

    socket.on('ChangementOnHue',function(data){
      for (i in $scope.Hue){
        if($scope.Hue[i].lampe==data.lampe){
          $scope.$apply(function(){
            $scope.Hue[i].on=data.on;
          });
        }
        else{
        }
      }

    });

     socket.on('ChangementBriHue',function(data){
      for (i in data){
        console.log("xy : " + data[i].xy +", bri :" + data[i].bri);
      }
     });

     socket.on('ChangementSatHue',function(data){
      console.log(data);
     });



});
