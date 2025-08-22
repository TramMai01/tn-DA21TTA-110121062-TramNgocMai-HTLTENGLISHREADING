/**
 * Question Creation Form JavaScript
 * Handles all form interactions for creating different types of reading comprehension questions
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("Question creation form initialized");
  
  // Log tất cả các section để kiểm tra
  console.log("Question type sections:");
  document.querySelectorAll('.question-type-section').forEach(section => {
    console.log(section.id, section.classList.contains('hidden'));
  });
  
  // Kiểm tra xem fill_blankOptions có tồn tại không
  const fillBlankOptions = document.getElementById('fill_blankOptions');
  console.log("fill_blankOptions exists:", !!fillBlankOptions);
  
  // Initialize UI components and event listeners
  initializeQuestionTypes();
  initializeFormHandlers();
  setupFormValidation();
  setupTextHighlighting();
  setupPassageTextSelection();
  
  // Initialize question type fields
  toggleQuestionTypeFields();
  
  // Add event listener to question type select
  document.getElementById('questionType').addEventListener('change', function() {
    toggleQuestionTypeFields();
    // Setup handlers based on selected type
    const selectedType = this.value;
    if (selectedType === 'multiple_choice') {
      setTimeout(setupMultipleChoiceHandlers, 100);
    }
  });
  
  // Thêm event listener cho nút "Update Matching Matrix"
  const updateMatrixBtn = document.getElementById('updateMatrixBtn');
  if (updateMatrixBtn) {
    updateMatrixBtn.addEventListener('click', updateMatchingMatrix);
  }
  
  // Thêm event listener cho form submit
  const form = document.querySelector('form');
  if (form) {
    form.addEventListener('submit', formSubmitHandler);
  }
  
  // Thêm event listener cho checkbox multipleAnswers
  const multipleAnswersCheckbox = document.getElementById('multipleAnswersCheckbox');
  if (multipleAnswersCheckbox) {
    multipleAnswersCheckbox.addEventListener('change', function() {
      updateMultipleChoiceOptions();
    });
  }
  
  // Thêm event listener cho nút thêm option
  const addOptionBtn = document.getElementById('addOptionBtn');
  if (addOptionBtn) {
    addOptionBtn.addEventListener('click', addMultipleChoiceOption);
  }
  
  // Thêm event listener cho questionType
  const questionTypeSelect = document.getElementById('questionType');
  if (questionTypeSelect) {
    questionTypeSelect.addEventListener('change', function() {
      const selectedType = this.value;
      
      // Hiển thị/ẩn các phần tử dựa trên loại câu hỏi
      document.querySelectorAll('.question-type-section').forEach(section => {
        section.classList.add('hidden');
      });
      
      if (selectedType) {
        const targetSection = document.getElementById(`${selectedType}Section`);
        if (targetSection) {
          targetSection.classList.remove('hidden');
        }
        
        // Nếu là multiple_choice, reset options
        if (selectedType === 'multiple_choice') {
          resetMultipleChoiceOptions();
        }
      }
    });
  }
  
  // Thêm event listener cho blankStyleSelect
  const blankStyleSelect = document.getElementById('blankStyleSelect');
  if (blankStyleSelect) {
    blankStyleSelect.addEventListener('change', function() {
      // Ẩn tất cả các container
      const containers = [
        document.getElementById('simpleBlankContainer'),
        document.getElementById('multipleBlankContainer'),
        document.getElementById('oneWordOnlyContainer')
      ];
      
      containers.forEach(container => {
        if (container) container.style.display = 'none';
      });
      
      // Hiển thị container tương ứng
      const selectedStyle = this.value;
      
      if (selectedStyle === 'simple') {
        document.getElementById('simpleBlankContainer').style.display = 'block';
      } else if (selectedStyle === 'multiple') {
        document.getElementById('multipleBlankContainer').style.display = 'block';
      } else if (selectedStyle === 'one_word_only') {
        document.getElementById('oneWordOnlyContainer').style.display = 'block';
      }
      
      console.log(`Đã chuyển sang kiểu điền vào chỗ trống: ${selectedStyle}`);
    });
  }
  
  // Gọi hàm toggleFillBlankStyle khi trang được tải để hiển thị container đúng
  toggleFillBlankStyle();
  
  // Khởi tạo các sự kiện cho form
  initFormEvents();
});

/**
 * Initialize question type selection
 */
function initializeQuestionTypes() {
  // Get UI elements
  const questionTypeSelect = document.getElementById('questionType');
  const typeButtons = document.querySelectorAll('.question-type-btn');
  const questionTypeSections = document.querySelectorAll('.question-type-section');
  const selectedTypeIndicator = document.getElementById('selectedTypeIndicator');
  const multipleChoiceSettings = document.getElementById('multipleChoiceSettings');
  
  // Hide all type sections initially
  questionTypeSections.forEach(section => {
    section.style.display = 'none';
  });
  
  // Handle question type select change
  if (questionTypeSelect) {
    questionTypeSelect.addEventListener('change', function() {
      selectQuestionType(this.value);
      
      // Show/hide multiple choice settings
      if (multipleChoiceSettings) {
        multipleChoiceSettings.style.display = 
          this.value === 'multiple_choice' ? 'block' : 'none';
      }
    });
    
    // Set initial selection if available
    if (questionTypeSelect.value) {
      selectQuestionType(questionTypeSelect.value);
      
      // Show multiple choice settings if applicable
      if (multipleChoiceSettings && questionTypeSelect.value === 'multiple_choice') {
        multipleChoiceSettings.style.display = 'block';
      }
    }
  }
  
  // Handle question type button clicks
  typeButtons.forEach(button => {
    button.addEventListener('click', function() {
      const type = this.dataset.type;
      selectQuestionType(type);
      
      // Update select element
      if (questionTypeSelect && questionTypeSelect.value !== type) {
        questionTypeSelect.value = type;
      }
      
      // Show/hide multiple choice settings
      if (multipleChoiceSettings) {
        multipleChoiceSettings.style.display = 
          type === 'multiple_choice' ? 'block' : 'none';
      }
    });
  });
  
  // Handle multiple answers checkbox change
  const multipleAnswersCheckbox = document.getElementById('multipleAnswersCheckbox');
  if (multipleAnswersCheckbox) {
    multipleAnswersCheckbox.addEventListener('change', function() {
      updateMultipleChoiceOptions();
    });
  }
}

/**
 * Select a question type and update UI
 * @param {string} type - Question type value
 */
function selectQuestionType(type) {
  if (!type) return;
  
  console.log("Question type selected:", type);
  
  // Hide all question type sections
  document.querySelectorAll('.question-type-section').forEach(section => {
      section.style.display = 'none';
  });
  
  // Show the selected section
  const selectedSection = document.getElementById(`${type}Options`);
  if (selectedSection) {
    selectedSection.style.display = 'block';
  } else {
    console.log(`Section not found for type: ${type}, trying with underscore format`);
    // Try with underscore format (e.g., multiple_choice)
    const underscoreSection = document.getElementById(`${type.replace(/([A-Z])/g, '_$1').toLowerCase()}Options`);
    if (underscoreSection) {
      underscoreSection.style.display = 'block';
    }
  }
  
  // Update visual indicator if present
  const indicator = document.getElementById('selectedTypeIndicator');
  if (indicator) {
    let typeName = '';
    
    switch (type) {
      case 'multipleChoice':
      case 'multiple_choice':
        typeName = 'Multiple Choice';
        break;
      case 'fillBlank':
      case 'fill_blank':
        typeName = 'Fill in the Blank';
        break;
      case 'matching':
        typeName = 'Matching';
        break;
      case 'trueFalse':
      case 'true_false_not_given':
        typeName = 'True/False/Not Given';
        break;
    }
    
    indicator.textContent = typeName;
    indicator.style.display = typeName ? 'block' : 'none';
    
    // Add appropriate class for styling
    indicator.className = 'px-2 py-1 text-sm font-medium rounded-full';
    
    switch (type) {
      case 'multipleChoice':
      case 'multiple_choice':
        indicator.classList.add('bg-blue-100', 'text-blue-800');
        break;
      case 'fillBlank':
      case 'fill_blank':
        indicator.classList.add('bg-green-100', 'text-green-800');
        break;
      case 'matching':
        indicator.classList.add('bg-purple-100', 'text-purple-800');
        break;
      case 'trueFalse':
      case 'true_false_not_given':
        indicator.classList.add('bg-yellow-100', 'text-yellow-800');
        break;
    }
  }
  
  // For matching questions, update the matrix
  if (type === 'matching') {
    setTimeout(updateMatchingMatrix, 100);
  }
  
  // For multiple choice questions, setup handlers
  if (type === 'multiple_choice') {
    setTimeout(setupMultipleChoiceHandlers, 100);
  }
  
  // Highlight active button if using button UI
  document.querySelectorAll('.question-type-btn').forEach(btn => {
    btn.classList.remove('bg-blue-500', 'text-white');
    btn.classList.add('bg-white', 'text-blue-600', 'border-blue-600');
    
    if (btn.dataset.type === type) {
      btn.classList.remove('bg-white', 'text-blue-600', 'border-blue-600');
      btn.classList.add('bg-blue-500', 'text-white');
    }
  });
}

/**
 * Initialize all form handlers
 */
function initializeFormHandlers() {
  setupMultipleChoiceHandlers();
  setupFillBlankHandlers();
  setupMatchingHandlers();
  setupTrueFalseHandlers();
  // setupMultipleQuestionHandlers(); // Xóa hoặc comment dòng này
}

/**
 * Update the value of the radio/checkbox based on the text input
 * @param {HTMLInputElement} textInput - The text input element
 */
function updateInputValue(textInput) {
  const optionDiv = textInput.closest('div');
  const inputElement = optionDiv.querySelector('input[type="radio"], input[type="checkbox"]');
  if (inputElement && textInput) {
    inputElement.value = textInput.value.trim();
  }
}
/**
 * Update the multiple choice display when the multiple answers checkbox changes
 */
