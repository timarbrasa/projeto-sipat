const Videos = require("../models/Videos");

module.expor = class VideosController {
  static cadastrarVideo(req,res){
    res.render("videso/cadastrar")
  }
}