var chenillard = {
  on: false,
  speed: 500,
  clockwise: true,

  changestate : function(){
    this.on=!this.on;
    /*if (this.on==true){
      looptest();
    }*/
  },
  changeclockwise : function(){
    this.clockwise=!this.clockwise;
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