function updateMultipleChoiceOptions() {
  const multipleAnswersCheckbox = document.getElementById('multipleAnswersCheckbox');
  const optionsContainer = document.getElementById('optionsContainer');
  
  if (!optionsContainer) return;
  
  const isMultipleAnswers = multipleAnswersCheckbox && multipleAnswersCheckbox.checked;
  console.log("Multiple answers:", isMultipleAnswers);
  
  // Lưu lại thông tin của tất cả các option hiện tại
  const optionsData = [];
  const optionItems = optionsContainer.querySelectorAll('.option-item');
  
  optionItems.forEach(item => {
    const textInput = item.querySelector('input[type="text"]');
    const radioInput = item.querySelector('input[type="radio"]');
    const checkboxInput = item.querySelector('input[type="checkbox"]');
    
    if (textInput) {
      optionsData.push({
        text: textInput.value || '',
        checked: radioInput ? radioInput.checked : (checkboxInput ? checkboxInput.checked : false)
      });
    }
  });
  
  // Xóa tất cả các option hiện tại
  while (optionsContainer.firstChild) {
    optionsContainer.removeChild(optionsContainer.firstChild);
  }
  
  // Tạo lại tất cả các option với loại input phù hợp
  optionsData.forEach((option, index) => {
    addOptionWithData(option.text, option.checked, index);
  });
  
  // Cập nhật trạng thái hiển thị của các nút xóa
  updateDeleteButtonsVisibility();
}

/**
 * Thêm option với dữ liệu có sẵn
 */
function addOptionWithData(text, isChecked, index) {
  const optionsContainer = document.getElementById('optionsContainer');
  const isMultipleAnswers = document.getElementById('multipleAnswersCheckbox')?.checked || false;
  
  const newOption = document.createElement('div');
  newOption.className = 'flex items-center gap-2 mb-2 option-item';
  
  // Tạo input với loại phù hợp dựa trên multipleAnswers
  const selectionInput = document.createElement('input');
  selectionInput.type = isMultipleAnswers ? 'checkbox' : 'radio';
  selectionInput.name = 'correctAnswer';
  selectionInput.className = 'h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500';
  selectionInput.id = `correctAnswer${index}`;
  selectionInput.value = text; // Đặt giá trị ban đầu là tên option
  selectionInput.checked = isChecked;
  
  const textInput = document.createElement('input');
  textInput.type = 'text';
  textInput.name = 'options[]';
  textInput.value = text;
  textInput.placeholder = `Option ${index + 1}`;
  textInput.className = 'flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500';
  textInput.required = true;
  
  // Cập nhật giá trị của input selection khi text thay đổi
  textInput.addEventListener('input', function() {
    selectionInput.value = this.value;
  });
  
  // Thêm các phần tử vào option item
  newOption.appendChild(selectionInput);
  newOption.appendChild(textInput);
  
  // Thêm nút xóa
  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'text-red-500 hover:text-red-700';
  deleteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>';
  
  deleteBtn.addEventListener('click', function() {
    if (optionsContainer.querySelectorAll('.option-item').length > 2) {
      optionsContainer.removeChild(newOption);
      updateOptionIndexes();
      updateDeleteButtonsVisibility();
    } else {
      alert('Câu hỏi trắc nghiệm phải có ít nhất 2 tùy chọn!');
    }
  });
  
  newOption.appendChild(deleteBtn);
  
  // Thêm option item vào container
  optionsContainer.appendChild(newOption);
}

/**
 * Add a new option to multiple choice question
 */
function addMultipleChoiceOption() {
  const optionsContainer = document.getElementById('optionsContainer');
  const optionItems = optionsContainer.querySelectorAll('.option-item');
  const optionCount = optionItems.length;
  
  // Tạo một tên mặc định không trùng lặp
  let defaultOptionName = `Option ${optionCount + 1}`;
  let counter = 1;
  
  // Kiểm tra xem tên mặc định có trùng với option nào đã tồn tại không
  const existingOptions = Array.from(optionsContainer.querySelectorAll('input[name="options[]"]'))
    .map(input => input.value.trim());
  
  while (existingOptions.includes(defaultOptionName)) {
    counter++;
    defaultOptionName = `Option ${optionCount + counter}`;
  }
  
  // Thêm option mới với dữ liệu mặc định
  addOptionWithData(defaultOptionName, false, optionCount);
  
  // Cập nhật trạng thái hiển thị của các nút xóa
  updateDeleteButtonsVisibility();
}

/**
 * Cập nhật lại các chỉ số cho tất cả các options
 */
function updateOptionIndexes() {
  const optionsContainer = document.getElementById('optionsContainer');
  const optionItems = optionsContainer.querySelectorAll('.option-item');
  
  optionItems.forEach((item, index) => {
    // Cập nhật ID và placeholder
    const selectionInput = item.querySelector('input[type="radio"], input[type="checkbox"]');
    const textInput = item.querySelector('input[name="options[]"]');
    
    if (selectionInput) {
      selectionInput.id = `correctAnswer${index}`;
    }
    
    if (textInput) {
      textInput.placeholder = `Option ${index + 1}`;
    }
  });
}

/**
 * Cập nhật trạng thái hiển thị của các nút xóa
 */
function updateDeleteButtonsVisibility() {
  const optionsContainer = document.getElementById('optionsContainer');
  const optionItems = optionsContainer.querySelectorAll('.option-item, .flex.items-center.gap-2.mb-2');
  const deleteButtons = optionsContainer.querySelectorAll('.remove-option, button[type="button"]');
  
  // Hiển thị hoặc ẩn các nút xóa dựa trên số lượng options
  if (optionItems.length > 2) {
    deleteButtons.forEach(button => {
      if (button.classList.contains('remove-option') || button.querySelector('svg')) {
        button.classList.remove('hidden');
        button.style.display = 'inline-block';
      }
    });
  } else {
    deleteButtons.forEach(button => {
      if (button.classList.contains('remove-option') || button.querySelector('svg')) {
        button.classList.add('hidden');
        button.style.display = 'none';
      }
    });
  }
}

/**
 * Set up handlers for multiple choice questions
 */
function setupMultipleChoiceHandlers() {
  const addOptionBtn = document.getElementById('addOptionBtn');
  const optionsContainer = document.getElementById('optionsContainer');
  const multipleAnswersCheckbox = document.getElementById('multipleAnswersCheckbox');
  
  // Thêm event listener cho checkbox multipleAnswers
  if (multipleAnswersCheckbox) {
    multipleAnswersCheckbox.addEventListener('change', function() {
      console.log("Checkbox changed, checked:", this.checked);
      updateMultipleChoiceOptions();
    });
  }
  
  // Thêm event listener cho nút Add Option
  if (addOptionBtn) {
    addOptionBtn.addEventListener('click', function() {
      addMultipleChoiceOption();
    });
  }
  
  // Thêm event listener cho các nút xóa có sẵn trong HTML
  if (optionsContainer) {
    optionsContainer.addEventListener('click', function(e) {
      if (e.target.closest('.remove-option')) {
        const optionItem = e.target.closest('.flex.items-center.gap-2.mb-2');
        const allOptions = optionsContainer.querySelectorAll('.flex.items-center.gap-2.mb-2');
        
        if (allOptions.length > 2) {
          optionItem.remove();
          updateOptionIndexes();
          updateDeleteButtonsVisibility();
        } else {
          alert('Câu hỏi trắc nghiệm phải có ít nhất 2 tùy chọn!');
        }
      }
    });
  }
  
  // Khởi tạo hiển thị nút xóa cho các option có sẵn
  updateDeleteButtonsVisibility();
}

/**
 * Set up handlers for fill blank questions
 */
function setupFillBlankHandlers() {
  // Thêm event listener cho blankStyleSelect
  const blankStyleSelect = document.getElementById('blankStyleSelect');
  if (blankStyleSelect) {
    blankStyleSelect.addEventListener('change', toggleFillBlankStyle);
  }
  
  // Thêm event listener cho các nút thêm
  const addAcceptableAnswerBtn = document.getElementById('addAcceptableAnswerBtn');
  if (addAcceptableAnswerBtn) {
    addAcceptableAnswerBtn.addEventListener('click', addAcceptableAnswer);
  }
  
  const addBlankOptionBtn = document.getElementById('addBlankOptionBtn');
  if (addBlankOptionBtn) {
    addBlankOptionBtn.addEventListener('click', addBlankOption);
  }
  
  const addBlankBtn = document.getElementById('addBlankBtn');
  if (addBlankBtn) {
    addBlankBtn.addEventListener('click', addBlank);
  }
  
  const addOneWordBlankBtn = document.getElementById('addOneWordBlankBtn');
  if (addOneWordBlankBtn) {
    addOneWordBlankBtn.addEventListener('click', addOneWordBlank);
  }
  
  // Khởi tạo ban đầu
  toggleFillBlankStyle();
}

/**
 * Thêm một đáp án chấp nhận được cho câu hỏi điền vào chỗ trống đơn giản
 */
