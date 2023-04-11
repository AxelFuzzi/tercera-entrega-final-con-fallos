import express from "express";
import multer from "multer";
const router = express.Router();
import { UsuarioDao } from '../dao/UsuarioDao.js';
import { ProductosModel } from "../modules/productos.modules.js";
import { UsuariosModel } from "../modules/usuarios.modules.js";
import { sendGmail } from "../notifications/gmail/EmailSender.js";
import { htmlNewUserTemplate } from "../notifications/gmail/htmltemplates/NewUserCreatedTemplate.js";
import uploader from "../middlewares/upload.js"

const userDao = new UsuarioDao();

router.get('/login', async(req, res) => {
    if (req.session.login) {
        res.redirect('/api/usuario')
    } else {
        res.render('pages/login', {status: false})
    }
})

router.get('/signup', (req, res) => {
    if (req.session.login) {
        res.redirect('/api/usuario')
    } else {
        res.render('pages/signup', {status: false})
    }
})

router.post('/signup',uploader.single('image'), async(req,res) => {
    /*const { body } = req;
    const newUser = await userDao.createUser(body);
    
    if (newUser) {
        const now = new Date();
        const newUserTemplateEmail = htmlNewUserTemplate(newUser._id, now.toLocaleString());
        // Descomentar si has llenado el .env con tu email y password.
        //await sendGmail('Nuevo usuario creado', newUserTemplateEmail);
        res.status(200).json({"success": "User added with ID " + newUser._id})
    } else {
        res.status(400).json({"error": "there was an error, please verify the body content match the schema"})
    }*/

    try {
        const file = req.file;
        if(!file) return res.status(500).send({status:"error",error:"Error al cargar el archivo"});
        const {username,email,password} = req.body;
        if(!username||!email||!password) return res.status(400).send({status:"error",error:"Valores incompletos"});
        const exists = await UsuariosModel.findOne({email});
        if(exists) return res.status(400).send({status:"error",error:"El usuario ya existe"});
        const user = {
            username,
            email,
            password,
            avatar:`${req.protocol}://${req.hostname}:${process.env.PORT}/img/${file.filename}`
        }
        const result = await UsuariosModel.create(user);
        res.send({status:"success",message:"Registrado"});
    } catch (error) {
        res.status(500).send({status:"error",error:"Error del servidor"})
    }
    
})


router.post('/login', async(req, res) => {
    const {user, pass} = req.body;
    const loggedUser = await userDao.loginUser({
        username: user,
        password: pass
    });
    
    if (loggedUser) {
        req.session.login=true;
        res.redirect('/api/usuario')
    } else {
        req.session.login=false;
        res.redirect('/api/usuario/login')
    }
})

router.get('/', async(req, res) => {
    const productos = await ProductosModel.find().lean();
    console.log(productos);
    res.render('pages/home', {status: req.session.login, productos});
})

router.get('/logout', async(req, res) => {
    if (!req.session.login) {
        res.redirect('/api/usuario')
    } else {
        req.session.destroy( (err) => {
            if (err) {
                res.json(err);
            } else {
                res.render('pages/logout', {status: false});
            }
        })
    }
})

export default router;