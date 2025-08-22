document.addEventListener('DOMContentLoaded', function() {
  // Lấy các phần tử DOM
  const questionTypeSelect = document.getElementById('questionType');
  const questionSections = document.querySelectorAll('.question-type-section');
  const selectedTypeIndicator = document.getElementById('selectedTypeIndicator');
  const questionTypeBtns = document.querySelectorAll('.question-type-btn');
  
  // Multiple choice elements
  const optionsContainer = document.getElementById('optionsContainer');
  const addOptionBtn = document.getElementById('addOptionBtn');
  const multipleAnswersCheckbox = document.getElementById('multipleAnswersCheckbox');
  const multipleChoiceSettings = document.getElementById('multipleChoiceSettings');
  
  // Fill in the blank elements
  const blankStyleSelect = document.getElementById('blankStyleSelect');
  const simpleBlankContainer = document.getElementById('simpleBlankContainer');
  const multipleBlankContainer = document.getElementById('multipleBlankContainer');
  const oneWordOnlyContainer = document.getElementById('oneWordOnlyContainer');
  const acceptableAnswersContainer = document.getElementById('acceptableAnswersContainer');
  const addAnswerBtn = document.getElementById('addAnswerBtn');
  const blankOptionsContainer = document.getElementById('blankOptionsContainer');
  const addBlankOptionBtn = document.getElementById('addBlankOptionBtn');
  const blanksContainer = document.getElementById('blanksContainer');
  const addBlankBtn = document.getElementById('addBlankBtn');
  const addOneWordBlankBtn = document.getElementById('addOneWordBlankBtn');
  const oneWordBlanksContainer = document.getElementById('oneWordBlanksContainer');
  
  // Matching elements
  const headingsContainer = document.getElementById('headingsContainer');
  const paragraphsContainer = document.getElementById('paragraphsContainer');
  const matchingMatrixContainer = document.getElementById('matchingMatrixContainer');
  const addHeadingBtn = document.getElementById('addHeadingBtn');
  const addParagraphBtn = document.getElementById('addParagraphBtn');
  
  // Short answer elements
  const addShortAnswerBtn = document.getElementById('addShortAnswerBtn');
  const oneWordOnlyCheckbox = document.getElementById('oneWordOnlyCheckbox');
  
  // Passage content for text selection
  const passageContent = document.getElementById('passageContent');

  // Thêm hàm cập nhật giá trị cho radio/checkbox
  function updateRadioValues() {
    const optionInputs = optionsContainer.querySelectorAll('input[name="options"]');
    const selectionInputs = optionsContainer.querySelectorAll('input[name="correctAnswer"]');
    
    selectionInputs.forEach((input, index) => {
      if (optionInputs[index]) {
        input.value = optionInputs[index].value || '';
      }
    });
  }

  // Thêm hàm cập nhật dropdown cho blanks
  function updateBlankAnswerSelects() {
    const blankOptionInputs = document.querySelectorAll('input[name="blankOptions[]"]');
    if (!blankOptionInputs || blankOptionInputs.length === 0) {
      return;
    }
    
    const blankOptions = Array.from(blankOptionInputs)
      .map(input => input.value.trim())
      .filter(value => value);
    
    const blankSelects = document.querySelectorAll('select[name="blankAnswers[]"]');
    if (!blankSelects || blankSelects.length === 0) {
      return;
    }
    
    blankSelects.forEach(select => {
      const selectedValue = select.value;
      
      while (select.options.length > 1) {
        select.remove(1);
      }
      
      blankOptions.forEach((option, index) => {
        const optionElement = document.createElement('option');
        optionElement.value = index;
        optionElement.textContent = `${String.fromCharCode(65 + index)}. ${option}`;
        select.appendChild(optionElement);
      });
      
      if (selectedValue && select.querySelector(`option[value="${selectedValue}"]`)) {
        select.value = selectedValue;
      }
    });
  }

  // Xử lý chọn loại câu hỏi từ buttons
  questionTypeBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const type = this.dataset.type;
      
      // Cập nhật UI
      questionTypeBtns.forEach(b => {
        b.classList.remove('bg-blue-50', 'text-blue-600', 'border-blue-600');
        b.classList.add('bg-white', 'text-gray-600', 'border-gray-300');
      });
      
      this.classList.remove('bg-white', 'text-gray-600', 'border-gray-300');
      this.classList.add('bg-blue-50', 'text-blue-600', 'border-blue-600');
      
      // Cập nhật select
      questionTypeSelect.value = type;
      
      // Trigger change event
      questionTypeSelect.dispatchEvent(new Event('change'));
    });
  });

  // Xử lý chọn loại câu hỏi
  if (questionTypeSelect) {
    questionTypeSelect.addEventListener('change', function() {
      const selectedType = this.value;
      
      // Ẩn tất cả các section
      questionSections.forEach(section => {
        section.classList.add('hidden');
      });
      
      // Hiển thị section tương ứng
      const targetSection = document.getElementById(selectedType + 'Options');
      if (targetSection) {
        targetSection.classList.remove('hidden');
      }
      
      // Cập nhật text indicator
      const typeTexts = {
        'multiple_choice': 'Trắc nghiệm',
        'fill_blank': 'Điền vào chỗ trống',
        'matching': 'Nối',
        'true_false_not_given': 'True/False/Not Given',
        'short_answer': 'Trả lời ngắn'
      };
      
      const selectedTypeText = document.getElementById('selectedTypeText');
      if (selectedTypeText) {
        selectedTypeText.textContent = typeTexts[selectedType] || selectedType;
      }
      
      // Cập nhật button states
      questionTypeBtns.forEach(btn => {
        btn.classList.remove('bg-blue-50', 'text-blue-600', 'border-blue-600');
        btn.classList.add('bg-white', 'text-gray-600', 'border-gray-300');
        
        if (btn.dataset.type === selectedType) {
          btn.classList.remove('bg-white', 'text-gray-600', 'border-gray-300');
          btn.classList.add('bg-blue-50', 'text-blue-600', 'border-blue-600');
        }
      });

      // Xử lý hiển thị one word only container cho short answer
      if (selectedType === 'short_answer' && oneWordOnlyContainer) {
        oneWordOnlyContainer.style.display = '';
      } else if (oneWordOnlyContainer) {
        oneWordOnlyContainer.style.display = 'none';
      }
    });
  }

  // Thêm option cho multiple choice
  if (addOptionBtn) {
    addOptionBtn.addEventListener('click', function() {
      const optionCount = optionsContainer.querySelectorAll('.option-item').length;
      
      const optionDiv = document.createElement('div');
      optionDiv.className = 'flex items-center gap-2 mb-2 option-item';
      
      // Tạo input với loại phù hợp dựa trên multipleAnswers
      const isMultipleAnswers = multipleAnswersCheckbox && multipleAnswersCheckbox.checked;
      const selectionInput = document.createElement('input');
      selectionInput.type = isMultipleAnswers ? 'checkbox' : 'radio';
      selectionInput.name = 'correctAnswer';
      selectionInput.id = `correctAnswer${optionCount}`;
      selectionInput.className = 'h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500';
      
      const textInput = document.createElement('input');
      textInput.type = 'text';
      textInput.name = 'options';
      textInput.placeholder = 'Option ' + (optionCount + 1);
      textInput.className = 'flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500';
      
      // Cập nhật giá trị của input selection khi text thay đổi
      textInput.addEventListener('input', function() {
        selectionInput.value = this.value;
      });
      
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'text-red-600 hover:text-red-900 remove-option';
      removeBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      `;
      
      removeBtn.addEventListener('click', function() {
        optionsContainer.removeChild(optionDiv);
        updateRemoveButtons(optionsContainer, 'remove-option');
        updateRadioValues();
      });
      
      optionDiv.appendChild(selectionInput);
      optionDiv.appendChild(textInput);
      optionDiv.appendChild(removeBtn);
      
      optionsContainer.appendChild(optionDiv);
      
      // Hiển thị nút xóa cho tất cả các options nếu có nhiều hơn 2 options
      updateRemoveButtons(optionsContainer, 'remove-option');
      
      // Cập nhật giá trị cho radio/checkbox
      updateRadioValues();
    });
  }

  // Xử lý xóa option cho multiple choice
  if (optionsContainer) {
    optionsContainer.addEventListener('click', function(e) {
      if (e.target.closest('.remove-option')) {
        const optionDiv = e.target.closest('.option-item');
        if (optionDiv) {
          optionsContainer.removeChild(optionDiv);
          updateRemoveButtons(optionsContainer, 'remove-option');
          updateRadioValues();
        }
      }
    });
  }

  // Xử lý thay đổi blank style
  if (blankStyleSelect) {
    blankStyleSelect.addEventListener('change', function() {
      const selectedStyle = this.value;
      
      // Ẩn tất cả containers
      if (simpleBlankContainer) simpleBlankContainer.style.display = 'none';
      if (multipleBlankContainer) multipleBlankContainer.style.display = 'none';
      if (oneWordOnlyContainer) oneWordOnlyContainer.style.display = 'none';
      
      // Hiển thị container tương ứng
      switch (selectedStyle) {
        case 'simple':
          if (simpleBlankContainer) simpleBlankContainer.style.display = 'block';
          break;
        case 'multiple':
          if (multipleBlankContainer) multipleBlankContainer.style.display = 'block';
          break;
        case 'one_word_only':
          if (oneWordOnlyContainer) oneWordOnlyContainer.style.display = 'block';
          break;
      }
    });
  }

  // Thêm đáp án cho fill blank simple
  if (addAnswerBtn) {
    addAnswerBtn.addEventListener('click', function() {
      addAcceptableAnswer();
    });
  }

  // Xử lý xóa đáp án cho fill blank simple
  if (acceptableAnswersContainer) {
    acceptableAnswersContainer.addEventListener('click', function(e) {
      if (e.target.closest('.remove-answer')) {
        const answerDiv = e.target.closest('.flex');
        if (answerDiv) {
          acceptableAnswersContainer.removeChild(answerDiv);
          updateRemoveButtons(acceptableAnswersContainer, 'remove-answer');
          // Cập nhật lại labels cho các đáp án
          updateAnswerLabels();
        }
      }
    });
  }

  // Thêm blank option cho multiple blank
  if (addBlankOptionBtn) {
    addBlankOptionBtn.addEventListener('click', function() {
      addBlankOption();
    });
  }

  // Xử lý xóa blank option
  if (blankOptionsContainer) {
    blankOptionsContainer.addEventListener('click', function(e) {
      if (e.target.closest('.remove-blank-option')) {
        const optionDiv = e.target.closest('.flex');
        if (optionDiv) {
          blankOptionsContainer.removeChild(optionDiv);
          updateRemoveButtons(blankOptionsContainer, 'remove-blank-option');
          updateBlankAnswerSelects();
          // Cập nhật lại labels cho các options
          updateOptionLabels();
        }
      }
    });

    // Lắng nghe thay đổi input để cập nhật selects
    blankOptionsContainer.addEventListener('input', function(e) {
      if (e.target.name === 'blankOptions[]') {
        updateBlankAnswerSelects();
      }
    });
  }

  // Thêm blank cho multiple blank
  if (addBlankBtn) {
    addBlankBtn.addEventListener('click', function() {
      addBlank();
    });
  }

  // Xử lý xóa blank
  if (blanksContainer) {
    blanksContainer.addEventListener('click', function(e) {
      if (e.target.closest('.remove-blank')) {
        const blankDiv = e.target.closest('.flex');
        if (blankDiv) {
          blanksContainer.removeChild(blankDiv);
          updateRemoveButtons(blanksContainer, 'remove-blank');
        }
      }
    });
  }

  // Thêm one word blank
  if (addOneWordBlankBtn) {
    addOneWordBlankBtn.addEventListener('click', function() {
      addOneWordBlank();
    });
  }

  // Xử lý xóa one word blank
  if (oneWordBlanksContainer) {
    oneWordBlanksContainer.addEventListener('click', function(e) {
      if (e.target.closest('.remove-one-word-blank')) {
        const blankDiv = e.target.closest('.flex');
        if (blankDiv) {
          oneWordBlanksContainer.removeChild(blankDiv);
          updateRemoveButtons(oneWordBlanksContainer, 'remove-one-word-blank');
          // Cập nhật lại labels cho các one word blanks
          updateOneWordBlankLabels();
        }
      }
    });
  }

  // Thêm heading cho matching
  if (addHeadingBtn) {
    addHeadingBtn.addEventListener('click', function() {
      addHeading();
      updateMatchingMatrix();
    });
  }

  // Xử lý xóa heading
  if (headingsContainer) {
    headingsContainer.addEventListener('click', function(e) {
      if (e.target.closest('.remove-heading')) {
        const headingDiv = e.target.closest('.flex');
        if (headingDiv) {
          headingsContainer.removeChild(headingDiv);
          updateRemoveButtons(headingsContainer, 'remove-heading');
          updateMatchingMatrix();
        }
      }
    });

    headingsContainer.addEventListener('input', function(e) {
      if (e.target.type === 'text') {
        setTimeout(updateMatchingMatrix, 300); // Debounce
      }
    });
  }

  // Thêm paragraph cho matching
  if (addParagraphBtn) {
    addParagraphBtn.addEventListener('click', function() {
      addParagraph();
      updateMatchingMatrix();
    });
  }

  // Xử lý xóa paragraph
  if (paragraphsContainer) {
    paragraphsContainer.addEventListener('click', function(e) {
      if (e.target.closest('.remove-paragraph')) {
        const paragraphDiv = e.target.closest('.flex');
        if (paragraphDiv) {
          paragraphsContainer.removeChild(paragraphDiv);
          updateRemoveButtons(paragraphsContainer, 'remove-paragraph');
          updateMatchingMatrix();
        }
      }
    });

    paragraphsContainer.addEventListener('input', function(e) {
      if (e.target.type === 'text') {
        setTimeout(updateMatchingMatrix, 300); // Debounce
      }
    });
  }

  // Xử lý chọn văn bản từ passage
  if (passageContent) {
    passageContent.addEventListener('mouseup', function() {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      
      if (selectedText) {
        const questionTextArea = document.getElementById('questionText');
        if (questionTextArea) {
          if (!questionTextArea.value.trim()) {
            questionTextArea.value = selectedText;
          }
        }
      }
    });
  }

  // Xử lý thay đổi loại input khi checkbox multiple answers thay đổi
  if (multipleAnswersCheckbox) {
    multipleAnswersCheckbox.addEventListener('change', function() {
      const isMultipleAnswers = this.checked;
      const optionItems = optionsContainer.querySelectorAll('.option-item');
      
      // Lưu trạng thái checked hiện tại
      const checkedValues = [];
      optionItems.forEach((item, index) => {
        const selectionInput = item.querySelector('input[name="correctAnswer"]');
        const textInput = item.querySelector('input[name="options"]');
        if (selectionInput && selectionInput.checked && textInput) {
          checkedValues.push(textInput.value);
        }
      });
      
      optionItems.forEach((item, index) => {
        const selectionInput = item.querySelector('input[type="radio"], input[type="checkbox"]');
        const textInput = item.querySelector('input[name="options"]');
        
        if (selectionInput) {
          const newInput = document.createElement('input');
          newInput.type = isMultipleAnswers ? 'checkbox' : 'radio';
          newInput.name = 'correctAnswer';
          newInput.id = `correctAnswer${index}`;
          newInput.className = selectionInput.className;
          newInput.value = textInput ? textInput.value : '';
          
          // Khôi phục trạng thái checked
          if (textInput && checkedValues.includes(textInput.value)) {
            newInput.checked = true;
          }
          
          selectionInput.parentNode.replaceChild(newInput, selectionInput);
        }
      });
    });
  }

  // Thêm đáp án cho short answer
  if (addShortAnswerBtn) {
    addShortAnswerBtn.addEventListener('click', function() {
      const container = document.getElementById('shortAnswerContainer');
      const answerCount = container.querySelectorAll('input[name="acceptableShortAnswers"]').length;
      
      const answerDiv = document.createElement('div');
      answerDiv.className = 'flex items-center gap-2';
      
      const textInput = document.createElement('input');
      textInput.type = 'text';
      textInput.name = 'acceptableShortAnswers';
      textInput.placeholder = `Answer ${answerCount + 1}`;
      textInput.className = 'flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500';
      
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'text-red-600 hover:text-red-900 remove-short-answer';
      removeBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      `;
      
      removeBtn.addEventListener('click', function() {
        container.removeChild(answerDiv);
        updateRemoveButtons(container, 'remove-short-answer');
      });
      
      answerDiv.appendChild(textInput);
      answerDiv.appendChild(removeBtn);
      
      container.appendChild(answerDiv);
      updateRemoveButtons(container, 'remove-short-answer');
    });
  }

  // Xử lý xóa short answer
  const shortAnswerContainer = document.getElementById('shortAnswerContainer');
  if (shortAnswerContainer) {
    shortAnswerContainer.addEventListener('click', function(e) {
      if (e.target.closest('.remove-short-answer')) {
        const answerDiv = e.target.closest('.flex');
        if (answerDiv) {
          shortAnswerContainer.removeChild(answerDiv);
          updateRemoveButtons(shortAnswerContainer, 'remove-short-answer');
        }
      }
    });
  }

  // Khởi tạo các giá trị ban đầu
  initializeFormValues();



  // Thêm hàm để xử lý form submission
  handleFormSubmission();
});