function addAcceptableAnswer() {
  const container = document.getElementById('acceptableAnswersContainer');
  const answerCount = container.querySelectorAll('.acceptable-answer-item').length;
  
  // Tạo một div mới cho đáp án
  const answerDiv = document.createElement('div');
  answerDiv.className = 'flex items-center gap-2 mb-2 acceptable-answer-item';
  
  // Tạo input cho đáp án
  const answerInput = document.createElement('input');
  answerInput.type = 'text';
  answerInput.name = 'acceptableAnswers[]';
  answerInput.placeholder = `Answer ${answerCount + 1}`;
  answerInput.required = true;
  answerInput.className = 'flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500';
  
  // Tạo nút xóa
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'text-red-600 hover:text-red-900 remove-acceptable-answer';
  removeBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
    </svg>
  `;
  
  removeBtn.addEventListener('click', function() {
    container.removeChild(answerDiv);
    updateRemoveButtons(container, 'remove-acceptable-answer');
  });
  
  // Thêm các phần tử vào div
  answerDiv.appendChild(answerInput);
  answerDiv.appendChild(removeBtn);
  
  // Thêm div vào container
  container.appendChild(answerDiv);
  
  // Cập nhật trạng thái nút xóa
  updateRemoveButtons(container, 'remove-acceptable-answer');
}

/**
 * Thêm một tùy chọn mới cho phần điền vào chỗ trống nhiều lựa chọn
 */
function addBlankOption() {
  const container = document.getElementById('blankOptionsContainer');
  
  // Kiểm tra xem container có tồn tại không
  if (!container) {
    console.error("Container 'blankOptionsContainer' không tồn tại");
    return;
  }
  
  const optionCount = container.querySelectorAll('.flex.items-center.gap-2.mb-2').length;
  
  // Tạo một div mới cho option
  const optionDiv = document.createElement('div');
  optionDiv.className = 'flex items-center gap-2 mb-2 blank-option-item';
  
  // Tạo phần hiển thị chữ cái
  const letterDiv = document.createElement('div');
  letterDiv.className = 'w-10 text-center';
  
  const letterSpan = document.createElement('span');
  letterSpan.className = 'font-medium';
  letterSpan.textContent = `${String.fromCharCode(65 + optionCount)}.`;
  
  letterDiv.appendChild(letterSpan);
  
  // Tạo input cho option
  const optionInput = document.createElement('input');
  optionInput.type = 'text';
  optionInput.name = 'blankOptions[]'; // Sửa thành mảng để phù hợp với backend
  optionInput.placeholder = `Option ${optionCount + 1}`;
  optionInput.className = 'flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500';
  
  // Thêm event listener để cập nhật các select khi giá trị thay đổi
  optionInput.addEventListener('input', updateBlankAnswerSelects);
  
  // Tạo nút xóa
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'text-red-600 hover:text-red-900 remove-blank-option';
  removeBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
    </svg>
  `;
  
  removeBtn.addEventListener('click', function() {
    container.removeChild(optionDiv);
    updateRemoveButtons(container, 'remove-blank-option');
    // Cập nhật lại các chữ cái
    updateBlankOptionLetters();
    // Cập nhật lại các select
    updateBlankAnswerSelects();
  });
  
  // Thêm tất cả các phần tử vào div chính
  optionDiv.appendChild(letterDiv);
  optionDiv.appendChild(optionInput);
  optionDiv.appendChild(removeBtn);
  
  // Thêm div vào container
  container.appendChild(optionDiv);
  
  // Cập nhật trạng thái nút xóa
  updateRemoveButtons(container, 'remove-blank-option');
  
  // Cập nhật các select với option mới
  updateBlankAnswerSelects();
}

/**
 * Cập nhật các chữ cái cho các tùy chọn blank
 */
function updateBlankOptionLetters() {
  const optionItems = document.querySelectorAll('#blankOptionsContainer .blank-option-item');
  
  optionItems.forEach((item, index) => {
    const letterSpan = item.querySelector('.w-10.text-center span');
    if (letterSpan) {
      letterSpan.textContent = `${String.fromCharCode(65 + index)}.`;
    }
  });
}

/**
 * Thêm một chỗ trống mới cho câu hỏi điền vào chỗ trống nhiều lựa chọn
 */
