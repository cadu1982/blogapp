//CARREGANDO MODULOS
const express = require('express')
const handlebars = require('express-handlebars')
const bodyParser = require("body-parser")
const app = express()
const admin = require("./routes/admin")
const path = require('path');
const mongoose = require("mongoose")
const session = require("express-session")
const flash = require("connect-flash")
require("./models/Postagem")
const Postagem = mongoose.model("postagens")
require("./models/Categoria")
const Categoria = mongoose.model("categoria")
const usuarios = require("./routes/usuario")
const passport = require("passport")
require("./config/auth")(passport)

//const mongoose = require("mongoose")

//CONFIGURAÇÕES

  //Sessão
    app.use(session({
      secret: "cursodenode",
      resave: true,
      saveUninitialized: true
    }))
    app.use(passport.initialize())
    app.use(passport.session())
    app.use(flash())
  //Middleware
    app.use((req, res, next) => {
      res.locals.success_msg = req.flash("success_msg")
      res.locals.error_msg = req.flash("error_msg")
      res.locals.error = req.flash("error")
      res.locals.user = req.user || null;
      next()
    })

  // Body Parser
    app.use(bodyParser.urlencoded({extended: true}))
    app.use(bodyParser.json())
  // Handlebars
    app.engine('handlebars', handlebars({defaultlayout: 'main'}))
    app.set('view engine', 'handlebars');

  // Mongoose
    mongoose.Promise = global.Promise;
    mongoose.connect("mongodb://localhost/blogapp").then(() => {
      console.log("Conectado ao mongo")
    }).catch((err) => {
      console.log("Erro ao se conectar: "+err)
    })
  // Public
    app.use(express.static(path.join(__dirname, "public")))

  //ROTAS
  app.get('/', (req, res) => {
    Postagem.find().populate("categorias").sort({data: "desc"}).lean().then((postagens) => {
      res.render("index", {postagens: postagens, layout: "main"})
    }).catch((err) => {
      console.log(err)
      req.flash("error_msg", "Houve um erro interno")
      res.redirect("/404")
    })
  })

  app.get("/postagem/:slug", (req, res) => {
      Postagem.findOne({slug: req.params.slug}).lean().then((postagem) => {
        if(postagem){
                res.render("postagem/index", {postagem: postagem, layout: "main"})
        }else{
                req.flash("error_msg", "Esta postagem não existe")
                res.redirect("/")
        }
      }).catch((err) => {
        console.log(err)
          req.flash("error_msg", "Houve um erro interno")
          res.redirect("/")
      })
  })

  app.get("/categorias", (req, res) => {
        Categoria.find().lean().then((categoria) => {
          res.render("categorias/index", {categorias: categoria, layout: "main"})
    }).catch((err) => {
      console.log(err)
          req.flash("error_msg", "Houve um erro interno ao listar as categorias")
          res.redirect("/")
    })
  })

  app.get("/categorias/:slug", (req, res) => {
        Categoria.findOne({slug: req.params.slug}).lean().then((categoria) => {
            if(categoria){

                Postagem.find({categorias: categoria._id}).lean().then((postagens) => {

                    res.render("categorias/postagens", {postagens: postagens, categorias: categoria, layout: "main" })

                }).catch((err) => {
                  console.log(err)
                  req.flash("error_msg", "Houve um erro ao listar os posts!")
                  res.redirect("/")
                })

            }else{
                req.flash("error_msg", "Esta categoria não existe ")
                res.redirect("/")
            }

    }).catch((err) => {
      console.log(err)
      req.flash("error_msg", "Houve um erro interno ao carrgar a pagina desta categoria")
      res.redirect("/")
    })
  })

  app.get("/404", (req, res) => {
    res.send("Erro 404!")
  })

  app.get('/post', (req, res) => {
    res.send('Lista de posts')
  })

  app.use('/admin', admin)
  app.use("/usuarios", usuarios)

//OUTROS
const PORT = 8081
app.listen(PORT,() => {
    console.log("Servidor rodando! ")
})
