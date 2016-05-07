var app = angular.module("myApp",['ngMaterial','ngToast']);
var ip;
var socket=io();
var Lampes=[];
var initialisation = false;

function couleur(picker,numero){
  var resultat = {lampe : numero, r: parseInt(picker.rgb[0]), g: parseInt(picker.rgb[1]), b: parseInt(picker.rgb[2])};
  socket.emit('setCouleurHue',resultat);

};

app.controller('myCtrl', function($scope,$http,ngToast) {
    

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
    

     socket.on('lampes',function(data){
          for(i in data){
            if(data[i].etat==1){
              Lampes[i]={img:"public/img/lampeon.png",adresse:data[i].adresse,etat:true, num: data[i].numero}; 
            }
            else if(data[i].etat==0){
              Lampes[i]={img:"public/img/lampeoff.png",adresse:data[i].adresse,etat:false, num:data[i].numero};
            }
            else{
              Lampes[i]={img:"public/img/lampeerror.png",adresse:data[i].adresse,etat:"error", num: data[i].numero};
        
          }
        }
          $scope.$apply(function(){$scope.lampes=Lampes;});
      });
       
       socket.on('changementCouleurHue',function(data){
        console.log(data);
         document.getElementById("hue "+data.numero).style.backgroundColor = 'rgb('+data.rgb[0]+','+data.rgb[1]+','+data.rgb[2]+')';
       });

    socket.on('Hue',function(data){
        $scope.$apply(function(){
        $scope.Hue=data;
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
            document.getElementById('container ' + data[i].lampe).appendChild(input);
          }
      }
    
    });

     $scope.loop=function(){
      socket.emit('setstate');
     };

     $scope.sens=function(sens){
      socket.emit('setsens',sens);
     };

     $scope.setspeed = function(){
     socket.emit('setspeed',$scope.speed);
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

    $scope.infoversbdd = function(){
      var modele = {hue : $scope.Hue, lampes : $scope.lampes, chenillard : {on : $scope.on, speed : $scope.speed , sens : $scope.sens, color : $scope.fond}};
      $scope.infosBdd = modele;
      setTimeout(function(){$scope.$apply(function(){$scope.infosBdd=""})},3000); 
  };


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


});
