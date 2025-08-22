// Lấy dữ liệu từ biến toàn cục
const testId = window.testData.testId;
const attemptId = window.testData.attemptId;
const isTemporary = window.testData.isTemporary;
const timeLimit = window.testData.timeLimit;
const isNewAttempt = window.testData.isNewAttempt || false;

// Thêm đoạn mã này để debug
console.log('Test ID:', testId);
console.log('Attempt ID:', attemptId);
console.log('Is New Attempt:', isNewAttempt);
console.log('Test Data:', window.testData);

// Xóa dữ liệu cũ nếu là lần làm bài mới
if (isNewAttempt && testId) {
  console.log('Clearing previous answers for new attempt');
  localStorage.removeItem(`test_${testId}_answers`);
  localStorage.removeItem(`test_${testId}_timer`);
}

// Thêm biến để theo dõi thời gian bắt đầu và thời gian làm bài
let testStartTime;
let testTimeSpent = 0;
let timerInterval;

// Hàm khởi tạo thời gian bắt đầu
function initializeStartTime() {
  // Lấy thời gian bắt đầu từ localStorage nếu có
  const startTimeKey = `test_${testId}_start_time`;
  const savedStartTime = localStorage.getItem(startTimeKey);
  
  if (savedStartTime && !isNewAttempt) {
    // Nếu có thời gian bắt đầu đã lưu và không phải lần làm mới
    testStartTime = new Date(savedStartTime);
  } else {
    // Nếu là lần làm mới hoặc chưa có thời gian bắt đầu
    testStartTime = new Date();
    localStorage.setItem(startTimeKey, testStartTime.toISOString());
  }
  
  // Tính thời gian đã trôi qua
  const timeSpentKey = `test_${testId}_time_spent`;
  const savedTimeSpent = localStorage.getItem(timeSpentKey);
  
  if (savedTimeSpent && !isNewAttempt) {
    testTimeSpent = parseInt(savedTimeSpent);
  }
  
  console.log('Test start time:', testStartTime);
  console.log('Initial time spent:', testTimeSpent);
}

// Hàm cập nhật thời gian làm bài
function updateTimeSpent() {
  if (!testStartTime) return;
  
  // Tính thời gian đã trôi qua
  const currentTime = new Date();
  const elapsedSeconds = Math.floor((currentTime - testStartTime) / 1000);
  
  // Cập nhật tổng thời gian làm bài
  testTimeSpent = elapsedSeconds;
  
  // Lưu vào localStorage
  localStorage.setItem(`test_${testId}_time_spent`, testTimeSpent.toString());
  
  console.log('Updated time spent:', testTimeSpent);
}