// Thêm các hàm mới
function addAcceptableAnswer() {
  const container = document.getElementById('acceptableAnswersContainer');
  if (!container) return;
  
  const answerCount = container.children.length + 1;
  const answerDiv = document.createElement('div');
  answerDiv.className = 'flex items-center gap-2 mb-2 p-3 bg-gray-50 rounded-md';
  
  answerDiv.innerHTML = `
    <div class="flex items-center gap-2">
      <label class="text-sm font-medium text-gray-700 whitespace-nowrap">Đáp án ${answerCount}:</label>
    </div>
    <input 
      type="text" 
      name="acceptableAnswers" 
      placeholder="Nhập đáp án chấp nhận được" 
      class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
    >
    <button type="button" class="text-red-600 hover:text-red-900 remove-answer" title="Xóa đáp án này">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    </button>
  `;
  
  container.appendChild(answerDiv);
  
  const removeBtn = answerDiv.querySelector('.remove-answer');
  removeBtn.addEventListener('click', function() {
    container.removeChild(answerDiv);
    updateRemoveButtons(container, 'remove-answer');
    // Cập nhật lại labels
    updateAnswerLabels();
  });
  
  updateRemoveButtons(container, 'remove-answer');
}

// Hàm cập nhật lại labels cho các answers
function updateAnswerLabels() {
  const container = document.getElementById('acceptableAnswersContainer');
  if (!container) return;
  
  const answerDivs = container.querySelectorAll('.flex');
  answerDivs.forEach((div, index) => {
    const label = div.querySelector('label');
    if (label) {
      label.textContent = `Đáp án ${index + 1}:`;
    }
  });
}

