document.addEventListener('DOMContentLoaded', function() {
    const passageCheckboxes = document.querySelectorAll('.passage-checkbox');
    const questionsContainer = document.getElementById('questionsContainer');
    const passageQuestionsAccordion = document.getElementById('passageQuestionsAccordion');
    const questionIdsField = document.getElementById('questionIds');
    const updateTestBtn = document.getElementById('updateTestBtn');
    
    // Summary elements - kiểm tra tồn tại trước khi sử dụng
    const summaryPassages = document.getElementById('summary-passages');
    const summaryQuestions = document.getElementById('summary-questions');
    const summaryPoints = document.getElementById('summary-points');
    
    // Kiểm tra các elements cần thiết có tồn tại không
    if (!summaryPassages || !summaryQuestions || !summaryPoints) {
        console.error('Không tìm thấy các elements summary cần thiết');
        return;
    }
    
    // Object to store selected question IDs for each passage
    const selectedQuestions = {};
    
    // Get existing test data from window object (will be set by EJS)
    if (window.testData && window.testData.passages) {
        window.testData.passages.forEach(passage => {
            selectedQuestions[passage.passageId._id] = passage.questions.map(q => (q._id || q).toString());
        });
    }
    
    // Total questions and points counters
    let totalQuestions = 0;
    let totalPoints = 0;
    
    // Initialize counters from existing data
    if (window.testData && window.testData.passages) {
        window.testData.passages.forEach(passage => {
            if (passage.questions && passage.questions.length > 0) {
                totalQuestions += passage.questions.length;
                passage.questions.forEach(question => {
                    totalPoints += question.score || 1;
                });
            }
        });
    }
    
    // Function to update the test summary
    function updateSummary() {
        const selectedPassagesCount = document.querySelectorAll('.passage-checkbox:checked').length;
        
        // Kiểm tra elements tồn tại trước khi cập nhật
        if (summaryPassages) {
            summaryPassages.textContent = `${selectedPassagesCount} selected`;
        }
        if (summaryQuestions) {
            summaryQuestions.textContent = `${totalQuestions} selected`;
        }
        if (summaryPoints) {
            summaryPoints.textContent = `${totalPoints} points`;
        }
        
        // Enable/disable update button
        if (updateTestBtn) {
            updateTestBtn.disabled = selectedPassagesCount === 0 || totalQuestions === 0;
        }
        
        // Update hidden field with selected questions
        const finalSelectedQuestions = {};
        
        document.querySelectorAll('.passage-checkbox:checked').forEach(checkbox => {
            const passageId = checkbox.value;
            if (selectedQuestions[passageId] && selectedQuestions[passageId].length > 0) {
                finalSelectedQuestions[passageId] = selectedQuestions[passageId];
            }
        });
        
        if (questionIdsField) {
            questionIdsField.value = JSON.stringify(finalSelectedQuestions);
        }
    }
    
    // Function to fetch questions for a passage
    async function fetchQuestionsForPassage(passageId) {
        try {
            const response = await fetch(`/admin/passages/${passageId}/questions`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            if (data.success) {
                return data.questions;
            } else {
                console.error('Error fetching questions:', data.message);
                return [];
            }
        } catch (error) {
            console.error('Error:', error);
            return [];
        }
    }
    
    // Function to create question list for a passage
    async function createQuestionList(passageId, passageTitle) {
        const existingAccordion = document.getElementById(`accordion-${passageId}`);
        if (existingAccordion) return;
        
        const accordionItem = document.createElement('div');
        accordionItem.id = `accordion-${passageId}`;
        accordionItem.className = 'border border-gray-200 rounded-md overflow-hidden';
        
        const selectedCount = selectedQuestions[passageId] ? selectedQuestions[passageId].length : 0;
        
        const header = document.createElement('div');
        header.className = 'bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center cursor-pointer';
        header.innerHTML = `
            <h3 class="text-md font-medium text-gray-700">${passageTitle}</h3>
            <span class="question-counter text-sm text-gray-500">${selectedCount} questions selected</span>
            <svg class="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
        `;
        
        const content = document.createElement('div');
        content.className = 'px-4 py-3 hidden';
        content.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <button type="button" class="select-all-btn text-sm text-blue-600 hover:text-blue-800">Select All</button>
                <button type="button" class="deselect-all-btn text-sm text-blue-600 hover:text-blue-800">Deselect All</button>
            </div>
            <div class="questions-list space-y-2">
                <p class="text-center text-gray-500 py-4">Loading questions...</p>
            </div>
        `;
        
        accordionItem.appendChild(header);
        accordionItem.appendChild(content);
        passageQuestionsAccordion.appendChild(accordionItem);
        
        if (!selectedQuestions[passageId]) {
            selectedQuestions[passageId] = [];
        }
        
        // Toggle accordion
        header.addEventListener('click', function() {
            content.classList.toggle('hidden');
            header.querySelector('svg').classList.toggle('transform');
            header.querySelector('svg').classList.toggle('rotate-180');
        });
        
        // Fetch and display questions
        const questions = await fetchQuestionsForPassage(passageId);
        const questionsList = content.querySelector('.questions-list');
        
        if (questions && questions.length > 0) {
            questionsList.innerHTML = '';
            
            questions.forEach(question => {
                const isSelected = selectedQuestions[passageId] && selectedQuestions[passageId].includes(question._id);
                
                const questionDiv = document.createElement('div');
                questionDiv.className = 'flex items-start space-x-2 p-2 border border-gray-200 rounded';
                questionDiv.innerHTML = `
                    <input 
                        type="checkbox" 
                        class="question-checkbox mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        data-passage-id="${passageId}"
                        data-question-id="${question._id}"
                        data-question-score="${question.score || 1}"
                        ${isSelected ? 'checked' : ''}
                    >
                    <div class="flex-1">
                        <p class="text-sm font-medium text-gray-900">${question.questionText}</p>
                        <p class="text-xs text-gray-500">Type: ${question.questionType} | Score: ${question.score || 1}</p>
                    </div>
                `;
                questionsList.appendChild(questionDiv);
            });
            
            // Add event listeners for select all/deselect all
            const selectAllBtn = content.querySelector('.select-all-btn');
            const deselectAllBtn = content.querySelector('.deselect-all-btn');
            
            selectAllBtn.addEventListener('click', function() {
                content.querySelectorAll('.question-checkbox').forEach(checkbox => {
                    if (!checkbox.checked) {
                        checkbox.checked = true;
                        checkbox.dispatchEvent(new Event('change'));
                    }
                });
            });
            
            deselectAllBtn.addEventListener('click', function() {
                content.querySelectorAll('.question-checkbox').forEach(checkbox => {
                    if (checkbox.checked) {
                        checkbox.checked = false;
                        checkbox.dispatchEvent(new Event('change'));
                    }
                });
            });
            
            // Add event listeners for question checkboxes
            content.querySelectorAll('.question-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    const passageId = this.dataset.passageId;
                    const questionId = this.dataset.questionId;
                    const score = parseFloat(this.dataset.questionScore) || 1;
                    
                    if (this.checked) {
                        if (!selectedQuestions[passageId]) {
                            selectedQuestions[passageId] = [];
                        }
                        if (!selectedQuestions[passageId].includes(questionId)) {
                            selectedQuestions[passageId].push(questionId);
                            totalQuestions++;
                            totalPoints += score;
                        }
                    } else {
                        if (selectedQuestions[passageId]) {
                            const index = selectedQuestions[passageId].indexOf(questionId);
                            if (index > -1) {
                                selectedQuestions[passageId].splice(index, 1);
                                totalQuestions--;
                                totalPoints -= score;
                            }
                        }
                    }
                    
                    // Update counter
                    const counter = accordionItem.querySelector('.question-counter');
                    counter.textContent = `${selectedQuestions[passageId].length} questions selected`;
                    
                    // Update summary
                    updateSummary();
                });
            });
        } else {
            questionsList.innerHTML = `
                <div class="text-center p-4">
                    <p class="text-gray-500">No questions found for this passage.</p>
                    <a href="/admin/passages/${passageId}" class="text-sm text-blue-600 hover:text-blue-800">
                        View passage to add questions
                    </a>
                </div>
            `;
        }
    }
    
    // Initialize - create question lists for selected passages
    passageCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const passageId = checkbox.value;
            const passageTitle = checkbox.parentElement.parentElement.querySelector('label').textContent.trim();
            createQuestionList(passageId, passageTitle);
        }
    });
    
    // Handle passage selection/deselection
    passageCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const passageId = this.value;
            const passageTitle = this.parentElement.parentElement.querySelector('label').textContent.trim();
            
            if (this.checked) {
                if (questionsContainer.classList.contains('hidden')) {
                    questionsContainer.classList.remove('hidden');
                }
                createQuestionList(passageId, passageTitle);
            } else {
                const accordionItem = document.getElementById(`accordion-${passageId}`);
                if (accordionItem) {
                    if (selectedQuestions[passageId]) {
                        selectedQuestions[passageId].forEach(questionId => {
                            const questionCheckbox = accordionItem.querySelector(`input[data-question-id="${questionId}"]`);
                            if (questionCheckbox) {
                                const score = parseFloat(questionCheckbox.dataset.questionScore) || 1;
                                totalPoints -= score;
                            }
                        });
                        
                        totalQuestions -= selectedQuestions[passageId].length;
                        delete selectedQuestions[passageId];
                    }
                    accordionItem.remove();
                }
                
                if (document.querySelectorAll('.passage-checkbox:checked').length === 0) {
                    questionsContainer.classList.add('hidden');
                }
            }
            updateSummary();
        });
    });
    
    // Initial summary update - chỉ gọi nếu các elements tồn tại
    if (summaryPassages && summaryQuestions && summaryPoints) {
        updateSummary();
    }
    
    // Form validation
    document.getElementById('testForm').addEventListener('submit', function(e) {
        const checkedPassages = document.querySelectorAll('.passage-checkbox:checked');
        
        if (checkedPassages.length === 0) {
            e.preventDefault();
            alert('Vui lòng chọn ít nhất một bài đọc cho test.');
            return;
        }
        
        if (totalQuestions === 0) {
            e.preventDefault();
            alert('Vui lòng chọn ít nhất một câu hỏi cho test.');
            return;
        }
        
        let invalidPassage = false;
        let invalidPassageName = '';
        
        checkedPassages.forEach(checkbox => {
            const passageId = checkbox.value;
            const passageTitle = checkbox.parentElement.parentElement.querySelector('label').textContent.trim();
            
            if (!selectedQuestions[passageId] || selectedQuestions[passageId].length === 0) {
                invalidPassage = true;
                invalidPassageName = passageTitle;
            }
        });
        
        if (invalidPassage) {
            e.preventDefault();
            alert(`Bài đọc "${invalidPassageName}" chưa có câu hỏi nào được chọn. Mỗi bài đọc phải có ít nhất một câu hỏi.`);
            return;
        }
        
        const finalSelectedQuestions = {};
        checkedPassages.forEach(checkbox => {
            const passageId = checkbox.value;
            if (selectedQuestions[passageId] && selectedQuestions[passageId].length > 0) {
                finalSelectedQuestions[passageId] = selectedQuestions[passageId];
            }
        });
        
        questionIdsField.value = JSON.stringify(finalSelectedQuestions);
    });
});