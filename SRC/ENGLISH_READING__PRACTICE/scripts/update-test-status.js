const mongoose = require('mongoose');
const Test = require('../models/Test');
const config = require('../config/database');

async function updateTestStatus() {
  try {
    // Kết nối database
    await mongoose.connect(config.database);
    console.log('Đã kết nối với database');
    
    // Cập nhật tất cả các bài test
    const result = await Test.updateMany(
      {}, // Tìm tất cả các bài test
      { $set: { active: true } } // Đặt active = true
    );
    
    console.log(`Đã cập nhật ${result.modifiedCount} bài test`);
    
    // Kiểm tra lại
    const activeTests = await Test.find({ active: true });
    console.log(`Số lượng bài test active sau khi cập nhật: ${activeTests.length}`);
    
    mongoose.disconnect();
    console.log('Đã ngắt kết nối database');
  } catch (error) {
    console.error('Lỗi khi cập nhật bài test:', error);
  }
}

updateTestStatus(); 