// Hàm cập nhật lại labels cho các options
function updateOptionLabels() {
  const container = document.getElementById('blankOptionsContainer');
  if (!container) return;
  
  const optionDivs = container.querySelectorAll('.flex');
  optionDivs.forEach((div, index) => {
    const label = div.querySelector('label');
    const input = div.querySelector('input[name="blankOptions[]"]');
    const optionLetter = String.fromCharCode(65 + index);
    
    if (label) {
      label.textContent = `${optionLetter}.`;
    }
    if (input) {
      input.placeholder = `Option ${optionLetter}`;
    }
  });
  
  // Cập nhật lại các select boxes
  updateBlankAnswerSelects();
}

function addBlankOption() {
  const container = document.getElementById('blankOptionsContainer');
  if (!container) return;
  
  const optionCount = container.children.length;
  const optionLetter = String.fromCharCode(65 + optionCount); // A, B, C, D...
  
  const optionDiv = document.createElement('div');
  optionDiv.className = 'flex items-center gap-2 mb-2';
  
  optionDiv.innerHTML = `
    <label class="text-sm font-medium text-gray-700 w-12">${optionLetter}.</label>
    <input 
      type="text" 
      name="blankOptions[]" 
      placeholder="Option ${optionLetter}" 
      class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
    >
    <button type="button" class="text-red-600 hover:text-red-900 remove-blank-option">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    </button>
  `;
  
  container.appendChild(optionDiv);
  
  const removeBtn = optionDiv.querySelector('.remove-blank-option');
  removeBtn.addEventListener('click', function() {
    container.removeChild(optionDiv);
    updateRemoveButtons(container, 'remove-blank-option');
    updateBlankAnswerSelects();
    // Cập nhật lại labels cho các options
    updateOptionLabels();
  });
  
  const input = optionDiv.querySelector('input[name="blankOptions[]"]');
  input.addEventListener('input', updateBlankAnswerSelects);
  
  updateRemoveButtons(container, 'remove-blank-option');
  updateBlankAnswerSelects();
}

