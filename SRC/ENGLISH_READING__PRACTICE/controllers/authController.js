const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Register a new user
exports.register = async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).render('auth/register', { 
        error: 'User with this email or username already exists',
        formData: req.body
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password, // Hashed in the User model pre-save hook
      fullName,
      isVerified: true // Auto-verify for demo purposes
    });

    await user.save();

    // Set user session
    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isVerified: user.isVerified
    };

    return res.redirect('/user/dashboard');
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).render('auth/register', { 
      error: 'Registration failed. Please try again.',
      formData: req.body
    });
  }
};

// Hiển thị trang đăng nhập
exports.getLogin = (req, res) => {
  // Nếu đã đăng nhập, chuyển hướng đến trang phù hợp
  if (req.session.user) {
    if (req.session.user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    }
    return res.redirect('/');
  }
  
  // Lưu URL trước đó để chuyển hướng sau khi đăng nhập
  const returnTo = req.query.returnTo || req.session.returnTo || '/';
  req.session.returnTo = returnTo;
  
  res.render('auth/login', {
    title: 'Login',
    layout: 'layouts/main',
    returnTo,
    csrfToken: '' // Thêm biến rỗng để tránh lỗi
  });
};

// Xử lý đăng nhập
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Tìm người dùng theo email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.render('auth/login', {
        title: 'Login',
        error: 'Invalid email or password',
        email,
        layout: 'layouts/main'
      });
    }
    
    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.render('auth/login', {
        title: 'Login',
        error: 'Invalid email or password',
        email,
        layout: 'layouts/main'
      });
    }
    
    // Lưu thông tin người dùng vào session
    req.session.user = {
      _id: user._id,
      id: user._id, // Thêm id để đảm bảo tương thích
      email: user.email,
      name: user.name,
      role: user.role
    };
    
    console.log('User logged in:', {
      id: user._id,
      email: user.email,
      role: user.role
    });
    
    // Chuyển hướng dựa trên vai trò người dùng
    if (user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    }
    
    // Chuyển hướng đến trang được lưu trước đó hoặc trang chủ
    const returnTo = req.session.returnTo || '/';
    delete req.session.returnTo;
    res.redirect(returnTo);
    
  } catch (error) {
    console.error('Login error:', error);
    
    res.render('auth/login', {
      title: 'Login',
      error: 'An error occurred while logging in',
      layout: 'layouts/main'
    });
  }
};

// Đăng xuất
exports.logout = (req, res) => {
  // Xóa session
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).render('error', {
        title: 'Error',
        message: 'Failed to log out. Please try again.'
      });
    }
    
    // Chuyển hướng về trang chủ
    res.redirect('/');
  });
};

// Render registration form
exports.getRegisterForm = (req, res) => {
  if (req.session.user) {
    return res.redirect(req.session.user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard');
  }
  res.render('auth/register', { title: 'Register', formData: {} });
};

// Verify user account (simplified for demo)
exports.verifyAccount = async (req, res) => {
  try {
    const { token } = req.params;
    
    // In a real app, you would verify the token and get the user ID
    // For this demo, we'll just redirect to login with a success message
    
    return res.render('auth/login', {
      title: 'Login',
      success: 'Your account has been verified. You can now login.',
      formData: {}
    });
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(400).render('auth/login', {
      title: 'Login',
      error: 'Invalid or expired verification token.',
      formData: {}
    });
  }
};