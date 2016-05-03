module.exports.chenillard ={
  on: false,
  speed: 500,
  clockwise: true,

  changestate : function(funct,light){
    this.on=!this.on;
    if (this.on==true){
      funct.looptest(light);
    }
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