function addBlank() {
  const container = document.getElementById('blanksContainer');
  
  // Kiểm tra xem container có tồn tại không
  if (!container) {
    console.error("Container 'blanksContainer' không tồn tại");
    return;
  }
  
  const blankCount = container.querySelectorAll('.flex.items-center.gap-2.mb-3').length;
  
  // Tạo một div mới cho blank
  const blankDiv = document.createElement('div');
  blankDiv.className = 'flex items-center gap-2 mb-3';
  
  // Tạo phần nhập số blank
  const blankNumberDiv = document.createElement('div');
  blankNumberDiv.className = 'w-24 flex items-center';
  
  const blankLabel = document.createElement('span');
  blankLabel.className = 'mr-1 font-medium';
  blankLabel.textContent = 'Blank';
  
  const blankNumberInput = document.createElement('input');
  blankNumberInput.type = 'number';
  blankNumberInput.name = 'blankNumbers[]';
  blankNumberInput.value = blankCount + 1;
  blankNumberInput.min = '1';
  blankNumberInput.className = 'w-12 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500';
  
  const colonSpan = document.createElement('span');
  colonSpan.className = 'ml-1';
  colonSpan.textContent = ':';
  
  blankNumberDiv.appendChild(blankLabel);
  blankNumberDiv.appendChild(blankNumberInput);
  blankNumberDiv.appendChild(colonSpan);
  
  // Tạo select cho đáp án
  const blankSelect = document.createElement('select');
  blankSelect.name = 'blankAnswers[]'; // Sửa thành mảng để phù hợp với backend
  blankSelect.className = 'rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500';
  
  // Option mặc định
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.disabled = true;
  defaultOption.selected = true;
  defaultOption.textContent = 'Select correct answer';
  blankSelect.appendChild(defaultOption);
  
  // Tạo nút xóa
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'text-red-600 hover:text-red-900 remove-blank';
  removeBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
    </svg>
  `;
  
  removeBtn.addEventListener('click', function() {
    container.removeChild(blankDiv);
    updateRemoveButtons(container, 'remove-blank');
  });
  
  // Thêm tất cả các phần tử vào div chính
  blankDiv.appendChild(blankNumberDiv);
  blankDiv.appendChild(blankSelect);
  blankDiv.appendChild(removeBtn);
  
  // Thêm div vào container
  container.appendChild(blankDiv);
  
  // Cập nhật các select với các option hiện tại
  updateBlankAnswerSelects();
  
  // Cập nhật trạng thái nút xóa
  updateRemoveButtons(container, 'remove-blank');
}

/**
 * Cập nhật trạng thái hiển thị của các nút xóa
 */
function updateRemoveButtons(container, buttonClass) {
  if (!container) return;
  
  const items = container.children;
  const removeButtons = container.querySelectorAll(`.${buttonClass}`);
  
  // Hiển thị hoặc ẩn các nút xóa dựa trên số lượng items
  if (items.length > 1) {
    removeButtons.forEach(button => {
      button.style.display = 'block';
    });
  } else {
    removeButtons.forEach(button => {
      button.style.display = 'none';
    });
  }
}

/**
 * Set up handlers for matching questions
 */
function setupMatchingHandlers() {
  const addHeadingBtn = document.getElementById('addHeadingBtn');
  const headingsContainer = document.getElementById('headingsContainer');
  const addParagraphBtn = document.getElementById('addParagraphBtn');
  const paragraphsContainer = document.getElementById('paragraphsContainer');
  const updateMatrixBtn = document.getElementById('updateMatrixBtn');
  
  if (addHeadingBtn && headingsContainer) {
    // Add heading handler
    addHeadingBtn.addEventListener('click', function() {
      console.log("Adding matching heading");
      const headingCount = headingsContainer.children.length;
      
      const headingDiv = document.createElement('div');
      headingDiv.className = 'flex items-center gap-2 mb-2';
      headingDiv.innerHTML = `
        <input type="text" name="matchingHeadings" placeholder="Heading ${headingCount + 1}" class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
        <button type="button" class="text-red-600 hover:text-red-900 remove-heading">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      `;
      
      headingsContainer.appendChild(headingDiv);
      
      // Show remove buttons if there are more than 2 headings
      if (headingsContainer.children.length > 2) {
        const removeButtons = headingsContainer.querySelectorAll('.remove-heading');
        removeButtons.forEach(function(button) {
          button.classList.remove('hidden');
        });
      }
      
      // Update matching matrix
      updateMatchingMatrix();
    });
    
    // Remove heading handler
    headingsContainer.addEventListener('click', function(e) {
      if (e.target.closest('.remove-heading')) {
        const headingDiv = e.target.closest('div');
        
        if (headingsContainer.children.length > 2) {
          headingDiv.remove();
          
          // Update heading numbers
          const headings = headingsContainer.children;
          for (let i = 0; i < headings.length; i++) {
            const textInput = headings[i].querySelector('input[type="text"]');
            textInput.placeholder = `Heading ${i + 1}`;
          }
          
          // Hide remove button if only 2 headings remain
          if (headings.length === 2) {
            headings[0].querySelector('.remove-heading').classList.add('hidden');
            headings[1].querySelector('.remove-heading').classList.add('hidden');
          }
          
          // Update matching matrix
          updateMatchingMatrix();
        }
      }
    });
  }
  
  if (addParagraphBtn && paragraphsContainer) {
    // Add paragraph handler
    addParagraphBtn.addEventListener('click', function() {
      console.log("Adding matching paragraph");
      const paragraphCount = paragraphsContainer.children.length;
      
      const paragraphDiv = document.createElement('div');
      paragraphDiv.className = 'flex items-center gap-2 mb-2';
      paragraphDiv.innerHTML = `
        <input type="text" name="matchingParagraphs" placeholder="Paragraph ${paragraphCount + 1}" class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
        <button type="button" class="text-red-600 hover:text-red-900 remove-paragraph">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      `;
      
      paragraphsContainer.appendChild(paragraphDiv);
      
      // Show remove buttons if there are more than 2 paragraphs
      if (paragraphsContainer.children.length > 2) {
        const removeButtons = paragraphsContainer.querySelectorAll('.remove-paragraph');
        removeButtons.forEach(function(button) {
          button.classList.remove('hidden');
        });
      }
      
      // Update matching matrix
      updateMatchingMatrix();
    });
    
    // Remove paragraph handler
    paragraphsContainer.addEventListener('click', function(e) {
      if (e.target.closest('.remove-paragraph')) {
        const paragraphDiv = e.target.closest('div');
        
        if (paragraphsContainer.children.length > 2) {
          paragraphDiv.remove();
          
          // Update paragraph numbers
          const paragraphs = paragraphsContainer.children;
          for (let i = 0; i < paragraphs.length; i++) {
            const textInput = paragraphs[i].querySelector('input[type="text"]');
            textInput.placeholder = `Paragraph ${i + 1}`;
          }
          
          // Hide remove button if only 2 paragraphs remain
          if (paragraphs.length === 2) {
            paragraphs[0].querySelector('.remove-paragraph').classList.add('hidden');
            paragraphs[1].querySelector('.remove-paragraph').classList.add('hidden');
          }
          
          // Update matching matrix
          updateMatchingMatrix();
        }
      }
    });
  }
  
  // Set up the matrix update button
  if (updateMatrixBtn) {
    updateMatrixBtn.addEventListener('click', updateMatchingMatrix);
  }
}

/**
 * Set up handlers for true/false/not given questions
 */
function setupTrueFalseHandlers() {
  // No specific handlers needed, just radio button selection which HTML handles
}

/**
 * Show/hide question type specific fields
 */
function toggleQuestionTypeFields() {
  const questionType = document.getElementById('questionType').value;
  
  console.log("Toggling question type fields for:", questionType);
  
  // Ẩn tất cả các phần tử liên quan đến loại câu hỏi
  document.querySelectorAll('.question-type-section').forEach(section => {
    section.classList.add('hidden');
  });
  
  // Hiển thị phần tử tương ứng với loại câu hỏi đã chọn
  if (questionType) {
    const targetSection = document.getElementById(`${questionType}Options`);
    if (targetSection) {
      targetSection.classList.remove('hidden');
      console.log(`Showing section: ${questionType}Options`);
    } else {
      console.log(`Section not found: ${questionType}Options`);
    }
    
    // Nếu là fill_blank, hiển thị container tương ứng với kiểu blank đã chọn
    if (questionType === 'fill_blank') {
      const blankStyleSelect = document.getElementById('blankStyleSelect');
      if (blankStyleSelect) {
        const selectedStyle = blankStyleSelect.value;
        
        // Ẩn tất cả các container
        const containers = [
          document.getElementById('simpleBlankContainer'),
          document.getElementById('multipleBlankContainer'),
          document.getElementById('oneWordOnlyContainer')
        ];
        
        containers.forEach(container => {
          if (container) container.style.display = 'none';
        });
        
        // Hiển thị container tương ứng
        if (selectedStyle === 'simple') {
          const simpleBlankContainer = document.getElementById('simpleBlankContainer');
          if (simpleBlankContainer) simpleBlankContainer.style.display = 'block';
        } else if (selectedStyle === 'multiple') {
          const multipleBlankContainer = document.getElementById('multipleBlankContainer');
          if (multipleBlankContainer) multipleBlankContainer.style.display = 'block';
        } else if (selectedStyle === 'one_word_only') {
          const oneWordOnlyContainer = document.getElementById('oneWordOnlyContainer');
          if (oneWordOnlyContainer) oneWordOnlyContainer.style.display = 'block';
        }
        
        console.log(`Showing blank style: ${selectedStyle}`);
      }
    }
  }
}

/**
 * Initialize the matching question form
 */
function initMatchingQuestion() {
  console.log("Initializing matching question form");
  // Kiểm tra xem các container cần thiết có tồn tại không
  const headingsContainer = document.getElementById('headingsContainer');
  const paragraphsContainer = document.getElementById('paragraphsContainer');
  const matchingMatrixContainer = document.getElementById('matchingMatrixContainer');
  
  if (!headingsContainer || !paragraphsContainer || !matchingMatrixContainer) {
    console.error("Missing required containers for matching question:", {
      headingsContainer: !!headingsContainer,
      paragraphsContainer: !!paragraphsContainer,
      matchingMatrixContainer: !!matchingMatrixContainer
    });
    
    // Hiển thị thông báo lỗi trong container matrix nếu có
    if (matchingMatrixContainer) {
      matchingMatrixContainer.innerHTML = `
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Missing required containers for matching question. Please refresh the page and try again.</p>
        </div>
      `;
    }
    return;
  }
  
  // Add hidden inputs for JSON data
  const form = document.querySelector('form');
  if (!form) {
    console.error("Form not found");
    matchingMatrixContainer.innerHTML = `
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <p>Form not found. Please refresh the page and try again.</p>
      </div>
    `;
    return;
  }
  
  // Tạo các hidden inputs cần thiết
  createHiddenInputsForMatching(form);
  
  // Make sure we have at least one heading and paragraph input
  ensureMinimumInputs(headingsContainer, 'matchingHeadings', 'Heading');
  ensureMinimumInputs(paragraphsContainer, 'matchingParagraphs', 'Paragraph');
  
  // Add event listeners to all inputs
  document.querySelectorAll('input[name="matchingHeadings"]').forEach(input => {
    input.removeEventListener('input', updateMatchingMatrix); // Remove existing to avoid duplicates
    input.addEventListener('input', updateMatchingMatrix);
  });
  
  document.querySelectorAll('input[name="matchingParagraphs"]').forEach(input => {
    input.removeEventListener('input', updateMatchingMatrix); // Remove existing to avoid duplicates
    input.addEventListener('input', updateMatchingMatrix);
  });
  
  // Thêm event listener cho matchingTypeSelect
  const matchingTypeSelect = document.getElementById('matchingTypeSelect');
  if (matchingTypeSelect) {
    matchingTypeSelect.addEventListener('change', updateMatchingMatrix);
  }
  
  // Cập nhật ma trận khi khởi tạo
  updateMatchingMatrix();
}

/**
 * Tạo các hidden inputs cần thiết cho matching question
 */
function createHiddenInputsForMatching(form) {
  console.log("Creating hidden inputs for matching question");
  
  // Xóa các hidden inputs cũ nếu có
  const existingInputs = form.querySelectorAll('input[type="hidden"][id$="Input"]');
  existingInputs.forEach(input => input.remove());
  
  // Tạo input cho matchingData
  const matchingDataInput = document.createElement('input');
  matchingDataInput.type = 'hidden';
  matchingDataInput.id = 'matchingDataInput';
  matchingDataInput.name = 'matchingData';
  matchingDataInput.value = JSON.stringify({ type: 'one_to_one', selections: {} });
  form.appendChild(matchingDataInput);
  
  // Tạo input cho headings
  const headingsInput = document.createElement('input');
  headingsInput.type = 'hidden';
  headingsInput.id = 'headingsInput';
  headingsInput.name = 'headings';
  headingsInput.value = JSON.stringify([]);
  form.appendChild(headingsInput);
  
  // Tạo input cho paragraphs
  const paragraphsInput = document.createElement('input');
  paragraphsInput.type = 'hidden';
  paragraphsInput.id = 'paragraphsInput';
  paragraphsInput.name = 'paragraphs';
  paragraphsInput.value = JSON.stringify([]);
  form.appendChild(paragraphsInput);
  
  console.log("Hidden inputs created:", {
    matchingDataInput: !!document.getElementById('matchingDataInput'),
    headingsInput: !!document.getElementById('headingsInput'),
    paragraphsInput: !!document.getElementById('paragraphsInput')
  });
}

/**
 * Cập nhật ma trận matching
 */
function updateMatchingMatrix() {
  console.log("Updating matching matrix");
  
  const headings = Array.from(document.querySelectorAll('input[name="matchingHeadings"]'))
    .map(input => input.value.trim())
    .filter(value => value);
    
  const paragraphs = Array.from(document.querySelectorAll('input[name="matchingParagraphs"]'))
    .map(input => input.value.trim())
    .filter(value => value);
    
  const matchingMatrixContainer = document.getElementById('matchingMatrixContainer');
  const matchingTypeSelect = document.getElementById('matchingTypeSelect');
  const matchingType = matchingTypeSelect ? matchingTypeSelect.value : 'one_to_one';
  
  if (!matchingMatrixContainer) {
    console.error("Matching matrix container not found");
    return;
  }
  
  if (headings.length === 0 || paragraphs.length === 0) {
    matchingMatrixContainer.innerHTML = `
      <div class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
        <p>Please add at least one heading and one paragraph to create the matching matrix.</p>
      </div>
    `;
    return;
  }
  
  // Lưu trữ các giá trị đã chọn trước đó (nếu có)
  const existingSelections = {};
  document.querySelectorAll('select[name^="matchingMatrix"]').forEach(select => {
    const paragraphIndex = select.dataset.paragraphIndex;
    if (paragraphIndex && select.value) {
      existingSelections[paragraphIndex] = select.value;
    }
  });
  
  // Tạo ma trận matching mới
  let html = `
    <div class="bg-blue-50 p-4 rounded-md border border-blue-200 mb-4">
      <h4 class="text-md font-medium text-blue-800 mb-2">Current matching type: ${getMatchingTypeText(matchingType)}</h4>
      <p class="text-sm text-gray-600">Set the correct answer for each paragraph by selecting the corresponding heading.</p>
  `;
  
  if (matchingType === 'many_to_one') {
    html += `<p class="text-sm text-blue-600 mt-2">Note: Multiple paragraphs can connect to the same heading.</p>`;
  } else if (matchingType === 'not_all_used') {
    html += `<p class="text-sm text-blue-600 mt-2">Note: Some headings may not be used (select "Not Used").</p>`;
  }
  
  html += `</div>`;
  
  // Tạo bảng ma trận
  html += `<div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paragraph</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matching Heading</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
  `;
  
  // Tạo các hàng cho mỗi paragraph
  paragraphs.forEach((paragraph, pIndex) => {
    html += `
      <tr>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
           ${paragraph}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <select name="matchingMatrix[${pIndex}]" data-paragraph-index="${pIndex}" class="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            <option value="">-- Select heading --</option>
    `;
    
    // Thêm tùy chọn "Not Used" cho dạng not_all_used
    if (matchingType === 'not_all_used') {
      html += `<option value="not_used" ${existingSelections[pIndex] === 'not_used' ? 'selected' : ''}>Not Used</option>`;
    }
    
    // Thêm các tùy chọn heading
    headings.forEach((heading, hIndex) => {
      const isSelected = existingSelections[pIndex] === hIndex.toString();
      html += `<option value="${hIndex}" ${isSelected ? 'selected' : ''}>${heading}</option>`;
    });
    
    html += `
          </select>
        </td>
      </tr>
    `;
  });
  
  html += `
      </tbody>
    </table>
  </div>
  `;
  
  // Thêm thông tin về các heading không được sử dụng (cho dạng not_all_used)
  if (matchingType === 'not_all_used') {
    html += `
      <div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <h4 class="text-md font-medium text-yellow-800 mb-2">Headings may not be used</h4>
        <p class="text-sm text-gray-600 mb-2">The following headings may not be connected to any paragraph:</p>
        <ul class="list-disc pl-5 text-sm text-gray-600">
    `;
    
    headings.forEach((heading, hIndex) => {
      html += `<li>${heading}</li>`;
    });
    
    html += `
        </ul>
      </div>
    `;
  }
  
  // Cập nhật container
  matchingMatrixContainer.innerHTML = html;
  
  // Thêm event listener cho các select
  document.querySelectorAll('select[name^="matchingMatrix"]').forEach(select => {
    select.addEventListener('change', updateMatchingData);
  });
  
  // Cập nhật dữ liệu matching
  updateMatchingData();
  
  // Cập nhật hidden inputs
  updateHeadingsAndParagraphsInputs();
}

/**
 * Cập nhật dữ liệu matching
 */
function updateMatchingData() {
  console.log("Updating matching data");
  
  // Lấy dữ liệu từ các input
  const headings = Array.from(document.querySelectorAll('input[name="matchingHeadings"]'))
    .map(input => input.value.trim())
    .filter(value => value);
    
  const paragraphs = Array.from(document.querySelectorAll('input[name="matchingParagraphs"]'))
    .map(input => input.value.trim())
    .filter(value => value);
  
  // Lấy loại matching
  const matchingTypeSelect = document.getElementById('matchingTypeSelect');
  const matchingType = matchingTypeSelect ? matchingTypeSelect.value : 'one_to_one';
  
  // Lấy tất cả các lựa chọn từ ma trận
  const selections = {};
  document.querySelectorAll('select[name^="matchingMatrix"]').forEach(select => {
    const paragraphIndex = select.dataset.paragraphIndex;
    if (paragraphIndex && select.value) {
      selections[paragraphIndex] = select.value;
    }
  });
  
  // Cập nhật hidden inputs
  const headingsInput = document.getElementById('headingsInput');
  const paragraphsInput = document.getElementById('paragraphsInput');
  const matchingDataInput = document.getElementById('matchingDataInput');
  
  if (headingsInput) {
    headingsInput.value = JSON.stringify(headings);
    console.log("Updated headingsInput:", headingsInput.value);
  }
  
  if (paragraphsInput) {
    paragraphsInput.value = JSON.stringify(paragraphs);
    console.log("Updated paragraphsInput:", paragraphsInput.value);
  }
  
  if (matchingDataInput) {
    const matchingData = {
      type: matchingType,
      selections: selections
    };
    matchingDataInput.value = JSON.stringify(matchingData);
    console.log("Updated matchingDataInput:", matchingDataInput.value);
  }
}

/**
 * Cập nhật hidden inputs cho headings và paragraphs
 */
function updateHeadingsAndParagraphsInputs() {
  console.log("Updating headings and paragraphs inputs");
  
  const headings = Array.from(document.querySelectorAll('input[name="matchingHeadings"]'))
    .map(input => input.value.trim())
    .filter(value => value);
    
  const paragraphs = Array.from(document.querySelectorAll('input[name="matchingParagraphs"]'))
    .map(input => input.value.trim())
    .filter(value => value);
  
  const headingsInput = document.getElementById('headingsInput');
  const paragraphsInput = document.getElementById('paragraphsInput');
  
  if (headingsInput) {
    headingsInput.value = JSON.stringify(headings);
    console.log("Updated headingsInput:", headingsInput.value);
  } else {
    console.error("headingsInput not found");
  }
  
  if (paragraphsInput) {
    paragraphsInput.value = JSON.stringify(paragraphs);
    console.log("Updated paragraphsInput:", paragraphsInput.value);
  } else {
    console.error("paragraphsInput not found");
  }
  
  // Kiểm tra xem các input đã được cập nhật chưa
  if (!headingsInput || !paragraphsInput) {
    const form = document.querySelector('form');
    if (form) {
      createHiddenInputsForMatching(form);
    }
  }
}

/**
 * Hàm lấy text mô tả loại matching
 */
function getMatchingTypeText(type) {
  switch (type) {
    case 'one_to_one':
      return 'One to One (each paragraph connects to a single heading)';
    case 'not_all_used':
      return 'Not All Used (some headings may not be used)';
    case 'many_to_one':
      return 'Many to One (multiple paragraphs can connect to the same heading)';
    default:
      return 'Unknown';
  }
}

/**
 * Đảm bảo có ít nhất một input
 */
function ensureMinimumInputs(container, inputName, labelText) {
  if (!container) return;
  
  const inputs = container.querySelectorAll(`input[name="${inputName}"]`);
  if (inputs.length === 0) {
    addInput(container, inputName, labelText, 1);
  }
}

/**
 * Thêm input mới
 */
function addInput(container, inputName, labelText, index) {
  if (!container) return;
  
  const inputDiv = document.createElement('div');
  inputDiv.className = 'flex items-center gap-2 mb-2';
  
  inputDiv.innerHTML = `
    <input type="text" name="${inputName}" placeholder="${labelText} ${index}" class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
    <button type="button" class="text-red-600 hover:text-red-900 remove-input">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    </button>
  `;
  
  container.appendChild(inputDiv);
  
  // Thêm event listener cho nút xóa
  const removeBtn = inputDiv.querySelector('.remove-input');
  if (removeBtn) {
    removeBtn.addEventListener('click', function() {
      inputDiv.remove();
      updateMatchingMatrix();
    });
  }
  
  // Thêm event listener cho input
  const input = inputDiv.querySelector(`input[name="${inputName}"]`);
  if (input) {
    input.addEventListener('input', updateMatchingMatrix);
  }
  
  return inputDiv;
}

// Thêm event listeners cho các nút thêm heading và paragraph
document.addEventListener('DOMContentLoaded', function() {
  const addHeadingBtn = document.getElementById('addHeadingBtn');
  const addParagraphBtn = document.getElementById('addParagraphBtn');
  const headingsContainer = document.getElementById('headingsContainer');
  const paragraphsContainer = document.getElementById('paragraphsContainer');
  
  if (addHeadingBtn && headingsContainer) {
    addHeadingBtn.addEventListener('click', function() {
      const headingInputs = headingsContainer.querySelectorAll('input[name="matchingHeadings"]');
      addInput(headingsContainer, 'matchingHeadings', 'Heading', headingInputs.length + 1);
      updateMatchingMatrix();
    });
  }
  
  if (addParagraphBtn && paragraphsContainer) {
    addParagraphBtn.addEventListener('click', function() {
      const paragraphInputs = paragraphsContainer.querySelectorAll('input[name="matchingParagraphs"]');
      addInput(paragraphsContainer, 'matchingParagraphs', 'Paragraph', paragraphInputs.length + 1);
      updateMatchingMatrix();
    });
  }
  
  // Khởi tạo form matching khi chọn loại câu hỏi matching
  const questionTypeSelect = document.getElementById('questionType');
  if (questionTypeSelect) {
    questionTypeSelect.addEventListener('change', function() {
      if (this.value === 'matching') {
        setTimeout(initMatchingQuestion, 100); // Đợi một chút để DOM cập nhật
      }
    });
  }
  
  // Khởi tạo form matching nếu đã chọn loại câu hỏi matching
  if (questionTypeSelect && questionTypeSelect.value === 'matching') {
    setTimeout(initMatchingQuestion, 100);
  }
  
  // Thêm xử lý cho chức năng tạo nhiều câu hỏi
  setupMultipleQuestionsFeature();
});

// Thêm vào hàm formSubmitHandler để kiểm tra và cập nhật dữ liệu matching trước khi submit
function formSubmitHandler(event) {
  const questionType = document.getElementById('questionType').value;
  
  if (questionType === 'matching') {
    // Cập nhật dữ liệu matching trước khi submit
    updateMatchingData();
    
    // Kiểm tra xem các hidden inputs có tồn tại không
    const headingsInput = document.getElementById('headingsInput');
    const paragraphsInput = document.getElementById('paragraphsInput');
    const matchingDataInput = document.getElementById('matchingDataInput');
    
    if (!headingsInput || !paragraphsInput || !matchingDataInput) {
      console.error("Hidden inputs not found:", {
        headingsInput: !!headingsInput,
        paragraphsInput: !!paragraphsInput,
        matchingDataInput: !!matchingDataInput
      });
      
      // Tạo lại các hidden inputs nếu không tìm thấy
      const form = document.querySelector('form');
      if (form) {
        createHiddenInputsForMatching(form);
        updateMatchingData();
      } else {
        event.preventDefault();
        alert('Form not found. Please refresh the page and try again.');
        return;
      }
    }
    
    // Kiểm tra xem có đủ dữ liệu không
    try {
      // Nếu dữ liệu đang trống, thử lấy từ các trường khác
      if (!headingsInput.value || headingsInput.value === '[]') {
        const headingsFromInput = document.querySelector('input[name="matchingHeadings"]');
        if (headingsFromInput && headingsFromInput.value) {
          const headingsArray = headingsFromInput.value.split(',').map(h => h.trim()).filter(h => h);
          headingsInput.value = JSON.stringify(headingsArray);
          console.log("Updated headingsInput from input:", headingsInput.value);
        }
      }
      
      if (!paragraphsInput.value || paragraphsInput.value === '[]') {
        const paragraphsFromInput = document.querySelector('input[name="matchingParagraphs"]');
        if (paragraphsFromInput && paragraphsFromInput.value) {
          const paragraphsArray = paragraphsFromInput.value.split(',').map(p => p.trim()).filter(p => p);
          paragraphsInput.value = JSON.stringify(paragraphsArray);
          console.log("Updated paragraphsInput from input:", paragraphsInput.value);
        }
      }
      
      if (!matchingDataInput.value || matchingDataInput.value === '{}') {
        const matchingType = document.getElementById('matchingTypeSelect')?.value || 'one_to_one';
        const matrixSelects = document.querySelectorAll('select[name^="matchingMatrix"]');
        const selections = {};
        
        if (matrixSelects.length === 0) {
          // Nếu không có select, thử lấy từ matchingMatrix array
          const matchingMatrix = document.getElementsByName('matchingMatrix[]');
          if (matchingMatrix.length > 0) {
            Array.from(matchingMatrix).forEach((value, index) => {
              if (value) {
                selections[index] = value;
              }
            });
          }
        } else {
          matrixSelects.forEach((select) => {
            const paragraphIndex = select.dataset.paragraphIndex;
            if (paragraphIndex && select.value) {
              selections[paragraphIndex] = select.value;
            }
          });
        }
        
        matchingDataInput.value = JSON.stringify({
          type: matchingType,
          selections: selections
        });
        console.log("Updated matchingDataInput from selects:", matchingDataInput.value);
      }
      
      // Kiểm tra dữ liệu cuối cùng
      const headings = JSON.parse(headingsInput.value);
      const paragraphs = JSON.parse(paragraphsInput.value);
      const matchingData = JSON.parse(matchingDataInput.value);
      
      console.log("Form submission data:", {
        headings,
        paragraphs,
        matchingData
      });
      
      if (headings.length === 0 || paragraphs.length === 0) {
        event.preventDefault();
        alert('Please add at least one heading and one paragraph.');
        return;
      }
      
      // Nếu dữ liệu vẫn trống, thử lấy từ form data
      if (Object.keys(matchingData.selections).length === 0) {
        const formData = new FormData(event.target);
        console.log("Form data:", Object.fromEntries(formData));
        
        // Nếu có matchingMatrix trong form data
        const matchingMatrix = formData.getAll('matchingMatrix[]');
        if (matchingMatrix.length > 0) {
          const selections = {};
          matchingMatrix.forEach((value, index) => {
            if (value) {
              selections[index] = value;
            }
          });
          
          matchingDataInput.value = JSON.stringify({
            type: matchingType,
            selections: selections
          });
          console.log("Updated matchingDataInput from form data:", matchingDataInput.value);
        }
      }
    } catch (e) {
      console.error("Error parsing matching data:", e);
      event.preventDefault();
      alert('Invalid matching data. Please refresh the page and try again.');
      return;
  }
}

  // Kiểm tra nếu đang sử dụng chức năng tạo nhiều câu hỏi
  const createMultipleCheckbox = document.getElementById('createMultipleCheckbox');
  if (createMultipleCheckbox && createMultipleCheckbox.checked) {
    // Ngăn form submit mặc định
    event.preventDefault();
    
    // Thêm câu hỏi hiện tại vào hàng đợi
    addCurrentQuestionToQueue();
  
    // Nếu người dùng nhấn nút "Submit All Questions", thì sẽ không vào đây
    // vì nút đó sẽ có xử lý riêng để gửi tất cả câu hỏi
  }
}

/**
 * Thiết lập chức năng tạo nhiều câu hỏi
 */
function setupMultipleQuestionsFeature() {
  const createMultipleCheckbox = document.getElementById('createMultipleCheckbox');
  const multipleQuestionsControls = document.getElementById('multipleQuestionsControls');
  const addToQueueBtn = document.getElementById('addToQueueBtn');
  const questionForm = document.getElementById('questionForm');
  
  // Khởi tạo mảng lưu trữ câu hỏi
  window.questionQueue = window.questionQueue || [];
  
  // Hiển thị/ẩn các điều khiển tạo nhiều câu hỏi
  if (createMultipleCheckbox) {
    createMultipleCheckbox.addEventListener('change', function() {
      if (this.checked) {
        multipleQuestionsControls.classList.remove('hidden');
        
        // Thêm nút "Submit All Questions" nếu chưa có
        if (!document.getElementById('submitAllQuestionsBtn')) {
          const submitBtn = document.createElement('button');
          submitBtn.id = 'submitAllQuestionsBtn';
          submitBtn.type = 'button';
          submitBtn.className = 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition duration-200';
          submitBtn.textContent = 'Submit All Questions';
          submitBtn.addEventListener('click', submitAllQuestions);
          multipleQuestionsControls.appendChild(submitBtn);
        }
        
        // Thêm khu vực hiển thị danh sách câu hỏi
        if (!document.getElementById('questionQueueContainer')) {
          const queueContainer = document.createElement('div');
          queueContainer.id = 'questionQueueContainer';
          queueContainer.className = 'mt-4 p-4 bg-gray-50 rounded-md border border-gray-200';
          queueContainer.innerHTML = `
            <h3 class="text-lg font-medium text-gray-900 mb-3">Question Queue</h3>
            <div id="questionQueueList" class="space-y-2">
              <p class="text-sm text-gray-500">No questions in the queue</p>
            </div>
          `;
          questionForm.parentNode.insertBefore(queueContainer, questionForm.nextSibling);
        }
        
        // Thay đổi nút submit form thành "Add to Queue"
        const submitButton = questionForm.querySelector('button[type="submit"]');
        if (submitButton) {
          submitButton.textContent = 'Add to Queue and Create New Question';
        }
      } else {
        multipleQuestionsControls.classList.add('hidden');
        
        // Xóa khu vực hiển thị danh sách câu hỏi
        const queueContainer = document.getElementById('questionQueueContainer');
        if (queueContainer) {
          queueContainer.remove();
        }
        
        // Đổi lại nút submit form
        const submitButton = questionForm.querySelector('button[type="submit"]');
        if (submitButton) {
          submitButton.textContent = 'Create Question';
        }
    }
  });
}

  // Xử lý nút "Add to Queue"
  if (addToQueueBtn) {
    addToQueueBtn.addEventListener('click', function() {
      addCurrentQuestionToQueue();
    });
  }
}

/**
 * Thêm câu hỏi hiện tại vào hàng đợi
 */
function addCurrentQuestionToQueue() {
  // Kiểm tra dữ liệu form
  const questionType = document.getElementById('questionType').value;
  const questionText = document.getElementById('questionText').value;
  
  if (!questionType || !questionText) {
    alert('Please fill in all question information');
      return;
    }
    
  // Cập nhật dữ liệu matching nếu cần
  if (questionType === 'matching') {
    updateMatchingData();
  }
  
  // Thu thập dữ liệu form
  const formData = new FormData(document.getElementById('questionForm'));
  const questionData = Object.fromEntries(formData.entries());
  
  // Xử lý các trường đặc biệt
  processSpecialFields(questionData, formData);
  
  // Thêm vào hàng đợi
  window.questionQueue = window.questionQueue || [];
  window.questionQueue.push(questionData);
  
  // Hiển thị trong danh sách
  updateQuestionQueueDisplay();
  
  // Reset form cho câu hỏi tiếp theo
  resetFormForNextQuestion();
  
  // Thông báo
  alert('Question added to the queue!');
}

/**
 * Xử lý các trường đặc biệt trong form data
 */
function processSpecialFields(questionData, formData) {
  const questionType = questionData.questionType;
  
  // Xử lý các trường đặc biệt theo loại câu hỏi
  switch (questionType) {
    case 'multiple_choice':
      // Xử lý options và correctAnswer
      questionData.options = formData.getAll('options').filter(opt => opt.trim());
      
      if (questionData.multipleAnswers === 'on') {
        questionData.correctAnswers = formData.getAll('correctAnswers');
        if (questionData.correctAnswers.length === 0) {
          // Nếu không có correctAnswers, thử lấy từ correctAnswer
          const correctAnswerRadio = document.querySelector('input[name="correctAnswer"]:checked');
          if (correctAnswerRadio) {
            questionData.correctAnswers = [correctAnswerRadio.value];
          }
        }
      }
      break;
      
    case 'fill_blank':
      // Xử lý theo blankStyle
      if (questionData.blankStyle === 'multiple') {
        questionData.blankOptions = formData.getAll('blankOptions').filter(opt => opt.trim());
        questionData.blankAnswers = formData.getAll('blankAnswers');
        questionData.blankNumbers = formData.getAll('blankNumbers[]');
      } else if (questionData.blankStyle === 'one_word_only') {
        // Lấy dữ liệu từ form
        const oneWordAnswers = formData.getAll('oneWordAnswers[]').filter(ans => ans.trim());
        const blankPositions = formData.getAll('blankPositions[]');
        const wordLimits = formData.getAll('wordLimits[]');
        
        // Tạo mảng dữ liệu kết hợp
        const limitedWordsData = [];
        
        // Tạo correctAnswer dạng object với vị trí là key
        const correctAnswer = {};
        
        // Tạo blankNumbers để thỏa mãn validator
        const blankNumbers = [];
        
        for (let i = 0; i < Math.min(oneWordAnswers.length, blankPositions.length, wordLimits.length); i++) {
          const position = blankPositions[i];
          const answer = oneWordAnswers[i];
          const wordLimit = parseInt(wordLimits[i], 10);
          
          // Thêm vào correctAnswer - vị trí là key, index của đáp án là value
          correctAnswer[position] = i;
          
          // Thêm vào blankNumbers để thỏa mãn validator
          blankNumbers.push(position);
          
          // Thêm vào limitedWordsData
          limitedWordsData.push({
            answer: answer,
            position: parseInt(position, 10),
            wordLimit: wordLimit
          });
        }
        
        // Lưu các mảng dữ liệu
        questionData.oneWordAnswers = oneWordAnswers;
        questionData.wordLimits = wordLimits.map(limit => parseInt(limit, 10));
        questionData.limitedWordsData = limitedWordsData;
        questionData.correctAnswer = correctAnswer;
        questionData.blankNumbers = blankNumbers; // Thêm blankNumbers để thỏa mãn validator
      } else {
        // simple
        questionData.acceptableAnswers = formData.getAll('acceptableAnswers').filter(ans => ans.trim());
      }
      break;
      
    case 'matching':
      // Lấy dữ liệu từ hidden inputs
      const headingsInput = document.getElementById('headingsInput');
      const paragraphsInput = document.getElementById('paragraphsInput');
      const matchingDataInput = document.getElementById('matchingDataInput');
      
      if (headingsInput) questionData.matchingHeadings = JSON.parse(headingsInput.value);
      if (paragraphsInput) questionData.matchingParagraphs = JSON.parse(paragraphsInput.value);
      if (matchingDataInput) questionData.matchingData = JSON.parse(matchingDataInput.value);
      break;
      
    case 'short_answer':
      // Xử lý acceptableShortAnswers
      questionData.acceptableShortAnswers = formData.getAll('acceptableShortAnswers').filter(ans => ans.trim());
      break;
  }
}

/**
 * Cập nhật hiển thị danh sách câu hỏi
 */
function updateQuestionQueueDisplay() {
  const queueList = document.getElementById('questionQueueList');
  if (!queueList) return;
  
  if (!window.questionQueue || window.questionQueue.length === 0) {
    queueList.innerHTML = '<p class="text-sm text-gray-500">No questions in the queue</p>';
    return;
  }
  
  let html = '';
  window.questionQueue.forEach((question, index) => {
    const typeText = getQuestionTypeText(question.questionType);
    html += `
      <div class="p-3 bg-white rounded-md border border-gray-200 flex justify-between items-center">
        <div>
          <span class="font-medium">#${index + 1}: ${typeText}</span>
          <p class="text-sm text-gray-600 truncate max-w-md">${question.questionText}</p>
        </div>
        <button type="button" class="text-red-600 hover:text-red-900" onclick="removeQuestionFromQueue(${index})">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
      </div>
    `;
  });
  
  queueList.innerHTML = html;
}

/**
 * Lấy text mô tả loại câu hỏi
 */
function getQuestionTypeText(type) {
  switch (type) {
    case 'multiple_choice':
      return 'Multiple choice';
    case 'fill_blank':
      return 'Fill in the blank';
    case 'matching':
      return 'Matching';
    case 'true_false_not_given':
      return 'True/False/Not Given';
    case 'short_answer':
      return 'Short answer';
    default:
      return 'Unknown';
  }
  }
  
/**
 * Xóa câu hỏi khỏi hàng đợi
 */
function removeQuestionFromQueue(index) {
  if (window.questionQueue && window.questionQueue[index]) {
    if (confirm('Are you sure you want to remove this question from the queue?')) {
      window.questionQueue.splice(index, 1);
      updateQuestionQueueDisplay();
    }
  }
}

/**
 * Reset form cho câu hỏi tiếp theo
 */
function resetFormForNextQuestion() {
  // Lưu lại một số giá trị cần giữ
  const passageId = document.querySelector('form').action.split('/').pop();
  const questionType = document.getElementById('questionType').value;
  const order = parseInt(document.getElementById('order').value) + 1;
  
  // Reset form
  document.getElementById('questionForm').reset();
  
  // Khôi phục lại các giá trị đã lưu
  document.getElementById('questionType').value = questionType;
  document.getElementById('order').value = order;
  
  // Hiển thị lại section tương ứng với loại câu hỏi
  showQuestionTypeSection(questionType);
      
  // Nếu là matching, khởi tạo lại
  if (questionType === 'matching') {
    setTimeout(initMatchingQuestion, 100);
  }
}

/**
 * Gửi tất cả câu hỏi
 */
function submitAllQuestions() {
  if (!window.questionQueue || window.questionQueue.length === 0) {
    alert('No questions in the queue');
    return;
  }
  
  // Thêm câu hỏi hiện tại vào hàng đợi nếu form có dữ liệu
  const questionType = document.getElementById('questionType').value;
  const questionText = document.getElementById('questionText').value;
    
  if (questionType && questionText) {
    if (confirm('Do you want to add the current question to the queue before sending?')) {
      addCurrentQuestionToQueue();
      }
    }
  
  // Lấy URL từ form
  const form = document.getElementById('questionForm');
  const url = form.action;
  
  // Hiển thị thông báo đang xử lý
  const processingMessage = document.createElement('div');
  processingMessage.id = 'processingMessage';
  processingMessage.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  processingMessage.innerHTML = `
    <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Processing</h3>
      <div class="flex items-center">
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p id="processingStatus">Sending question 1/${window.questionQueue.length}...</p>
      </div>
      <div class="mt-4 w-full bg-gray-200 rounded-full h-2.5">
        <div id="processingProgress" class="bg-blue-600 h-2.5 rounded-full" style="width: 0%"></div>
      </div>
    </div>
    `;
  document.body.appendChild(processingMessage);
    
  // Gửi từng câu hỏi một
  submitQuestionsSequentially(url, 0);
}

/**
 * Gửi các câu hỏi tuần tự
 */
function submitQuestionsSequentially(url, index) {
  if (index >= window.questionQueue.length) {
    // Đã gửi xong tất cả
    document.getElementById('processingMessage').remove();
    alert('All questions sent successfully!');
    window.location.reload();
          return;
        }
        
  // Cập nhật trạng thái
  document.getElementById('processingStatus').textContent = `Sending question ${index + 1}/${window.questionQueue.length}...`;
  document.getElementById('processingProgress').style.width = `${(index / window.questionQueue.length) * 100}%`;
  
  // Lấy dữ liệu câu hỏi
  const questionData = window.questionQueue[index];
  
  // Gửi request
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
    },
    body: JSON.stringify(questionData)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.text(); // Thay vì response.json()
  })
  .then(html => {
    // Thay thế toàn bộ nội dung của form
    document.getElementById('questionForm').closest('.container').innerHTML = html;
    console.log(`Question submitted successfully`);
  })
  .catch(error => {
    console.error(`Error submitting question:`, error);
    document.getElementById('processingMessage').remove();
    alert(`Error sending question: ${error.message}`);
  });
}
  
/**
 * Hiển thị section tương ứng với loại câu hỏi
 */
function showQuestionTypeSection(type) {
  // Ẩn tất cả các section
  document.querySelectorAll('.question-type-section').forEach(section => {
    section.classList.add('hidden');
  });
  
  // Hiển thị section tương ứng
  const targetSection = document.getElementById(`${type}Options`);
  if (targetSection) {
    targetSection.classList.remove('hidden');
  }
  
  // Xử lý các trường hợp đặc biệt
  if (type === 'multiple_choice') {
    document.getElementById('multipleChoiceSettings').classList.remove('hidden');
        }
      }

      /**
 * Toggle between different fill blank styles
 */
function toggleFillBlankStyle() {
  const blankStyleSelect = document.getElementById('blankStyleSelect');
  const simpleBlankContainer = document.getElementById('simpleBlankContainer');
  const multipleBlankContainer = document.getElementById('multipleBlankContainer');
  const oneWordOnlyContainer = document.getElementById('oneWordOnlyContainer');
  
  if (!blankStyleSelect) return;
  
  const selectedStyle = blankStyleSelect.value;
  console.log("Selected fill blank style:", selectedStyle);
  
  // Ẩn tất cả các container
  if (simpleBlankContainer) simpleBlankContainer.style.display = 'none';
  if (multipleBlankContainer) multipleBlankContainer.style.display = 'none';
  if (oneWordOnlyContainer) oneWordOnlyContainer.style.display = 'none';
  
  // Hiển thị container tương ứng
  switch (selectedStyle) {
    case 'simple':
      if (simpleBlankContainer) simpleBlankContainer.style.display = 'block';
      break;
    case 'multiple':
      if (multipleBlankContainer) {
        multipleBlankContainer.style.display = 'block';
        // Khởi tạo các tùy chọn mặc định nếu chưa có
        initializeBlankOptions();
        // Thêm một blank mặc định nếu chưa có
        const blanksContainer = document.getElementById('blanksContainer');
        if (blanksContainer && blanksContainer.children.length === 0) {
          addBlank();
        }
        // Cập nhật các select với các option hiện tại
        updateBlankAnswerSelects();
      }
      break;
    case 'one_word_only':
      if (oneWordOnlyContainer) {
        oneWordOnlyContainer.style.display = 'block';
        initOneWordOnly(); // Khởi tạo phần One Word Only
      }
      break;
  }
}

/**
 * Thêm một ô trống mới cho kiểu one_word_only
 */
function addOneWordBlank() {
  const container = document.getElementById('oneWordBlanksContainer');
  const blankCount = container.querySelectorAll('.one-word-blank-item').length;
  
  // Tạo một div mới cho ô trống
  const blankDiv = document.createElement('div');
  blankDiv.className = 'flex items-center gap-2 mb-3 one-word-blank-item';
  
  // Tạo phần nhập vị trí blank
  const positionDiv = document.createElement('div');
  positionDiv.className = 'w-24 flex items-center';
  
  const labelSpan = document.createElement('span');
  labelSpan.className = 'mr-1 font-medium';
  labelSpan.textContent = 'Blank:';
  
  const positionInput = document.createElement('input');
  positionInput.type = 'number';
  positionInput.name = 'blankPositions[]';
  positionInput.value = blankCount + 1;
  positionInput.min = '1';
  positionInput.required = true;
  positionInput.className = 'w-12 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500';
  
  positionDiv.appendChild(labelSpan);
  positionDiv.appendChild(positionInput);
  
  // Tạo input cho đáp án
  const answerInput = document.createElement('input');
  answerInput.type = 'text';
  answerInput.name = 'oneWordAnswers[]';
  answerInput.placeholder = 'Correct answer';
  answerInput.required = true;
  answerInput.className = 'flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500';
  
  // Tạo select cho giới hạn từ
  const limitSelect = document.createElement('select');
  limitSelect.name = 'wordLimits[]';
  limitSelect.className = 'w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500';
  
  // Thêm các option cho giới hạn từ
  for (let i = 1; i <= 5; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = i + ' words';
    limitSelect.appendChild(option);
  }
  
  // Tạo nút xóa
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'text-red-600 hover:text-red-900 remove-one-word-blank';
  removeBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
    </svg>
  `;
  
  removeBtn.addEventListener('click', function() {
    container.removeChild(blankDiv);
    updateRemoveButtons(container, 'remove-one-word-blank');
  });
  
  // Thêm tất cả các phần tử vào div chính
  blankDiv.appendChild(positionDiv);
  blankDiv.appendChild(answerInput);
  blankDiv.appendChild(limitSelect);
  blankDiv.appendChild(removeBtn);
  
  // Thêm div vào container
  container.appendChild(blankDiv);
  
  // Cập nhật trạng thái nút xóa
  updateRemoveButtons(container, 'remove-one-word-blank');
}

