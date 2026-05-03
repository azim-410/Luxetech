const isAuthenticated = (req,res,next)=>{
    if(!req.session.user){
        return res.redirect('/login')
    }
    next();
}

const isLogin = (req,res,next)=>{
    if(req.session.user){
        return res.redirect('/')
    }
    next();
}

export { isAuthenticated, isLogin }