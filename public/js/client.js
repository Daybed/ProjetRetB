var app = angular.module("myApp",['ngMaterial','ngToast']);
var ip;
var socket=io();
var Lampes=[];

function couleur(picker){
console.log("here");
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
//$scope.fond=rgb({{res[0]}},{{res[1]}},{{res[2]}})"
 var resultat = {lampe : 2, r: parseInt(res[0]), g: parseInt(res[1]), b: parseInt(res[2])};
 console.log(resultat);
 socket.emit('color',resultat);
};
 

app.controller('myCtrl', function($scope,$http,ngToast) {

  $scope.fond="rgb(214,83,127)";

 /* 
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
      var modele = {hue : $scope.Hue, lampes : $scope.lampes, chenillard : {on : $scope.on, speed : $scope.speed , sens : $scope.sens}};
      $scope.infosBdd = modele;
    }

    socket.on('Hue',function(data){
        console.log(data);
        $scope.$apply(function(){
        $scope.Hue=data;
      });
    
    });
    $scope.changeHue = function(numero,commutation){
      for(i in $scope.Hue){
        if($scope.Hue[i].lampe == numero){
          if(commutation==true){
          socket.emit('hue',{lampe:numero,bri:$scope.Hue[i].bri,sat:$scope.Hue[i].sat,on:!$scope.Hue[i].on});
          }
          else{
            socket.emit('hue',{lampe:numero,bri:$scope.Hue[i].bri,sat:$scope.Hue[i].sat,on:$scope.Hue[i].on});
          }
        }
      }
      
    };


});