/**
 * Cập nhật lại vị trí của các blank sau khi xóa
 */
function updateBlankPositions() {
  const container = document.getElementById('oneWordBlanksContainer');
  const blankDivs = container.querySelectorAll('div.flex.items-center.gap-2.mb-3');
  
  blankDivs.forEach((div, index) => {
    // Cập nhật số hiển thị
    const positionSpan = div.querySelector('div.w-24 span:nth-child(2)');
    if (positionSpan) {
      positionSpan.textContent = (index + 1);
    }
    
    // Cập nhật giá trị hidden input
    const positionInput = div.querySelector('input[name="blankPositions[]"]');
    if (positionInput) {
      positionInput.value = index;
    }
  });
}

/**
 * Khởi tạo phần One Word Only
 */
function initOneWordOnly() {
  const container = document.getElementById('oneWordBlanksContainer');
  if (!container) return;
  
  // Xóa tất cả các blank hiện có
  container.innerHTML = '';
  
  // Thêm nút để thêm blank mới
  const addButton = document.getElementById('addOneWordBlankBtn');
  if (addButton) {
    addButton.addEventListener('click', addOneWordBlank);
    
    // Thêm một blank mặc định nếu chưa có
    if (container.children.length === 0) {
      addOneWordBlank();
    }
  }
}