function addBlank() {
  const container = document.getElementById('blanksContainer');
  if (!container) return;
  
  // Tìm vị trí blank tiếp theo dựa trên các vị trí hiện có
  const existingNumbers = Array.from(container.querySelectorAll('input[name="blankNumbers[]"]'))
    .map(input => parseInt(input.value) || 0)
    .filter(num => num > 0);
  
  const nextBlankNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
  
  const blankDiv = document.createElement('div');
  blankDiv.className = 'flex items-center gap-2 mb-2 p-3 bg-gray-50 rounded-md';
  
  blankDiv.innerHTML = `
    <div class="flex items-center gap-2">
      <label class="text-sm font-medium text-gray-700 whitespace-nowrap">Blank:</label>
      <input 
        type="number" 
        name="blankNumbers[]" 
        value="${nextBlankNumber}"
        min="1" 
        max="50"
        class="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        title=" blank number "
      >
    </div>
    <div class="flex items-center gap-2 flex-1">
      <label class="text-sm font-medium text-gray-700 whitespace-nowrap">Đáp án đúng:</label>
      <select name="blankAnswers[]" class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
        <option value="" selected disabled>Chọn đáp án</option>
      </select>
    </div>
    <button type="button" class="text-red-600 hover:text-red-900 remove-blank" title="Xóa blank này">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    </button>
  `;
  
  container.appendChild(blankDiv);
  
  const removeBtn = blankDiv.querySelector('.remove-blank');
  removeBtn.addEventListener('click', function() {
    container.removeChild(blankDiv);
    updateRemoveButtons(container, 'remove-blank');
  });
  
  updateBlankAnswerSelects();
  updateRemoveButtons(container, 'remove-blank');
}