// Hàm để lưu câu trả lời vào localStorage
function saveAnswer(questionId, answer) {
  if (!testId) return;
  
  console.log('Saving answer for question:', questionId, 'answer:', answer);
  
  const storageKey = `test_${testId}_answers`;
  const savedAnswers = JSON.parse(localStorage.getItem(storageKey) || '{}');
  
  // Đảm bảo answer được lưu đúng định dạng
  if (typeof answer === 'object' && answer !== null) {
    // Lưu tất cả các đối tượng dưới dạng JSON string
    savedAnswers[questionId] = JSON.stringify(answer);
  } else {
    // Nếu là giá trị đơn, lưu trực tiếp
    savedAnswers[questionId] = answer;
  }
  
  localStorage.setItem(storageKey, JSON.stringify(savedAnswers));
  
  // Nếu đang ở chế độ không đăng nhập, chỉ lưu vào localStorage
  if (isTemporary) return;
  
  // Nếu đã đăng nhập, gửi câu trả lời lên server
  if (attemptId) {
    fetch(`/api/attempts/${attemptId}/answers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        questionId: questionId,
        answer: answer // Gửi giá trị gốc, không phải giá trị đã được JSON.stringify
      })
    }).catch(error => {
      console.error('Error saving answer:', error);
    });
  }
}

// Hàm để lấy câu trả lời từ localStorage
function getAnswer(questionId) {
  if (!testId) return null; // Kiểm tra testId tồn tại
  
  const answers = JSON.parse(localStorage.getItem(`test_${testId}_answers`) || '{}');
  return answers[questionId] || null;
}

// Khởi tạo khi trang tải
document.addEventListener('DOMContentLoaded', function() {
  // Biến lưu trữ thông tin câu hỏi hiện tại
  let currentQuestionIndex = 1;
  let totalQuestions = document.querySelectorAll('.question-container').length;
  
  // Lấy các phần tử DOM
  const questionContainers = document.querySelectorAll('.question-container');
  const passageContents = document.querySelectorAll('.passage-content');
  const navButtons = document.querySelectorAll('.question-nav-btn');
  const prevButtons = document.querySelectorAll('.prev-question');
  const nextButtons = document.querySelectorAll('.next-question');
  const submitBtn = document.getElementById('submitBtn');
  
  // Thiết lập đồng hồ đếm ngược
  setupTimer();
  
  // Hàm hiển thị câu hỏi theo index
  function showQuestion(index) {
    // Ẩn tất cả câu hỏi
    questionContainers.forEach(container => {
      container.style.display = 'none';
    });
    
    // Tìm câu hỏi theo index
    let currentContainer = null;
    let count = 0;
    
    questionContainers.forEach(container => {
      count++;
      if (count === parseInt(index)) {
        currentContainer = container;
      }
    });
    
    // Hiển thị câu hỏi được chọn
    if (currentContainer) {
      currentContainer.style.display = 'block';
      
      // Hiển thị đoạn văn tương ứng
      const passageIndex = currentContainer.getAttribute('data-passage-index');
      passageContents.forEach(passage => {
        passage.style.display = 'none';
      });
      
      const selectedPassage = document.getElementById(`passage-${passageIndex}`);
      if (selectedPassage) {
        selectedPassage.style.display = 'block';
      }
      
      // Cập nhật biến câu hỏi hiện tại
      currentQuestionIndex = parseInt(index);
      
      // Cập nhật trạng thái nút điều hướng
      updateNavigationButtons();
    }
  }
  
  // Hàm cập nhật trạng thái nút điều hướng
  function updateNavigationButtons() {
    // Vô hiệu hóa nút "Câu trước" nếu đang ở câu đầu tiên
    prevButtons.forEach(btn => {
      btn.disabled = currentQuestionIndex === 1;
      if (currentQuestionIndex === 1) {
        btn.classList.add('opacity-50', 'cursor-not-allowed');
      } else {
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
      }
    });
    
    // Vô hiệu hóa nút "Câu tiếp theo" nếu đang ở câu cuối cùng
    nextButtons.forEach(btn => {
      btn.disabled = currentQuestionIndex === totalQuestions;
      if (currentQuestionIndex === totalQuestions) {
        btn.classList.add('opacity-50', 'cursor-not-allowed');
      } else {
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
      }
    });
    
    // Cập nhật trạng thái active cho nút điều hướng
    navButtons.forEach(btn => {
      const btnIndex = parseInt(btn.getAttribute('data-index'));
      if (btnIndex === currentQuestionIndex) {
        btn.classList.add('bg-blue-500', 'text-white');
        btn.classList.remove('bg-gray-100', 'bg-green-500');
      } else if (btn.classList.contains('answered')) {
        btn.classList.add('bg-green-500', 'text-white');
        btn.classList.remove('bg-gray-100', 'bg-blue-500');
      } else {
        btn.classList.add('bg-gray-100');
        btn.classList.remove('bg-blue-500', 'bg-green-500', 'text-white');
      }
    });
  }
  
  // Hàm đánh dấu câu hỏi đã trả lời
  function markAnswered(questionId) {
    console.log('Marking question as answered:', questionId);
    const navButton = document.querySelector(`.question-nav-btn[data-question-id="${questionId}"]`);
    if (navButton) {
      navButton.classList.add('answered');
      if (parseInt(navButton.getAttribute('data-index')) !== currentQuestionIndex) {
        navButton.classList.remove('bg-gray-100', 'bg-blue-500');
        navButton.classList.add('bg-green-500', 'text-white');
      }
    } else {
      console.warn('Navigation button not found for question ID:', questionId);
    }
  }
  
  // Thiết lập sự kiện cho các loại câu hỏi khác nhau
  function setupQuestionEvents() {
    // 1. Multiple Choice (Một đáp án)
    const radioOptions = document.querySelectorAll('.answer-option');
    radioOptions.forEach(option => {
      option.addEventListener('change', function() {
        const questionId = this.getAttribute('data-question-id');
        const value = this.value;
        console.log('Radio option changed for question:', questionId, 'value:', value);
        markAnswered(questionId);
        
        // Lưu câu trả lời - đảm bảo lưu đúng giá trị chuỗi
        saveAnswer(questionId, value);
      });
    });

    // 2. Multiple Choice (Nhiều đáp án)
    const checkboxOptions = document.querySelectorAll('.answer-option-checkbox');
    checkboxOptions.forEach(option => {
      option.addEventListener('change', function() {
        const questionId = this.getAttribute('data-question-id');
        const maxSelections = parseInt(this.getAttribute('data-max-selections')) || 2;
        console.log('Checkbox option changed for question:', questionId, 'max selections:', maxSelections);
        
        // Lấy tất cả các checkbox cho câu hỏi này
        const allCheckboxes = document.querySelectorAll(`.answer-option-checkbox[data-question-id="${questionId}"]`);
        const selectedCheckboxes = document.querySelectorAll(`.answer-option-checkbox[data-question-id="${questionId}"]:checked`);
        
        const warningElement = document.getElementById(`warning-${questionId}`);
        
        // Kiểm tra nếu vượt quá giới hạn
        if (selectedCheckboxes.length > maxSelections) {
          // Hiển thị cảnh báo
          if (warningElement) {
            warningElement.classList.remove('hidden');
          }
          
          // Bỏ check checkbox vừa được chọn (checkbox cuối cùng)
          this.checked = false;
          
          // Tự động ẩn cảnh báo sau 3 giây
          setTimeout(() => {
            if (warningElement) {
              warningElement.classList.add('hidden');
            }
          }, 3000);
          
          return; // Không xử lý tiếp
        } else {
          // Ẩn cảnh báo nếu số lượng hợp lệ
          if (warningElement) {
            warningElement.classList.add('hidden');
          }
        }
        
        // Tạo mảng các giá trị được chọn
        const selectedValues = Array.from(selectedCheckboxes).map(checkbox => checkbox.value);
        console.log('Selected values:', selectedValues);
        
        // Đánh dấu câu hỏi đã trả lời nếu có ít nhất một lựa chọn
        if (selectedValues.length > 0) {
          markAnswered(questionId);
        }
        
        // Lưu câu trả lời dưới dạng JSON
        saveAnswer(questionId, selectedValues);
      });
    });

    // 3. Fill in the Blank (Simple)
    const fillBlankInputs = document.querySelectorAll('.fill-blank-input');
    fillBlankInputs.forEach(input => {
      input.addEventListener('input', function() {
        const questionId = this.getAttribute('data-question-id');
        console.log('Fill blank input changed for question:', questionId, 'value:', this.value);
        
        if (this.value.trim() !== '') {
          markAnswered(questionId);
        }
        
        saveAnswer(questionId, this.value);
      });
    });

    // 4. Fill in the Blank (Multiple)
    const fillBlankMultipleSelects = document.querySelectorAll('.fill-blank-multiple-select');
    fillBlankMultipleSelects.forEach(select => {
      select.addEventListener('change', function() {
        const questionId = this.getAttribute('data-question-id');
        const blankNumber = this.getAttribute('data-blank-number');
        console.log('Fill blank multiple select changed for question:', questionId, 'blank:', blankNumber);
        
        // Lấy tất cả các select cho câu hỏi này
        const allSelects = document.querySelectorAll(`.fill-blank-multiple-select[data-question-id="${questionId}"]`);
        
        // Tạo object chứa các câu trả lời
        const answers = {};
        
        // Điền giá trị vào object
        allSelects.forEach(sel => {
          const blankNum = sel.getAttribute('data-blank-number');
          if (sel.value) {
            // Lưu giá trị dưới dạng số nếu có thể
            const numValue = parseInt(sel.value);
            answers[blankNum] = isNaN(numValue) ? sel.value.trim() : numValue;
          }
        });
        
        console.log('Fill blank multiple answers:', answers);
        
        // Đánh dấu câu hỏi đã trả lời nếu có ít nhất một lựa chọn
        if (Object.keys(answers).length > 0) {
          markAnswered(questionId);
        }
        
        // Lưu câu trả lời
        saveAnswer(questionId, answers);
      });
    });

    // 5. Fill in the Blank (One Word Only)
    const oneWordInputs = document.querySelectorAll('.one-word-input');
    oneWordInputs.forEach(input => {
      input.addEventListener('input', function() {
        const questionId = this.getAttribute('data-question-id');
        const blankIndex = this.getAttribute('data-blank-index');
        console.log('One word input changed for question:', questionId, 'blank index:', blankIndex);
        
        // Lấy tất cả các input cho câu hỏi này
        const allInputs = document.querySelectorAll(`.one-word-input[data-question-id="${questionId}"]`);
        
        // Tạo object chứa các câu trả lời
        const answers = {};
        let allAnswered = true;
        
        allInputs.forEach(inp => {
          const idx = inp.getAttribute('data-blank-index');
          if (inp.value.trim()) {
            answers[idx] = inp.value.trim();
          } else {
            allAnswered = false;
          }
        });
        
        console.log('One word answers:', answers);
        
        // Đánh dấu câu hỏi đã trả lời nếu có ít nhất một ô được điền
        if (Object.keys(answers).length > 0) {
          markAnswered(questionId);
        }
        
        // Lưu câu trả lời
        saveAnswer(questionId, answers);
      });
    });

    // 6. Matching
    const matchingSelects = document.querySelectorAll('.matching-select');
    matchingSelects.forEach(select => {
      select.addEventListener('change', function() {
        const questionId = this.getAttribute('data-question-id');
        const paragraphIndex = this.getAttribute('data-paragraph-index');
        console.log('Matching select changed for question:', questionId, 'paragraph:', paragraphIndex);
        
        // Lấy tất cả các select trong câu hỏi này
        const selects = document.querySelectorAll(`.matching-select[data-question-id="${questionId}"]`);
        const matchingAnswers = {};
        
        // Điền giá trị vào object
        selects.forEach(s => {
          const pIndex = s.getAttribute('data-paragraph-index');
          if (s.value) {
            // Lưu giá trị dưới dạng số nếu có thể
            const numValue = parseInt(s.value);
            matchingAnswers[pIndex] = isNaN(numValue) ? s.value : numValue;
          }
        });
        
        console.log('Matching answers:', matchingAnswers);
        
        // Đánh dấu câu hỏi đã trả lời nếu có ít nhất một lựa chọn
        if (Object.keys(matchingAnswers).length > 0) {
          markAnswered(questionId);
        }
        
        // Lưu câu trả lời
        saveAnswer(questionId, matchingAnswers);
      });
    });

    // 7. Short Answer
    const shortAnswerInputs = document.querySelectorAll('.short-answer-input');
    shortAnswerInputs.forEach(textarea => {
      textarea.addEventListener('input', function() {
        const questionId = this.getAttribute('data-question-id');
        console.log('Short answer input changed for question:', questionId);
        
        // Đếm số từ
        const wordCount = this.value.trim().split(/\s+/).filter(word => word.length > 0).length;
        const wordCountElement = this.parentElement.querySelector('.word-count');
        if (wordCountElement) {
          wordCountElement.textContent = wordCount;
        }
        
        if (this.value.trim() !== '') {
          markAnswered(questionId);
        }
        
        saveAnswer(questionId, this.value);
      });
    });
  }
  
  // Thiết lập sự kiện cho các nút điều hướng câu hỏi
  navButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const index = this.getAttribute('data-index');
      showQuestion(index);
    });
  });
  
  // Thiết lập sự kiện cho nút "Câu trước"
  prevButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      if (currentQuestionIndex > 1) {
        showQuestion(currentQuestionIndex - 1);
      }
    });
  });
  
  // Thiết lập sự kiện cho nút "Câu tiếp theo"
  nextButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      if (currentQuestionIndex < totalQuestions) {
        showQuestion(currentQuestionIndex + 1);
      }
    });
  });
  
  // Thiết lập sự kiện cho các lựa chọn đáp án (một đáp án)
  const radioOptions = document.querySelectorAll('.answer-option');
  radioOptions.forEach(option => {
    option.addEventListener('change', function() {
      const questionId = this.getAttribute('data-question-id');
      markAnswered(questionId);
      
      // Lưu câu trả lời
      saveAnswer(questionId, this.value);
    });
  });
  
  // Thiết lập sự kiện cho các lựa chọn đáp án (nhiều đáp án) - Logic cũ được thay thế ở trên
  // Code này được xử lý trong phần setupQuestionEvents() ở trên
  
  // Thiết lập sự kiện cho các trường nhập text
  const textInputs = document.querySelectorAll('.text-answer-input');
  textInputs.forEach(input => {
    input.addEventListener('input', function() {
      const questionId = this.getAttribute('data-question-id');
      if (this.value.trim() !== '') {
        markAnswered(questionId);
      }
      saveAnswer(questionId, this.value);
    });
  });
  
  // Hàm nộp bài
  function submitTest() {
    try {
      // Dừng đồng hồ đếm ngược
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      
      // Cập nhật lần cuối thời gian làm bài
      updateTimeSpent();
      
      // Lấy tất cả câu trả lời từ localStorage
      const answers = JSON.parse(localStorage.getItem(`test_${testId}_answers`) || '{}');
      
      console.log('Submitting answers:', answers);
      console.log('Time spent (seconds):', testTimeSpent);
      
      // Kiểm tra số lượng câu hỏi đã trả lời
      const totalQuestions = document.querySelectorAll('.question-container').length;
      const answeredQuestions = Object.keys(answers).filter(questionId => {
        const answer = answers[questionId];
        // Kiểm tra xem câu trả lời có hợp lệ không
        if (answer === null || answer === undefined || answer === '') {
          return false;
        }
        
        // Kiểm tra cho các loại đáp án khác nhau
        if (typeof answer === 'string') {
          try {
            const parsed = JSON.parse(answer);
            if (Array.isArray(parsed)) {
              return parsed.length > 0;
            } else if (typeof parsed === 'object' && parsed !== null) {
              return Object.keys(parsed).length > 0;
            }
          } catch (e) {
            // Nếu không phải JSON, kiểm tra chuỗi có rỗng không
            return answer.trim() !== '';
          }
        } else if (Array.isArray(answer)) {
          return answer.length > 0;
        } else if (typeof answer === 'object' && answer !== null) {
          return Object.keys(answer).length > 0;
        }
        
        return true;
      }).length;
      
      console.log(`Answered questions: ${answeredQuestions}/${totalQuestions}`);
      
      // Tạo thông báo xác nhận phù hợp
      let confirmMessage;
      if (answeredQuestions === 0) {
        confirmMessage = 'Warning: You have not answered any questions yet!\n\nAre you sure you want to submit an empty test?';
      } else if (answeredQuestions < totalQuestions) {
        const unansweredCount = totalQuestions - answeredQuestions;
        confirmMessage = `Warning: You have ${unansweredCount} unanswered question(s) out of ${totalQuestions} total questions.\n\nAnswered: ${answeredQuestions}/${totalQuestions}\n\nAre you sure you want to submit?`;
      } else {
        confirmMessage = `You have answered all ${totalQuestions} questions.\n\nAre you sure you want to submit your test?`;
      }
      
      // Hiển thị thông báo xác nhận
      if (!confirm(confirmMessage)) {
        return; // Người dùng hủy bỏ
      }
      
      // Tạo form ẩn để gửi dữ liệu
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `/user/tests/${testId}/submit`;
      
      // Thêm input cho testId
      const testIdInput = document.createElement('input');
      testIdInput.type = 'hidden';
      testIdInput.name = 'testId';
      testIdInput.value = testId;
      form.appendChild(testIdInput);
      
      // Thêm input cho mỗi câu trả lời
      for (const questionId in answers) {
        if (answers[questionId] !== null && answers[questionId] !== undefined) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = `answers[${questionId}]`;
          input.value = answers[questionId];
          form.appendChild(input);
        }
      }
      
      // Thêm input cho attemptId nếu có
      if (attemptId) {
        const attemptInput = document.createElement('input');
        attemptInput.type = 'hidden';
        attemptInput.name = 'attemptId';
        attemptInput.value = attemptId;
        form.appendChild(attemptInput);
      }
      
      // Thêm input cho thời gian làm bài
      const timeSpentInput = document.createElement('input');
      timeSpentInput.type = 'hidden';
      timeSpentInput.name = 'timeSpentInSeconds';
      timeSpentInput.value = testTimeSpent.toString();
      form.appendChild(timeSpentInput);
      
      // Thêm form vào body và submit
      document.body.appendChild(form);
      console.log('Form created, submitting...');
      form.submit();
    } catch (error) {
      console.error('Error submitting test:', error);
      alert('Có lỗi khi nộp bài: ' + error.message);
    }
  }
  
  // Thiết lập sự kiện cho nút nộp bài
  const submitButtons = document.querySelectorAll('#submitBtn, #submitBtn2');
  submitButtons.forEach(function(submitBtn) {
    if (submitBtn) {
      submitBtn.addEventListener('click', function() {
        // Gọi trực tiếp hàm submitTest mà không cần confirm ở đây
        // vì logic kiểm tra đã được tích hợp vào trong hàm submitTest
        submitTest();
      });
    }
  });
  
  // Hàm thiết lập đồng hồ đếm ngược
  function setupTimer() {
    const timerElement = document.getElementById('timer');
    if (!timerElement) return;
    
    // Khởi tạo thời gian bắt đầu
    initializeStartTime();
    
    // Kiểm tra xem có giới hạn thời gian không
    if (!timeLimit || timeLimit <= 0) {
      console.log('No time limit set, using unlimited time');
      
      // Nếu không có giới hạn thời gian, vẫn cập nhật thời gian làm bài
      timerInterval = setInterval(function() {
        updateTimeSpent();
      }, 10000); // Cập nhật mỗi 10 giây
      
      return;
    }
    
    const minutesDisplay = document.getElementById('minutes');
    const secondsDisplay = document.getElementById('seconds');
    
    if (!minutesDisplay || !secondsDisplay) {
      console.error('Timer display elements not found');
      return;
    }
    
    let totalSeconds = timeLimit * 60;
    
    // Kiểm tra xem có thời gian đã lưu trong localStorage không
    const timerKey = `test_${testId}_timer`;
    const savedTime = localStorage.getItem(timerKey);
    
    // Nếu là lần làm bài mới, không sử dụng thời gian đã lưu
    if (savedTime && !isNewAttempt) {
      totalSeconds = parseInt(savedTime);
    }
    
    console.log('Setting up timer with', totalSeconds, 'seconds');
    
    // Cập nhật hiển thị ban đầu
    const initialMinutes = Math.floor(totalSeconds / 60);
    const initialSeconds = totalSeconds % 60;
    
    minutesDisplay.textContent = initialMinutes.toString().padStart(2, '0');
    secondsDisplay.textContent = initialSeconds.toString().padStart(2, '0');
    
    timerInterval = setInterval(function() {
      if (totalSeconds <= 0) {
        clearInterval(timerInterval);
        alert('Hết thời gian làm bài!');
        submitTest();
        return;
      }
      
      totalSeconds--;
      
      // Lưu thời gian còn lại vào localStorage
      localStorage.setItem(timerKey, totalSeconds.toString());
      
      // Cập nhật hiển thị
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      
      minutesDisplay.textContent = minutes.toString().padStart(2, '0');
      secondsDisplay.textContent = seconds.toString().padStart(2, '0');
      
      // Đổi màu khi còn ít thời gian
      if (totalSeconds < 60) {
        timerElement.classList.add('text-red-600');
      }
      
      // Cập nhật thời gian làm bài
      updateTimeSpent();
    }, 1000);
  }
  
  // Khôi phục các câu trả lời đã lưu (nếu có)
  function restoreSavedAnswers() {
    if (!testId || isNewAttempt) return;
    
    const storageKey = `test_${testId}_answers`;
    const savedAnswers = JSON.parse(localStorage.getItem(storageKey) || '{}');
    
    for (const questionId in savedAnswers) {
      const answer = savedAnswers[questionId];
      
      // 1. Khôi phục cho radio buttons (multiple choice, true/false/not given)
      const radioOptions = document.querySelectorAll(`.answer-option[data-question-id="${questionId}"]`);
      radioOptions.forEach(option => {
        if (option.value === answer) {
          option.checked = true;
          markAnswered(questionId);
        }
      });
      
      // 2. Khôi phục cho checkboxes (multiple choice multiple)
      try {
        const multipleAnswers = JSON.parse(answer);
        if (Array.isArray(multipleAnswers)) {
          const checkboxes = document.querySelectorAll(`.answer-option-checkbox[data-question-id="${questionId}"]`);
          checkboxes.forEach(checkbox => {
            if (multipleAnswers.includes(checkbox.value)) {
              checkbox.checked = true;
              markAnswered(questionId);
            }
          });
        }
      } catch (e) {
        // Không phải JSON array, bỏ qua
      }
      
      // 3. Khôi phục cho fill in the blank (simple)
      const fillBlankInput = document.querySelector(`.fill-blank-input[data-question-id="${questionId}"]`);
      if (fillBlankInput && typeof answer === 'string') {
        fillBlankInput.value = answer;
        if (answer.trim() !== '') {
          markAnswered(questionId);
        }
      }
      
      // 4. Khôi phục cho fill in the blank (multiple) và matching
      try {
        const parsedAnswer = JSON.parse(answer);
        
        // Kiểm tra nếu là object
        if (typeof parsedAnswer === 'object' && parsedAnswer !== null && !Array.isArray(parsedAnswer)) {
          // Fill in the blank (multiple)
          const fillBlankSelects = document.querySelectorAll(`.fill-blank-multiple-select[data-question-id="${questionId}"]`);
          if (fillBlankSelects.length > 0) {
            fillBlankSelects.forEach(select => {
              const blankNumber = select.getAttribute('data-blank-number');
              if (parsedAnswer[blankNumber] !== undefined) {
                select.value = parsedAnswer[blankNumber].toString();
              }
            });
            
            if (Object.keys(parsedAnswer).length > 0) {
              markAnswered(questionId);
            }
          }
          
          // Matching
          const matchingSelects = document.querySelectorAll(`.matching-select[data-question-id="${questionId}"]`);
          if (matchingSelects.length > 0) {
            matchingSelects.forEach(select => {
              const paragraphIndex = select.getAttribute('data-paragraph-index');
              if (parsedAnswer[paragraphIndex] !== undefined) {
                select.value = parsedAnswer[paragraphIndex].toString();
              }
            });
            
            if (Object.keys(parsedAnswer).length > 0) {
              markAnswered(questionId);
            }
          }
        }
        // Kiểm tra nếu là mảng (cho các câu trả lời cũ)
        else if (Array.isArray(parsedAnswer)) {
          // Chuyển đổi từ mảng sang object
          const convertedAnswer = {};
          parsedAnswer.forEach((value, index) => {
            if (value !== "") {
              convertedAnswer[index.toString()] = value;
            }
          });
          
          // Fill in the blank (multiple)
          const fillBlankSelects = document.querySelectorAll(`.fill-blank-multiple-select[data-question-id="${questionId}"]`);
          if (fillBlankSelects.length > 0) {
            fillBlankSelects.forEach(select => {
              const blankNumber = select.getAttribute('data-blank-number');
              if (convertedAnswer[blankNumber]) {
                select.value = convertedAnswer[blankNumber].toString();
              }
            });
            
            if (Object.keys(convertedAnswer).length > 0) {
              markAnswered(questionId);
            }
          }
          
          // Matching
          const matchingSelects = document.querySelectorAll(`.matching-select[data-question-id="${questionId}"]`);
          if (matchingSelects.length > 0) {
            matchingSelects.forEach(select => {
              const paragraphIndex = select.getAttribute('data-paragraph-index');
              if (convertedAnswer[paragraphIndex]) {
                select.value = convertedAnswer[paragraphIndex].toString();
              }
            });
            
            if (Object.keys(convertedAnswer).length > 0) {
              markAnswered(questionId);
            }
          }
        }
      } catch (e) {
        console.error('Error parsing saved answer:', e);
        // Không phải JSON, bỏ qua
      }
      
      // 5. Khôi phục cho short answer
      const shortAnswerInput = document.querySelector(`.short-answer-input[data-question-id="${questionId}"]`);
      if (shortAnswerInput && typeof answer === 'string') {
        shortAnswerInput.value = answer;
        
        // Cập nhật số từ
        const wordCount = answer.trim().split(/\s+/).filter(word => word.length > 0).length;
        const wordCountElement = shortAnswerInput.parentElement.querySelector('.word-count');
        if (wordCountElement) {
          wordCountElement.textContent = wordCount;
        }
        
        if (answer.trim() !== '') {
          markAnswered(questionId);
        }
      }
    }
  }
  
  // Thiết lập sự kiện cho các loại câu hỏi khác nhau
  setupQuestionEvents();
  
  // Hiển thị câu hỏi đầu tiên khi trang được tải
  showQuestion(1);
  
  // Khôi phục câu trả lời đã lưu
  restoreSavedAnswers();
});

// Thêm sự kiện khi người dùng rời khỏi trang
window.addEventListener('beforeunload', function() {
  // Cập nhật thời gian làm bài trước khi rời khỏi trang
  updateTimeSpent();
});