/**
 * Khởi tạo các tùy chọn mặc định cho phần điền vào chỗ trống nhiều lựa chọn
 */
function initializeBlankOptions() {
  const optionsContainer = document.getElementById('blankOptionsContainer');
  
  // Kiểm tra xem container có tồn tại không
  if (!optionsContainer) {
    console.error("Container 'blankOptionsContainer' không tồn tại");
    return;
  }
  
  // Nếu chưa có tùy chọn nào, thêm 2 tùy chọn mặc định
  if (optionsContainer.children.length === 0) {
    // Thêm tùy chọn 1
    const option1Div = document.createElement('div');
    option1Div.className = 'flex items-center gap-2 mb-2 blank-option-item';
    
    const option1Input = document.createElement('input');
    option1Input.type = 'text';
    option1Input.name = 'blankOptions[]';
    option1Input.placeholder = 'A.';
    option1Input.value = 'A.';
    option1Input.required = true;
    option1Input.className = 'flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500';
    
    const removeBtn1 = document.createElement('button');
    removeBtn1.type = 'button';
    removeBtn1.className = 'text-red-600 hover:text-red-900 remove-blank-option hidden';
    removeBtn1.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    `;
    
    option1Div.appendChild(option1Input);
    option1Div.appendChild(removeBtn1);
    optionsContainer.appendChild(option1Div);
    
    // Thêm tùy chọn 2
    const option2Div = document.createElement('div');
    option2Div.className = 'flex items-center gap-2 mb-2 blank-option-item';
    
    const option2Input = document.createElement('input');
    option2Input.type = 'text';
    option2Input.name = 'blankOptions[]';
    option2Input.placeholder = 'B.';
    option2Input.value = 'B.';
    option2Input.required = true;
    option2Input.className = 'flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500';
    
    const removeBtn2 = document.createElement('button');
    removeBtn2.type = 'button';
    removeBtn2.className = 'text-red-600 hover:text-red-900 remove-blank-option hidden';
    removeBtn2.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    `;
    
    option2Div.appendChild(option2Input);
    option2Div.appendChild(removeBtn2);
    optionsContainer.appendChild(option2Div);
    
    // Thêm event listener cho các nút xóa
    removeBtn1.addEventListener('click', function() {
      if (optionsContainer.children.length > 2) {
        optionsContainer.removeChild(option1Div);
        updateRemoveButtons(optionsContainer, 'remove-blank-option');
      }
    });
    
    removeBtn2.addEventListener('click', function() {
      if (optionsContainer.children.length > 2) {
        optionsContainer.removeChild(option2Div);
        updateRemoveButtons(optionsContainer, 'remove-blank-option');
      }
    });
  }
}