function addOneWordBlank() {
  const container = document.getElementById('oneWordBlanksContainer');
  if (!container) return;
  
  const blankCount = container.children.length + 1;
  
  // Tìm vị trí blank tiếp theo dựa trên các vị trí hiện có
  const existingPositions = Array.from(container.querySelectorAll('input[name="blankPositions[]"]'))
    .map(input => parseInt(input.value) || 0)
    .filter(num => num > 0);
  
  const nextBlankPosition = existingPositions.length > 0 ? Math.max(...existingPositions) + 1 : blankCount;
  
  const blankDiv = document.createElement('div');
  blankDiv.className = 'flex items-center gap-2 mb-2 p-3 bg-gray-50 rounded-md';
  
  blankDiv.innerHTML = `
    <div class="flex items-center gap-2">
      <label class="text-sm font-medium text-gray-700 whitespace-nowrap">Blank ${blankCount}:</label>
    </div>
    <div class="flex items-center gap-2">
      <label class="text-sm font-medium text-gray-700 whitespace-nowrap">Blank:</label>
      <input 
        type="number" 
        name="blankPositions[]" 
        value="${nextBlankPosition}"
        min="1" 
        max="50"
        class="w-16 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        title=" blank number "
      >
    </div>
    <input 
      type="text" 
      name="oneWordAnswers[]" 
      placeholder="Đáp án ${blankCount}"
      class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
    >
    <div class="flex items-center gap-2">
      <label class="text-sm font-medium text-gray-700 whitespace-nowrap">Giới hạn từ:</label>
      <input 
        type="number" 
        name="wordLimit[]" 
        placeholder="1" 
        value="1"
        min="1" 
        max="5"
        class="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        title="Số từ tối đa cho phép"
      >
    </div>
    <button type="button" class="text-red-600 hover:text-red-900 remove-one-word-blank" title="Xóa blank này">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    </button>
  `;
  
  container.appendChild(blankDiv);
  
  const removeBtn = blankDiv.querySelector('.remove-one-word-blank');
  removeBtn.addEventListener('click', function() {
    container.removeChild(blankDiv);
    updateRemoveButtons(container, 'remove-one-word-blank');
    // Cập nhật lại labels
    updateOneWordBlankLabels();
  });
  
  updateRemoveButtons(container, 'remove-one-word-blank');
}

// Hàm cập nhật lại labels cho các one word blanks
function updateOneWordBlankLabels() {
  const container = document.getElementById('oneWordBlanksContainer');
  if (!container) return;
  
  const blankDivs = container.querySelectorAll('.flex');
  blankDivs.forEach((div, index) => {
    const label = div.querySelector('label');
    const input = div.querySelector('input[name="oneWordAnswers[]"]');
    
    if (label) {
      label.textContent = `Blank ${index + 1}:`;
    }
    if (input) {
      input.placeholder = `Đáp án ${index + 1}`;
    }
  });
}

function addHeading() {
  const container = document.getElementById('headingsContainer');
  if (!container) return;
  
  const headingCount = container.querySelectorAll('input[name="matchingHeadings[]"]').length;
  
  const newHeading = document.createElement('div');
  newHeading.className = 'flex items-center gap-2 mb-2';
  newHeading.innerHTML = `
    <input type="text" 
           name="matchingHeadings[]" 
           placeholder="Heading ${headingCount + 1}"
           class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
           oninput="updateMatchingMatrix()">
    <button type="button" 
            class="text-red-600 hover:text-red-900 remove-heading"
            onclick="removeHeading(this)">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    </button>
  `;
  
  container.appendChild(newHeading);
  updateRemoveButtons(container, 'remove-heading');
  updateMatchingMatrix();
}

function addParagraph() {
  const container = document.getElementById('paragraphsContainer');
  if (!container) return;
  
  const paragraphCount = container.querySelectorAll('input[name="matchingParagraphs[]"]').length;
  
  const newParagraph = document.createElement('div');
  newParagraph.className = 'flex items-center gap-2 mb-2';
  newParagraph.innerHTML = `
    <input type="text" 
           name="matchingParagraphs[]" 
           placeholder="Paragraph ${paragraphCount + 1}"
           class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
           oninput="updateMatchingMatrix()">
    <button type="button" 
            class="text-red-600 hover:text-red-900 remove-paragraph"
            onclick="removeParagraph(this)">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    </button>
  `;
  
  container.appendChild(newParagraph);
  updateRemoveButtons(container, 'remove-paragraph');
  updateMatchingMatrix();
}

