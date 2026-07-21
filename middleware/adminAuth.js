const isAdminAuthenticated = (req, res, next) => {
  if (req.session.admin) {
    return next();
  }
  return res.redirect("/admin/login");
};

const isAdminLogin = (req, res, next) => {
  if (req.session.admin) {
    return res.redirect("/admin/dashboard");
  }
  return next();
};

export { isAdminAuthenticated, isAdminLogin };