/**
 * Cập nhật các select đáp án cho các blank
 */
function updateBlankAnswerSelects() {
  // Kiểm tra xem có input blankOptions không
  const blankOptionInputs = document.querySelectorAll('input[name="blankOptions[]"]');
  if (!blankOptionInputs || blankOptionInputs.length === 0) {
    console.log("Không tìm thấy input blankOptions");
    return;
  }
  
  const blankOptions = Array.from(blankOptionInputs)
    .map(input => input.value.trim())
    .filter(value => value);
  
  const blankSelects = document.querySelectorAll('select[name="blankAnswers[]"]');
  if (!blankSelects || blankSelects.length === 0) {
    console.log("Không tìm thấy select blankAnswers");
    return;
  }
  
  blankSelects.forEach(select => {
    // Lưu lại giá trị đã chọn (nếu có)
    const selectedValue = select.value;
    
    // Xóa tất cả các option hiện tại
    select.innerHTML = '<option value="" selected disabled>Select correct answer</option>';
    
    // Thêm các option mới dựa trên blankOptions
    blankOptions.forEach((option, index) => {
      const optionElement = document.createElement('option');
      optionElement.value = index; // Lưu index của option thay vì giá trị
      optionElement.textContent = `${String.fromCharCode(65 + index)}. ${option}`;
      select.appendChild(optionElement);
    });
    
    // Khôi phục giá trị đã chọn nếu vẫn còn trong danh sách mới
    if (selectedValue && select.querySelector(`option[value="${selectedValue}"]`)) {
      select.value = selectedValue;
    }
  });
}