function removeHeading(button) {
  const container = document.getElementById('headingsContainer');
  const item = button.closest('.flex.items-center.gap-2.mb-2');
  
  if (container.querySelectorAll('input[name="matchingHeadings[]"]').length > 1) {
    container.removeChild(item);
    updateRemoveButtons(container, 'remove-heading');
    updateMatchingMatrix();
  }
}

function removeParagraph(button) {
  const container = document.getElementById('paragraphsContainer');
  const item = button.closest('.flex.items-center.gap-2.mb-2');
  
  if (container.querySelectorAll('input[name="matchingParagraphs[]"]').length > 1) {
    container.removeChild(item);
    updateRemoveButtons(container, 'remove-paragraph');
    updateMatchingMatrix();
  }
}

function updateAllRemoveButtons() {
  const containers = [
    { element: document.getElementById('optionsContainer'), buttonClass: 'remove-option' },
    { element: document.getElementById('acceptableAnswersContainer'), buttonClass: 'remove-answer' },
    { element: document.getElementById('blankOptionsContainer'), buttonClass: 'remove-blank-option' },
    { element: document.getElementById('blanksContainer'), buttonClass: 'remove-blank' },
    { element: document.getElementById('oneWordBlanksContainer'), buttonClass: 'remove-one-word-blank' },
    { element: document.getElementById('headingsContainer'), buttonClass: 'remove-heading' },
    { element: document.getElementById('paragraphsContainer'), buttonClass: 'remove-paragraph' }
  ];
  
  containers.forEach(({ element, buttonClass }) => {
    if (element) {
      updateRemoveButtons(element, buttonClass);
    }
  });
}

// Biến để debounce update matrix
let updateMatrixTimeout;

function debounceUpdateMatrix() {
  clearTimeout(updateMatrixTimeout);
  updateMatrixTimeout = setTimeout(updateMatchingMatrix, 300);
}

// Sửa hàm initializeFormValues
function initializeFormValues() {
  console.log('Initializing form values...');
  
  const questionTypeSelect = document.getElementById('questionType');
  if (questionTypeSelect && questionTypeSelect.value === 'matching') {
    console.log('Initializing matching matrix...');
    
    // Khởi tạo matching data từ server
    initializeMatchingData();
    
    // Delay để đảm bảo DOM đã render hoàn toàn
    setTimeout(() => {
      updateMatchingMatrix();
    }, 300);
  }
  
  const blankStyleSelect = document.getElementById('blankStyleSelect');
  if (blankStyleSelect && blankStyleSelect.value === 'multiple') {
    updateBlankAnswerSelects();
  }
  
  // Cập nhật trạng thái các nút xóa
  updateAllRemoveButtons();
}

// Thêm hàm khởi tạo matching data
function initializeMatchingData() {
  const matchingDataInput = document.getElementById('matchingDataInput');
  if (!matchingDataInput || matchingDataInput.value) {
    return; // Đã có dữ liệu hoặc không tìm thấy input
  }
  
  // Lấy dữ liệu từ server-side rendered data
  const questionData = window.questionData || {};
  
  if (questionData.correctAnswer && typeof questionData.correctAnswer === 'object') {
    const matchingData = {
      type: questionData.matchingType || 'one_to_one',
      selections: questionData.correctAnswer
    };
    
    matchingDataInput.value = JSON.stringify(matchingData);
    console.log('Initialized matching data:', matchingData);
  }
}

// Hàm load dữ liệu matching hiện có
function loadExistingMatchingData() {
  console.log('Loading existing matching data...');
  
  const headingsContainer = document.getElementById('headingsContainer');
  const paragraphsContainer = document.getElementById('paragraphsContainer');
  const matchingDataInput = document.getElementById('matchingDataInput');
  
  if (!headingsContainer || !paragraphsContainer) {
    console.log('Missing containers');
    return;
  }
  
  // Lấy dữ liệu từ inputs
  const headingInputs = headingsContainer.querySelectorAll('input[name="matchingHeadings[]"]');
  const paragraphInputs = paragraphsContainer.querySelectorAll('input[name="matchingParagraphs[]"]');
  
  const headings = Array.from(headingInputs).map(input => input.value.trim()).filter(h => h);
  const paragraphs = Array.from(paragraphInputs).map(input => input.value.trim()).filter(p => p);
  
  console.log('Loaded headings:', headings);
  console.log('Loaded paragraphs:', paragraphs);
  
  // Lấy dữ liệu matching selections
  let existingSelections = {};
  if (matchingDataInput && matchingDataInput.value) {
    try {
      const data = JSON.parse(matchingDataInput.value);
      existingSelections = data.selections || {};
      console.log('Loaded selections:', existingSelections);
    } catch (e) {
      console.log('Error parsing existing matching data:', e);
    }
  }
  
  // Tạo ma trận nếu có đủ dữ liệu
  if (headings.length > 0 && paragraphs.length > 0) {
    createMatchingMatrix(headings, paragraphs, existingSelections);
  } else {
    const matrixContainer = document.getElementById('matchingMatrixContainer');
    if (matrixContainer) {
      matrixContainer.innerHTML = '<p class="text-gray-500 text-sm">Vui lòng thêm ít nhất 1 tiêu đề và 1 đoạn văn để tạo ma trận nối.</p>';
    }
  }
}

