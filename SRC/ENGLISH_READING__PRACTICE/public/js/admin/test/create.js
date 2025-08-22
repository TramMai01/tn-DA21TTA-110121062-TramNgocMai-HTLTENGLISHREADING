
  document.addEventListener('DOMContentLoaded', function() {
    const passageCheckboxes = document.querySelectorAll('.passage-checkbox');
    const questionsContainer = document.getElementById('questionsContainer');
    const passageQuestionsAccordion = document.getElementById('passageQuestionsAccordion');
    const questionIdsField = document.getElementById('questionIds');
    const createTestBtn = document.getElementById('createTestBtn');
    
    // Question type filter elements
    const questionTypeFilters = document.querySelectorAll('input[name="questionTypeFilter"]');
    
    // Search and pagination elements
    const searchInput = document.getElementById('search');
    const sortBySelect = document.getElementById('sortBy');
    const sortOrderCheckbox = document.getElementById('sortOrder');
    const searchBtn = document.getElementById('searchBtn');
    const paginationLinks = document.querySelectorAll('.pagination-link');
    
    // Summary elements
    const summaryPassages = document.getElementById('summary-passages');
    const summaryQuestions = document.getElementById('summary-questions');
    const summaryPoints = document.getElementById('summary-points');
    
    // Object to store selected question IDs for each passage
    const selectedQuestions = {};
    
    // Object to store selected passage data
    let selectedPassages = {};
    
    // Total questions and points counters
    let totalQuestions = 0;
    let totalPoints = 0;
    
    // Current question type filter
    let currentQuestionTypeFilter = 'all';
    
    // Load saved state from localStorage
    function loadSavedState() {
      try {
        const savedPassages = localStorage.getItem('test_create_selected_passages');
        const savedQuestions = localStorage.getItem('test_create_selected_questions');
        const savedFilter = localStorage.getItem('test_create_question_filter');
        
        if (savedPassages) {
          selectedPassages = JSON.parse(savedPassages);
        }
        
        if (savedQuestions) {
          Object.assign(selectedQuestions, JSON.parse(savedQuestions));
          
          // Recalculate totals from saved questions (we'll get scores when questions are loaded)
          totalQuestions = 0;
          for (const passageId in selectedQuestions) {
            if (selectedQuestions[passageId]) {
              totalQuestions += selectedQuestions[passageId].length;
            }
          }
        }
        
        if (savedFilter) {
          currentQuestionTypeFilter = savedFilter;
          // Set the radio button
          const filterRadio = document.querySelector(`input[name="questionTypeFilter"][value="${savedFilter}"]`);
          if (filterRadio) {
            filterRadio.checked = true;
          }
        }
      } catch (error) {
        console.error('Error loading saved state:', error);
      }
    }
    
    // Save state to localStorage
    function saveState() {
      try {
        localStorage.setItem('test_create_selected_passages', JSON.stringify(selectedPassages));
        localStorage.setItem('test_create_selected_questions', JSON.stringify(selectedQuestions));
        localStorage.setItem('test_create_question_filter', currentQuestionTypeFilter);
      } catch (error) {
        console.error('Error saving state:', error);
      }
    }
    
    // Clear saved state
    function clearSavedState() {
      localStorage.removeItem('test_create_selected_passages');
      localStorage.removeItem('test_create_selected_questions');
      localStorage.removeItem('test_create_question_filter');
    }
    
    // Restore selected passages on page load
    function restoreSelectedPassages() {
      passageCheckboxes.forEach(checkbox => {
        const passageId = checkbox.value;
        if (selectedPassages[passageId]) {
          checkbox.checked = true;
          const passageTitle = selectedPassages[passageId].title;
          
          // Show questions container
          if (questionsContainer.classList.contains('hidden')) {
            questionsContainer.classList.remove('hidden');
          }
          
          // Create question list for this passage
          createQuestionList(passageId, passageTitle);
        }
      });
    }
    
    // Create question lists for all selected passages (including those not on current page)
    async function restoreAllSelectedPassages() {
      // Reset totalPoints before recalculating
      totalPoints = 0;
      
      // First, restore passages that are on current page
      restoreSelectedPassages();
      
      // Check if there are passages from other pages
      let hasPassagesFromOtherPages = false;
      
      // Then, create question lists for passages not on current page
      for (const passageId in selectedPassages) {
        if (selectedPassages[passageId]) {
          const existingCheckbox = document.querySelector(`input[value="${passageId}"]`);
          
          // If passage is not on current page, create question list anyway
          if (!existingCheckbox) {
            hasPassagesFromOtherPages = true;
            const passageTitle = selectedPassages[passageId].title;
            
            // Show questions container
            if (questionsContainer.classList.contains('hidden')) {
              questionsContainer.classList.remove('hidden');
            }
            
            // Create question list for this passage
            await createQuestionList(passageId, passageTitle);
          }
        }
      }
      
      // Show/hide cross-page info
      const crossPageInfo = document.getElementById('crossPageInfo');
      if (crossPageInfo) {
        if (hasPassagesFromOtherPages) {
          crossPageInfo.classList.remove('hidden');
        } else {
          crossPageInfo.classList.add('hidden');
        }
      }
    }
    
    // Function to get selected question type filter
    function getSelectedQuestionTypeFilter() {
      const selectedFilter = document.querySelector('input[name="questionTypeFilter"]:checked');
      return selectedFilter ? selectedFilter.value : 'all';
    }
    
    // Function to filter questions by type
    function filterQuestionsByType(questions, questionType) {
      if (questionType === 'all') {
        return questions;
      }
      return questions.filter(question => question.questionType === questionType);
    }
    
    // Function to get display name for question type
    function getQuestionTypeDisplayName(questionType) {
      const displayNames = {
        'multiple_choice': 'Multiple Choice',
        'fill_blank': 'Fill in the Blank',
        'matching': 'Matching',
        'true_false_not_given': 'True/False/Not Given',
          'short_answer': 'Short Answer'
      };
      return displayNames[questionType] || questionType;
    }
    
    // Function to update question list when filter changes
    async function updateQuestionListForFilter(passageId) {
      const accordionItem = document.getElementById(`accordion-${passageId}`);
      if (!accordionItem) return;
      
      const questionsList = accordionItem.querySelector('.questions-list');
      const currentFilter = getSelectedQuestionTypeFilter();
      
      // Clear existing selections for this passage when filter changes
      if (selectedQuestions[passageId]) {
        const previousCount = selectedQuestions[passageId].length;
        // Calculate points to subtract
        const checkboxes = accordionItem.querySelectorAll('.question-checkbox:checked');
        let pointsToSubtract = 0;
        checkboxes.forEach(checkbox => {
          pointsToSubtract += parseFloat(checkbox.dataset.questionScore) || 1;
        });
        
        selectedQuestions[passageId] = [];
        totalQuestions -= previousCount;
        totalPoints -= pointsToSubtract;
      }
      
      // Fetch and filter questions
      const questions = await fetchQuestionsForPassage(passageId, currentFilter);
      
              if (questions.length === 0) {
          const filterText = currentFilter === 'all' ? '' : ` thuộc loại "${getQuestionTypeDisplayName(currentFilter)}"`;
          questionsList.innerHTML = `
            <div class="text-center py-4">
              <p class="text-gray-500 mb-2">No questions${filterText} for this passage</p>
              ${currentFilter !== 'all' ? '<p class="text-sm text-blue-600">Try selecting "All" to see all questions</p>' : ''}
            </div>
          `;
      } else {
        // Rebuild questions list
        questionsList.innerHTML = '';
        questions.forEach(question => {
          const questionItem = document.createElement('div');
          questionItem.className = 'border rounded-md p-3';
          
          // Question type badge color
          let badgeColor = 'bg-gray-100 text-gray-800';
          switch(question.questionType) {
            case 'multiple_choice': badgeColor = 'bg-blue-100 text-blue-800'; break;
            case 'fill_blank': badgeColor = 'bg-green-100 text-green-800'; break;
            case 'matching': badgeColor = 'bg-purple-100 text-purple-800'; break;
            case 'true_false_not_given': badgeColor = 'bg-yellow-100 text-yellow-800'; break;
            case 'short_answer': badgeColor = 'bg-red-100 text-red-800'; break;
          }
          
          questionItem.innerHTML = `
            <div class="flex items-start">
              <input type="checkbox" 
                     class="question-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1" 
                     data-passage-id="${passageId}"
                     data-question-id="${question._id}"
                     data-question-score="${question.score || 1}">
              <div class="ml-3 flex-1">
                <div class="flex items-center justify-between mb-2">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColor}">
                    ${getQuestionTypeDisplayName(question.questionType)}
                  </span>
                  <span class="text-sm text-gray-500">${question.score || 1} points</span>
                </div>
                <p class="text-sm text-gray-900">${question.questionText}</p>
                <p class="text-xs text-gray-500 mt-1">Order: ${question.order}</p>
              </div>
            </div>
          `;
          
          questionsList.appendChild(questionItem);
        });
        
        // Re-attach event listeners for new checkboxes
        accordionItem.querySelectorAll('.question-checkbox').forEach(checkbox => {
          checkbox.addEventListener('change', function() {
            const passageId = this.dataset.passageId;
            const questionId = this.dataset.questionId;
            const score = parseFloat(this.dataset.questionScore) || 1;
            
            if (this.checked) {
              if (!selectedQuestions[passageId].includes(questionId)) {
                selectedQuestions[passageId].push(questionId);
                totalQuestions++;
                totalPoints += score;
              }
            } else {
              const index = selectedQuestions[passageId].indexOf(questionId);
              if (index > -1) {
                selectedQuestions[passageId].splice(index, 1);
                totalQuestions--;
                totalPoints -= score;
              }
            }
            
            // Update counter
            const counter = accordionItem.querySelector('.question-counter');
            counter.textContent = `${selectedQuestions[passageId].length} questions selected`;
            
            // Update summary
            updateSummary();
            saveState();
          });
        });
      }
      
      // Update counter
      const counter = accordionItem.querySelector('.question-counter');
      counter.textContent = `${selectedQuestions[passageId] ? selectedQuestions[passageId].length : 0} questions selected`;
      
      updateSummary();
    }
    
    // Function to update the test summary
    function updateSummary() {
      const selectedPassagesCount = document.querySelectorAll('.passage-checkbox:checked').length;
      summaryPassages.textContent = `${selectedPassagesCount} selected`;
      summaryQuestions.textContent = `${totalQuestions} selected`;
      summaryPoints.textContent = `${totalPoints} points`;
      
      // Enable/disable create button
      createTestBtn.disabled = selectedPassagesCount === 0 || totalQuestions === 0;
      
      // Update hidden field with selected questions
      questionIdsField.value = JSON.stringify(selectedQuestions);
    }
    
    // Function to fetch questions for a passage
    async function fetchQuestionsForPassage(passageId, questionType = null) {
      try {
        const currentFilter = questionType || getSelectedQuestionTypeFilter();
        let url = `/admin/passages/${passageId}/questions`;
        
        if (currentFilter && currentFilter !== 'all') {
          url += `?questionType=${currentFilter}`;
        }
        
        const response = await fetch(url);
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
      // Check if accordion item already exists
      const existingAccordion = document.getElementById(`accordion-${passageId}`);
      if (existingAccordion) {
        // Update existing accordion with filtered questions
        await updateQuestionListForFilter(passageId);
        return;
      }
      
      // Create accordion item
      const accordionItem = document.createElement('div');
      accordionItem.id = `accordion-${passageId}`;
      accordionItem.className = 'border border-gray-200 rounded-md overflow-hidden';
      
      // Create header
      const header = document.createElement('div');
      header.className = 'bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center cursor-pointer';
      header.innerHTML = `
        <h3 class="text-md font-medium text-gray-700">${passageTitle}</h3>
        <span class="question-counter text-sm text-gray-500">0 questions selected</span>
        <svg class="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      `;
      
      // Create content area
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
      
      // Add to accordion
      accordionItem.appendChild(header);
      accordionItem.appendChild(content);
      passageQuestionsAccordion.appendChild(accordionItem);
      
      // Initialize empty questions array for this passage
      selectedQuestions[passageId] = [];
      
      // Toggle accordion on header click
      header.addEventListener('click', function() {
        content.classList.toggle('hidden');
        header.querySelector('svg').classList.toggle('transform');
        header.querySelector('svg').classList.toggle('rotate-180');
      });
      
      // Fetch questions for this passage (already filtered by server)
      const questions = await fetchQuestionsForPassage(passageId);
      const questionsList = content.querySelector('.questions-list');
      
      if (questions.length > 0) {
        // Clear loading message
        questionsList.innerHTML = '';
        
        // Add each question to the list
        questions.forEach(question => {
          const questionItem = document.createElement('div');
          questionItem.className = 'border rounded-md p-3';
          
          // Question type badge color
          let badgeClass = 'bg-gray-100 text-gray-800';
          if (question.questionType === 'multiple_choice') {
            badgeClass = 'bg-blue-100 text-blue-800';
          } else if (question.questionType === 'fill_blank') {
            badgeClass = 'bg-purple-100 text-purple-800';
          } else if (question.questionType === 'matching') {
            badgeClass = 'bg-amber-100 text-amber-800';
          } else if (question.questionType === 'true_false_not_given') {
            badgeClass = 'bg-emerald-100 text-emerald-800';
          }
          
          questionItem.innerHTML = `
            <div class="flex items-start">
              <div class="flex items-center h-5">
                <input 
                  id="question-${question._id}" 
                  data-passage-id="${passageId}"
                  data-question-id="${question._id}"
                  data-question-score="${question.score || 1}"
                  type="checkbox" 
                  class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 question-checkbox"
                >
              </div>
              <div class="ml-3 text-sm">
                <label for="question-${question._id}" class="font-medium text-gray-700">
                  ${question.questionText}
                </label>
                <div class="flex mt-1 space-x-2">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}">
                    ${question.questionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    ${question.score || 1} ${(question.score || 1) === 1 ? 'point' : 'points'}
                  </span>
                </div>
              </div>
            </div>
          `;
          
          questionsList.appendChild(questionItem);
        });
        
        // Restore previously selected questions
        if (selectedQuestions[passageId] && selectedQuestions[passageId].length > 0) {
          content.querySelectorAll('.question-checkbox').forEach(checkbox => {
            const questionId = checkbox.dataset.questionId;
            if (selectedQuestions[passageId].includes(questionId)) {
              checkbox.checked = true;
              // Add to totalPoints when restoring
              const score = parseFloat(checkbox.dataset.questionScore) || 1;
              totalPoints += score;
            }
          });
          
          // Update counter
          const counter = accordionItem.querySelector('.question-counter');
          counter.textContent = `${selectedQuestions[passageId].length} questions selected`;
        }
        
        // Add event listeners for question checkboxes
        content.querySelectorAll('.question-checkbox').forEach(checkbox => {
          checkbox.addEventListener('change', function() {
            const passageId = this.dataset.passageId;
            const questionId = this.dataset.questionId;
            const score = parseFloat(this.dataset.questionScore) || 1;
            
            if (this.checked) {
              // Add question to selected list
              if (!selectedQuestions[passageId].includes(questionId)) {
                selectedQuestions[passageId].push(questionId);
                totalQuestions++;
                totalPoints += score;
              }
            } else {
              // Remove question from selected list
              const index = selectedQuestions[passageId].indexOf(questionId);
              if (index > -1) {
                selectedQuestions[passageId].splice(index, 1);
                totalQuestions--;
                totalPoints -= score;
              }
            }
            
            // Update counter for this passage
            const counter = accordionItem.querySelector('.question-counter');
            counter.textContent = `${selectedQuestions[passageId].length} questions selected`;
            
            // Update summary
            updateSummary();
            saveState();
          });
        });
        
        // Select All button
        content.querySelector('.select-all-btn').addEventListener('click', function() {
          content.querySelectorAll('.question-checkbox').forEach(checkbox => {
            if (!checkbox.checked) {
              checkbox.checked = true;
              
              const passageId = checkbox.dataset.passageId;
              const questionId = checkbox.dataset.questionId;
              const score = parseFloat(checkbox.dataset.questionScore) || 1;
              
              if (!selectedQuestions[passageId].includes(questionId)) {
                selectedQuestions[passageId].push(questionId);
                totalQuestions++;
                totalPoints += score;
              }
            }
          });
          
          // Update counter
          const counter = accordionItem.querySelector('.question-counter');
          counter.textContent = `${selectedQuestions[passageId].length} questions selected`;
          
          // Update summary
          updateSummary();
        });
        
        // Deselect All button
        content.querySelector('.deselect-all-btn').addEventListener('click', function() {
          content.querySelectorAll('.question-checkbox').forEach(checkbox => {
            if (checkbox.checked) {
              checkbox.checked = false;
              
              const passageId = checkbox.dataset.passageId;
              const questionId = checkbox.dataset.questionId;
              const score = parseFloat(checkbox.dataset.questionScore) || 1;
              
              const index = selectedQuestions[passageId].indexOf(questionId);
              if (index > -1) {
                selectedQuestions[passageId].splice(index, 1);
                totalQuestions--;
                totalPoints -= score;
              }
            }
          });
          
          // Update counter
          const counter = accordionItem.querySelector('.question-counter');
          counter.textContent = `${selectedQuestions[passageId].length} questions selected`;
          
          // Update summary
          updateSummary();
        });
      } else {
        // No questions found
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
    
    // Handle passage selection
    passageCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        const passageId = this.value;
        const passageTitle = this.parentElement.parentElement.querySelector('label').textContent.trim();
        
        if (this.checked) {
          // Save passage data
          selectedPassages[passageId] = {
            title: passageTitle,
            selected: true
          };
          
          // Show questions container if hidden
          if (questionsContainer.classList.contains('hidden')) {
            questionsContainer.classList.remove('hidden');
          }
          
          // Create question list for this passage
          createQuestionList(passageId, passageTitle);
        } else {
          // Remove from selected passages
          delete selectedPassages[passageId];
          
          // Remove accordion item for this passage
          const accordionItem = document.getElementById(`accordion-${passageId}`);
          if (accordionItem) {
            // Subtract this passage's questions from the total
            if (selectedQuestions[passageId]) {
              selectedQuestions[passageId].forEach(questionId => {
                // Find the checkbox to get the score
                const checkbox = accordionItem.querySelector(`[data-question-id="${questionId}"]`);
                if (checkbox) {
                  const score = parseFloat(checkbox.dataset.questionScore) || 1;
                  totalPoints -= score;
                }
              });
              
              totalQuestions -= selectedQuestions[passageId].length;
              delete selectedQuestions[passageId];
            }
            
            accordionItem.remove();
          }
          
          // Hide questions container if no passages selected
          if (Object.keys(selectedPassages).length === 0) {
            questionsContainer.classList.add('hidden');
          }
        }
        
        // Save state and update summary
        saveState();
        updateSummary();
      });
    });
    
    // Form validation
    document.getElementById('testForm').addEventListener('submit', function(e) {
      if (document.querySelectorAll('.passage-checkbox:checked').length === 0) {
        e.preventDefault();
        alert('Please select at least one passage for the test.');
        return;
      }
      
      if (totalQuestions === 0) {
        e.preventDefault();
        const currentFilter = getSelectedQuestionTypeFilter();
        if (currentFilter !== 'all') {
          alert(`No questions of type "${getQuestionTypeDisplayName(currentFilter)}" in the selected passages. Please select "All" or select a different passage.`);
        } else {
          alert('Please select at least one question for the test.');
        }
        return;
      }
      
      // Check if each selected passage has at least one question
      let invalidPassage = false;
      let invalidPassageName = '';
      
      document.querySelectorAll('.passage-checkbox:checked').forEach(checkbox => {
        const passageId = checkbox.value;
        const passageTitle = selectedPassages[passageId] ? selectedPassages[passageId].title : 'Unknown';
        
        if (!selectedQuestions[passageId] || selectedQuestions[passageId].length === 0) {
          invalidPassage = true;
          invalidPassageName = passageTitle;
        }
      });
      
      if (invalidPassage) {
        e.preventDefault();
        const currentFilter = getSelectedQuestionTypeFilter();
        if (currentFilter !== 'all') {
          alert(`Passage "${invalidPassageName}" has no questions of type "${getQuestionTypeDisplayName(currentFilter)}". Please select "All" or deselect this passage.`);
        } else {
          alert(`Passage "${invalidPassageName}" has no questions selected. Each passage must have at least one question.`);
        }
        return;
      }
    });
    
    // Search and pagination functionality
    function performSearch() {
      const searchTerm = searchInput ? searchInput.value.trim() : '';
      const sortBy = sortBySelect ? sortBySelect.value : 'createdAt';
      const order = (sortOrderCheckbox && sortOrderCheckbox.checked) ? 'desc' : 'asc';
      
      const params = new URLSearchParams(window.location.search);
      
      if (searchTerm) {
        params.set('search', searchTerm);
      } else {
        params.delete('search');
      }
      
      params.set('sortBy', sortBy);
      params.set('order', order);
      params.delete('page'); // Reset to page 1 when searching
      
      window.location.href = `${window.location.pathname}?${params.toString()}`;
    }
    
    function navigateToPage(page) {
      const params = new URLSearchParams(window.location.search);
      params.set('page', page);
      window.location.href = `${window.location.pathname}?${params.toString()}`;
    }
    
    // Event listeners for search
    if (searchBtn) {
      searchBtn.addEventListener('click', performSearch);
    }
    
    if (searchInput) {
      searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          performSearch();
        }
      });
    }
    
    if (sortBySelect) {
      sortBySelect.addEventListener('change', performSearch);
    }
    
    if (sortOrderCheckbox) {
      sortOrderCheckbox.addEventListener('change', performSearch);
    }
    
    // Event listeners for pagination
    paginationLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const page = this.getAttribute('data-page');
        if (page) {
          navigateToPage(page);
        }
      });
    });
    
    // Add event listeners for question type filter
    questionTypeFilters.forEach(filter => {
      filter.addEventListener('change', async function() {
        currentQuestionTypeFilter = this.value;
        
        // Update all existing question lists
        const checkedPassages = document.querySelectorAll('.passage-checkbox:checked');
        for (const checkbox of checkedPassages) {
          const passageId = checkbox.value;
          await updateQuestionListForFilter(passageId);
        }
        
        // Save state
        saveState();
      });
    });
    
    // Initialize page
    loadSavedState();
    restoreAllSelectedPassages().then(() => {
      updateSummary();
    });
    
    // Clear selections button
    const clearSelectionsBtn = document.getElementById('clearSelections');
    if (clearSelectionsBtn) {
      clearSelectionsBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear all current selections?')) {
          // Clear all checkboxes
          document.querySelectorAll('.passage-checkbox:checked').forEach(checkbox => {
            checkbox.checked = false;
            checkbox.dispatchEvent(new Event('change'));
          });
          
          // Clear saved state
          clearSavedState();
          
          // Reset counters
          totalQuestions = 0;
          totalPoints = 0;
          
          // Update summary
          updateSummary();
        }
      });
    }
    
    // Clear state when form is successfully submitted
    document.getElementById('testForm').addEventListener('submit', function(e) {
      // Only clear if form validation passes
      setTimeout(() => {
        if (!e.defaultPrevented) {
          clearSavedState();
        }
      }, 100);
    });
  });