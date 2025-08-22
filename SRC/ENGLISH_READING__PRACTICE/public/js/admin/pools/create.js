document.addEventListener('DOMContentLoaded', function() {
  // Get references to the pool type radio buttons and sections
  const poolTypeRadios = document.querySelectorAll('input[name="poolType"]');
  const specificTestsSection = document.getElementById('specific-tests-section');
  const criteriaSection = document.getElementById('criteria-section');
  
  // Add event listeners to the pool type radio buttons
  poolTypeRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.value === 'specific') {
        specificTestsSection.classList.remove('hidden');
        criteriaSection.classList.add('hidden');
      } else if (this.value === 'criteria') {
        specificTestsSection.classList.add('hidden');
        criteriaSection.classList.remove('hidden');
      }
    });
  });
  
  // Set up the initial display based on the default selected radio
  const initialSelectedValue = document.querySelector('input[name="poolType"]:checked').value;
  if (initialSelectedValue === 'specific') {
    specificTestsSection.classList.remove('hidden');
    criteriaSection.classList.add('hidden');
  } else if (initialSelectedValue === 'criteria') {
    specificTestsSection.classList.add('hidden');
    criteriaSection.classList.remove('hidden');
  }
  
  // Form validation before submission
  const form = document.querySelector('form');
  form.addEventListener('submit', function(event) {
    const selectedPoolType = document.querySelector('input[name="poolType"]:checked').value;
    
    if (selectedPoolType === 'specific') {
      // Check if at least one test is selected
      const selectedTests = document.querySelectorAll('input[name="tests"]:checked');
      if (selectedTests.length === 0) {
        event.preventDefault();
        alert('Vui lòng chọn ít nhất một bài kiểm tra cho Test Pool.');
      }
    } else if (selectedPoolType === 'criteria') {
      // Validate passage count and question count
      const passageCount = parseInt(document.getElementById('passageCount').value);
      const questionCount = parseInt(document.getElementById('questionCount').value);
      
      if (isNaN(passageCount) || passageCount < 1) {
        event.preventDefault();
        alert('Số lượng bài đọc phải lớn hơn hoặc bằng 1.');
      }
      
      if (isNaN(questionCount) || questionCount < 1) {
        event.preventDefault();
        alert('Số lượng câu hỏi mỗi bài đọc phải lớn hơn hoặc bằng 1.');
      }
    }
  });
});