// Sửa lại hàm updateMatchingMatrix để giống create
function updateMatchingMatrix() {
  const headingsContainer = document.getElementById('headingsContainer');
  const paragraphsContainer = document.getElementById('paragraphsContainer');
  const matrixContainer = document.getElementById('matchingMatrixContainer');
  
  if (!headingsContainer || !paragraphsContainer || !matrixContainer) {
    console.log('Missing containers');
    return;
  }

  // Lấy headings và paragraphs
  const headingInputs = headingsContainer.querySelectorAll('input[name="matchingHeadings[]"]');
  const paragraphInputs = paragraphsContainer.querySelectorAll('input[name="matchingParagraphs[]"]');
  
  // Lấy tất cả giá trị, kể cả rỗng
  const headings = Array.from(headingInputs).map(input => input.value.trim());
  const paragraphs = Array.from(paragraphInputs).map(input => input.value.trim());
  
  // Lọc ra những giá trị không rỗng để hiển thị
  const validHeadings = headings.filter(h => h);
  const validParagraphs = paragraphs.filter(p => p);

  console.log('Headings:', validHeadings);
  console.log('Paragraphs:', validParagraphs);

  // Xóa matrix cũ
  matrixContainer.innerHTML = '';

  if (validHeadings.length === 0 || validParagraphs.length === 0) {
    matrixContainer.innerHTML = '<p class="text-gray-500 text-sm">Please add at least one heading and one paragraph to create the matching matrix.</p>';
    return;
  }

  // Lấy dữ liệu matching hiện tại
  const matchingDataInput = document.getElementById('matchingDataInput');
  let currentSelections = {};
  
  if (matchingDataInput && matchingDataInput.value) {
    try {
      const data = JSON.parse(matchingDataInput.value);
      currentSelections = data.selections || {};
      console.log('Current selections:', currentSelections);
    } catch (e) {
      console.log('Error parsing matching data:', e);
    }
  }

  // Tạo dropdown cho từng paragraph đơn giản
  validParagraphs.forEach((paragraph, paragraphIndex) => {
    const matchingDiv = document.createElement('div');
    matchingDiv.className = 'flex items-start gap-3 p-3 border border-gray-200 rounded-md';
    
    const paragraphText = document.createElement('div');
    paragraphText.className = 'flex-1';
    paragraphText.innerHTML = `
      <div class="text-sm font-medium text-gray-700 mb-1">Paragraph ${paragraphIndex + 1}:</div>
      <div class="text-sm text-gray-600">${paragraph}</div>
    `;
    
    const selectDiv = document.createElement('div');
    selectDiv.className = 'w-48';
    
    const select = document.createElement('select');
    select.name = `matching_${paragraphIndex}`;
    select.className = 'w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm';
    
    // Default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Choose heading...';
    select.appendChild(defaultOption);
    
    // Heading options
    validHeadings.forEach((heading, headingIndex) => {
      const option = document.createElement('option');
      option.value = headingIndex;
      option.textContent = `${String.fromCharCode(65 + headingIndex)}. ${heading}`;
      
      // Check if this is the current selection
      if (currentSelections[paragraphIndex] == headingIndex) {
        option.selected = true;
      }
      
      select.appendChild(option);
    });
    
    // "Not used" option
    const notUsedOption = document.createElement('option');
    notUsedOption.value = 'not_used';
    notUsedOption.textContent = 'Not used';
    
    if (currentSelections[paragraphIndex] === 'not_used') {
      notUsedOption.selected = true;
    }
    
    select.appendChild(notUsedOption);
    
    // Event listener
    select.addEventListener('change', function() {
      updateMatchingData();
    });
    
    selectDiv.appendChild(select);
    matchingDiv.appendChild(paragraphText);
    matchingDiv.appendChild(selectDiv);
    matrixContainer.appendChild(matchingDiv);
  });
  
  console.log('Matrix updated successfully');
}

// Sửa lại hàm updateMatchingData
function updateMatchingData() {
  const matchingDataInput = document.getElementById('matchingDataInput');
  const matchingTypeSelect = document.getElementById('matchingTypeSelect');
  
  if (!matchingDataInput) {
    console.log('Missing matchingDataInput');
    return;
  }
  
  const selections = {};
  const matrixContainer = document.getElementById('matchingMatrixContainer');
  
  if (matrixContainer) {
    const selects = matrixContainer.querySelectorAll('select');
    
    selects.forEach((select, index) => {
      if (select.value !== '') {
        if (select.value === 'not_used') {
          selections[index] = 'not_used';
        } else {
          selections[index] = parseInt(select.value);
        }
      }
    });
  }
  
  const matchingData = {
    type: matchingTypeSelect ? matchingTypeSelect.value : 'one_to_one',
    selections: selections
  };
  
  matchingDataInput.value = JSON.stringify(matchingData);
  console.log('Updated matching data:', matchingData);
}



function updateRemoveButtons(container, className) {
  const items = container.querySelectorAll(`.${className}`);
  items.forEach((button, index) => {
    button.style.display = items.length > 1 ? 'block' : 'none';
  });
}

