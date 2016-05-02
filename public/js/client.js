var app = angular.module("myApp",['ngMaterial','ngToast']);
var ip;
var socket=io();
var Lampes=[];

function couleur(picker){

  var res=["","",""];
  var k = 0;
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

 var resultat = {lampe : 2, r: parseInt(res[0]), g: parseInt(res[1]), b: parseInt(res[2])};
 console.log(resultat);
 socket.emit('color',resultat);
};
 

app.controller('myCtrl', function($scope,$http,ngToast) {
  $scope.HueImg="public/img/hue.png";
  $scope.fond="#ffffff";
 /* $scope.slider={
    value: 0,
    min:0,
    max:255,
    options:{
      floor:0,
      ceil:1
    }
  };


  $scope.couleur = function(picker){
    console.log(picker.rgb);
  };

<button onclick="add()">Add 100 pickers</button>

<p id="container"></p>

<script>
function add() {
    for(var i = 0; i < 100; i++) {
        var input = document.createElement('INPUT')
        var picker = new jscolor(input)
        picker.fromHSV(360 / 100 * i, 100, 100)
    
        document.getElementById('container').appendChild(input)
    }
}
</script>*/
    

    socket.on('init',function(data){
      ip = data.ipserver;
      $scope.speed=data.chenillardspeed;

      $scope.$apply(function () {
       if (data.chenillardstate==true){
        $scope.loopstart="public/img/pause.png";
       }
       else{
        $scope.loopstart="public/img/play.png";
       }
     });
    });
    

     socket.on('lampes',function(data){
          for(i in data){
            if(data[i].etat==1){
              Lampes[i]={img:"bower_components/material-design-icons/action/drawable-hdpi/ic_lightbulb_outline_black_on_48dp.png",adresse:data[i].adresse,etat:true, num: data[i].numero}; 
            }
            else if(data[i].etat==0){
              Lampes[i]={img:"bower_components/material-design-icons/action/drawable-hdpi/ic_lightbulb_outline_black_off_48dp.png",adresse:data[i].adresse,etat:false, num:data[i].numero};
            }
            else{
              Lampes[i]={img:"bower_components/material-design-icons/action/drawable-hdpi/ic_lightbulb_outline_black_error_48dp.png",adresse:data[i].adresse,etat:"error", num: data[i].numero};
        
          }
        }
          $scope.$apply(function(){$scope.lampes=Lampes;});
      });
       


     socket.on('etat chenillard',function(data){
        $scope.$apply(function () {
              if (data==true){
              $scope.loopstart="public/img/pause.png";
              }
              else{
              $scope.loopstart="public/img/play.png";
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
        ngToast.create({
         content: "Erreur. Cette lampe ne fonctionne pas ou n'est pas branchée, veuillez utiliser les autres.",
         dismissOnTimeout : true,
         timeout: 3000,
         className: 'danger',
        });
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

  /*socket.on('ChangementOnHue',function(data){
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
*/


});
