/**
 * Authentication middleware
 */

// Check if user is authenticated
exports.isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    // Đảm bảo rằng _id luôn tồn tại
    if (!req.session.user._id && req.session.user.id) {
      req.session.user._id = req.session.user.id;
    }
    return next();
  }
  
  // Lưu URL hiện tại để chuyển hướng sau khi đăng nhập
  req.session.returnTo = req.originalUrl;
  res.redirect('/auth/login');
};

// Check if user is verified
exports.isVerified = (req, res, next) => {
  // Skip verification check if user is already authenticated (middleware order matters)
  if (req.session.user && req.session.user.isVerified) {
    return next();
  }
  
  // Redirect to verification needed page if not verified
  if (req.session.user) {
    return res.render('auth/verification-needed', {
      title: 'Verification Required',
      message: 'Please verify your account before proceeding.'
    });
  }
  
  // If no session, redirect to login
  res.redirect('/auth/login');
};

// Check if user is admin
exports.isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  
  // Nếu đã đăng nhập nhưng không phải admin
  if (req.session.user) {
    return res.status(403).render('error', {
      title: 'Không có quyền truy cập',
      message: 'Bạn không có quyền truy cập trang quản trị'
    });
  }
  
  // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
  // Lưu URL hiện tại để chuyển hướng sau khi đăng nhập
  req.session.returnTo = req.originalUrl;
  res.redirect('/auth/login');
};

// Middleware kiểm tra đăng nhập tùy chọn
exports.optionalAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    res.locals.user = req.session.user;
    res.locals.isLoggedIn = true;
  } else {
    res.locals.user = null;
    res.locals.isLoggedIn = false;
  }
  next();
};