// Thêm hàm để xử lý form submission
function handleFormSubmission() {
  const form = document.getElementById('editQuestionForm');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    const questionType = document.getElementById('questionType').value;
    
    // Validation chung
    const questionText = document.getElementById('questionText').value.trim();
    const score = document.getElementById('score').value;
    
    if (!questionText) {
      e.preventDefault();
      alert('Vui lòng nhập nội dung câu hỏi!');
      return;
    }
    
    if (!score || parseFloat(score) <= 0) {
      e.preventDefault();
      alert('Vui lòng nhập điểm số hợp lệ!');
      return;
    }
    
    // Validation theo từng loại câu hỏi
    if (questionType === 'multiple_choice') {
      const options = form.querySelectorAll('input[name="options"]');
      const validOptions = Array.from(options).filter(opt => opt.value.trim());
      
      if (validOptions.length < 2) {
        e.preventDefault();
        alert('Please add at least 2 options!');
        return;
      }
      
      const multipleAnswersCheckbox = document.getElementById('multipleAnswersCheckbox');
      const isMultipleAnswers = multipleAnswersCheckbox && multipleAnswersCheckbox.checked;
      
      if (isMultipleAnswers) {
        // Xử lý multiple answers
        e.preventDefault();
        
        const checkedBoxes = form.querySelectorAll('input[name="correctAnswer"]:checked');
        const correctAnswers = Array.from(checkedBoxes)
          .map(cb => cb.value)
          .filter(val => val && val.trim() !== '');
        
        if (correctAnswers.length === 0) {
          alert('Please select at least one correct answer!');
          return;
        }
        
        // Xóa input correctAnswer cũ và tạo hidden inputs
        const oldInputs = form.querySelectorAll('input[name="correctAnswer"]');
        oldInputs.forEach(input => input.remove());
        
        correctAnswers.forEach(answer => {
          const hiddenInput = document.createElement('input');
          hiddenInput.type = 'hidden';
          hiddenInput.name = 'correctAnswer';
          hiddenInput.value = answer;
          form.appendChild(hiddenInput);
        });
        
        form.submit();
      } else {
        // Single answer
        const checkedRadio = form.querySelector('input[name="correctAnswer"]:checked');
        if (!checkedRadio || !checkedRadio.value.trim()) {
          e.preventDefault();
          alert('Please select a correct answer!');
          return;
        }
      }
    }
    
    else if (questionType === 'fill_blank') {
      const blankStyle = document.getElementById('blankStyleSelect').value;
      
      if (blankStyle === 'simple') {
        const answers = form.querySelectorAll('input[name="acceptableAnswers"]');
        const hasValidAnswer = Array.from(answers).some(input => input.value.trim());
        
        if (!hasValidAnswer) {
          e.preventDefault();
          alert('Please add at least one acceptable answer!');
          return;
        }
      }
      else if (blankStyle === 'multiple') {
        const options = form.querySelectorAll('input[name="blankOptions[]"]');
        const validOptions = Array.from(options).filter(opt => opt.value.trim());
        
        if (validOptions.length < 2) {
          e.preventDefault();
          alert('Please add at least 2 options for the blank!');
          return;
        }
        
        const blanks = form.querySelectorAll('select[name="blankAnswers[]"]');
        const hasValidBlanks = Array.from(blanks).some(select => select.value);
        
        if (!hasValidBlanks) {
          e.preventDefault();
          alert('Please select an answer for at least one blank!');
          return;
        }
      }
      else if (blankStyle === 'one_word_only') {
        const answers = form.querySelectorAll('input[name="oneWordAnswers[]"]');
        const hasValidAnswer = Array.from(answers).some(input => input.value.trim());
        
        if (!hasValidAnswer) {
          e.preventDefault();
          alert('Please add at least one one-word answer!');
          return;
        }
      }
    }
    
    else if (questionType === 'matching') {
      const headings = form.querySelectorAll('input[name="matchingHeadings[]"]');
      const paragraphs = form.querySelectorAll('input[name="matchingParagraphs[]"]');
      
      const validHeadings = Array.from(headings).filter(h => h.value.trim());
      const validParagraphs = Array.from(paragraphs).filter(p => p.value.trim());
      
      if (validHeadings.length < 2) {
        e.preventDefault();
        alert('Please add at least 2 headings!');
        return;
      }
      
      if (validParagraphs.length < 2) {
        e.preventDefault();
        alert('Please add at least 2 paragraphs!');
        return;
      }
      
      // Cập nhật matching data trước khi submit
      updateMatchingData();
      
      const matchingDataInput = document.getElementById('matchingDataInput');
      if (!matchingDataInput || !matchingDataInput.value) {
        e.preventDefault();
        alert('Please set up matching for the paragraphs and headings!');
        return;
      }
    }
    
    else if (questionType === 'true_false_not_given') {
      const selectedAnswer = form.querySelector('input[name="correctAnswer"]:checked');
      if (!selectedAnswer) {
        e.preventDefault();
        alert('Please select a correct answer (True/False/Not Given)!');
        return;
      }
    }
    
    else if (questionType === 'short_answer') {
      const answers = form.querySelectorAll('input[name="acceptableShortAnswers"]');
      const hasValidAnswer = Array.from(answers).some(input => input.value.trim());
      
      if (!hasValidAnswer) {
        e.preventDefault();
        alert('Please add at least one acceptable answer!');
        return;
      }
      
      const wordLimit = document.getElementById('wordLimit').value;
      if (!wordLimit || parseInt(wordLimit) <= 0) {
        e.preventDefault();
        alert('Please enter a valid word limit!');
        return;
      }
    }
    
    // Hiển thị loading state
    const submitBtn = document.getElementById('updateQuestionBtn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="loading"></span>Updating...';
      
      // Reset lại nếu có lỗi
      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Update Question';
      }, 10000);
    }
  });
}

// Cập nhật hàm updateInputValue để xử lý cả radio và checkbox
function updateInputValue(textInput) {
  const optionItem = textInput.closest('.option-item');
  if (!optionItem) return;
  
  const selectionInput = optionItem.querySelector('input[type="radio"], input[type="checkbox"]');
  if (selectionInput) {
    selectionInput.value = textInput.value;
  }
}