/**
 * Thêm một blank mới
 */
function addBlank() {
  const container = document.getElementById('blanksContainer');
  
  // Kiểm tra xem container có tồn tại không
  if (!container) {
    console.error("Container 'blanksContainer' không tồn tại");
    return;
  }
  
  const blankCount = container.querySelectorAll('.flex.items-center.gap-2.mb-3').length;
  
  // Tạo một div mới cho blank
  const blankDiv = document.createElement('div');
  blankDiv.className = 'flex items-center gap-2 mb-3';
  
  // Tạo phần nhập số blank
  const blankNumberDiv = document.createElement('div');
  blankNumberDiv.className = 'w-24 flex items-center';
  
  const blankLabel = document.createElement('span');
  blankLabel.className = 'mr-1 font-medium';
  blankLabel.textContent = 'Blank';
  
  const blankNumberInput = document.createElement('input');
  blankNumberInput.type = 'number';
  blankNumberInput.name = 'blankNumbers[]';
  blankNumberInput.value = blankCount + 1;
  blankNumberInput.min = '1';
  blankNumberInput.className = 'w-12 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500';
  
  const colonSpan = document.createElement('span');
  colonSpan.className = 'ml-1';
  colonSpan.textContent = ':';
  
  blankNumberDiv.appendChild(blankLabel);
  blankNumberDiv.appendChild(blankNumberInput);
  blankNumberDiv.appendChild(colonSpan);
  
  // Tạo select cho đáp án
  const blankSelect = document.createElement('select');
  blankSelect.name = 'blankAnswers[]'; // Sửa thành mảng để phù hợp với backend
  blankSelect.className = 'rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500';
  
  // Option mặc định
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.disabled = true;
  defaultOption.selected = true;
  defaultOption.textContent = 'Select correct answer';
  blankSelect.appendChild(defaultOption);
  
  // Tạo nút xóa
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'text-red-600 hover:text-red-900 remove-blank';
  removeBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
    </svg>
  `;
  
  removeBtn.addEventListener('click', function() {
    container.removeChild(blankDiv);
    updateRemoveButtons(container, 'remove-blank');
  });
  
  // Thêm tất cả các phần tử vào div chính
  blankDiv.appendChild(blankNumberDiv);
  blankDiv.appendChild(blankSelect);
  blankDiv.appendChild(removeBtn);
  
  // Thêm div vào container
  container.appendChild(blankDiv);
  
  // Cập nhật các select với các option hiện tại
  updateBlankAnswerSelects();
  
  // Cập nhật trạng thái nút xóa
  updateRemoveButtons(container, 'remove-blank');
}

/**
 * Thêm một tùy chọn mới cho blank
 */
function addBlankOption() {
  const container = document.getElementById('blankOptionsContainer');
  
  // Kiểm tra xem container có tồn tại không
  if (!container) {
    console.error("Container 'blankOptionsContainer' không tồn tại");
    return;
  }
  
  const optionCount = container.querySelectorAll('.flex.items-center.gap-2.mb-2').length;
  
  // Tạo một div mới cho option
  const optionDiv = document.createElement('div');
  optionDiv.className = 'flex items-center gap-2 mb-2 blank-option-item';
  
  // Tạo phần hiển thị chữ cái
  const letterDiv = document.createElement('div');
  letterDiv.className = 'w-10 text-center';
  
  const letterSpan = document.createElement('span');
  letterSpan.className = 'font-medium';
  letterSpan.textContent = `${String.fromCharCode(65 + optionCount)}.`;
  
  letterDiv.appendChild(letterSpan);
  
  // Tạo input cho option
  const optionInput = document.createElement('input');
  optionInput.type = 'text';
  optionInput.name = 'blankOptions[]'; // Sửa thành mảng để phù hợp với backend
  optionInput.placeholder = `Option ${optionCount + 1}`;
  optionInput.className = 'flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500';
  
  // Thêm event listener để cập nhật các select khi giá trị thay đổi
  optionInput.addEventListener('input', updateBlankAnswerSelects);
  
  // Tạo nút xóa
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'text-red-600 hover:text-red-900 remove-blank-option';
  removeBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
    </svg>
  `;
  
  removeBtn.addEventListener('click', function() {
    container.removeChild(optionDiv);
    updateRemoveButtons(container, 'remove-blank-option');
    // Cập nhật lại các chữ cái
    updateBlankOptionLetters();
    // Cập nhật lại các select
    updateBlankAnswerSelects();
  });
  
  // Thêm tất cả các phần tử vào div chính
  optionDiv.appendChild(letterDiv);
  optionDiv.appendChild(optionInput);
  optionDiv.appendChild(removeBtn);
  
  // Thêm div vào container
  container.appendChild(optionDiv);
  
  // Cập nhật trạng thái nút xóa
  updateRemoveButtons(container, 'remove-blank-option');
  
  // Cập nhật các select với option mới
  updateBlankAnswerSelects();
}

/**
 * Cập nhật các chữ cái cho các tùy chọn blank
 */
function updateBlankOptionLetters() {
  const optionItems = document.querySelectorAll('#blankOptionsContainer .blank-option-item');
  
  optionItems.forEach((item, index) => {
    const letterSpan = item.querySelector('.w-10.text-center span');
    if (letterSpan) {
      letterSpan.textContent = `${String.fromCharCode(65 + index)}.`;
    }
  });
}

/**
 * Khởi tạo các sự kiện cho form
 */
function initFormEvents() {
  
  // Thêm event listener cho nút thêm blank option
  const addBlankOptionBtn = document.getElementById('addBlankOptionBtn');
  if (addBlankOptionBtn) {
    addBlankOptionBtn.addEventListener('click', addBlankOption);
  }
  
  // Thêm event listener cho nút thêm blank
  const addBlankBtn = document.getElementById('addBlankBtn');
  if (addBlankBtn) {
    addBlankBtn.addEventListener('click', addBlank);
  }
  
  // Thêm event listener cho việc thay đổi kiểu blank
  const blankStyleSelect = document.getElementById('blankStyleSelect');
  if (blankStyleSelect) {
    blankStyleSelect.addEventListener('change', toggleFillBlankStyle);
  }
  
  // Khởi tạo các input cho blank options
  const blankOptionInputs = document.querySelectorAll('input[name="blankOptions"]');
  blankOptionInputs.forEach(input => {
    input.addEventListener('input', updateBlankAnswerSelects);
  });
}