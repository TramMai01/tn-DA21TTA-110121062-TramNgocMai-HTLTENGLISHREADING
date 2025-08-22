document.addEventListener('DOMContentLoaded', function() {
    const defaultTimeRadio = document.getElementById('defaultTime');
    const noTimeLimitRadio = document.getElementById('noTimeLimit');
    const customTimeRadio = document.getElementById('customTime');
    const customTimeValue = document.getElementById('customTimeValue');
    
    // Khi trang tải, đảm bảo trạng thái ban đầu đúng
    if (customTimeRadio && customTimeValue) {
      customTimeValue.disabled = !customTimeRadio.checked;
    }
    
    // Thêm sự kiện cho các radio button
    if (defaultTimeRadio) {
      defaultTimeRadio.addEventListener('change', function() {
        if (this.checked && customTimeValue) {
          customTimeValue.disabled = true;
        }
      });
    }
    
    if (noTimeLimitRadio) {
      noTimeLimitRadio.addEventListener('change', function() {
        if (this.checked && customTimeValue) {
          customTimeValue.disabled = true;
        }
      });
    }
    
    if (customTimeRadio && customTimeValue) {
      customTimeRadio.addEventListener('change', function() {
        customTimeValue.disabled = !this.checked;
        if (this.checked) {
          customTimeValue.focus();
        }
      });
      
      // Thêm sự kiện click vào input số
      customTimeValue.addEventListener('click', function() {
        customTimeRadio.checked = true;
        this.disabled = false;
      });
    }
    
    // Xử lý form submit
    const form = document.querySelector('form');
    
    if (form) {
      form.addEventListener('submit', function(e) {
        // Nếu chọn tùy chỉnh thời gian, đảm bảo input không bị disabled
        if (customTimeRadio && customTimeRadio.checked && customTimeValue) {
          customTimeValue.disabled = false;
          
          // Kiểm tra giá trị hợp lệ
          const timeValue = parseInt(customTimeValue.value);
          if (isNaN(timeValue) || timeValue < 1) {
            e.preventDefault();
            alert('Vui lòng nhập thời gian hợp lệ (ít nhất 1 phút)');
            return;
          }
        }
        
        // Form sẽ được gửi bình thường
      });
    }
  });