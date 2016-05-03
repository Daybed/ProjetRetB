module.exports.chenillard ={
  on: false,
  speed: 500,
  clockwise: true,

  changestate : function(funct,light){
    this.on=!this.on;
<<<<<<< HEAD
    io.emit('etat chenillard',this.on);
    if (this.on==true){
      looptest();
=======
    if (this.on==true){
      funct.looptest(light);
>>>>>>> 09dd1fd8527b76b5365806b64efd9953818ec17f
    }
  },
  changeclockwise : function(){
    this.clockwise=!this.clockwise;
    io.emit('sens chenillard', chenillard.clockwise);
  },

  setspeed : function(newspeed){
    if(newspeed<500){
      this.speed=500;
    }
    else{
      this.speed=newspeed;
    }
    io.emit('speedchenillard',this.speed);
  }
}
