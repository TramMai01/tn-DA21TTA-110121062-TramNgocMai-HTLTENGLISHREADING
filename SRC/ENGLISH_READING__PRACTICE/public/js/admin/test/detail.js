document.addEventListener('DOMContentLoaded', function() {
    const deleteTestBtn = document.getElementById('deleteTestBtn');
    const deleteModal = document.getElementById('deleteModal');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    
    // Kiểm tra các elements có tồn tại không
    if (!deleteTestBtn || !deleteModal || !cancelDeleteBtn || !confirmDeleteBtn) {
        console.log('Một số elements không tồn tại, bỏ qua chức năng delete');
        return;
    }
    
    // Get test ID from URL
    const pathParts = window.location.pathname.split('/');
    const testId = pathParts[pathParts.indexOf('tests') + 1];
    
    // Show delete confirmation modal
    deleteTestBtn.addEventListener('click', function() {
        deleteModal.classList.remove('hidden');
    });
    
    // Hide delete confirmation modal
    cancelDeleteBtn.addEventListener('click', function() {
        deleteModal.classList.add('hidden');
    });
    
    // Hide modal when clicking outside
    deleteModal.addEventListener('click', function(e) {
        if (e.target === deleteModal) {
            deleteModal.classList.add('hidden');
        }
    });
    
    // Confirm delete action
    confirmDeleteBtn.addEventListener('click', function() {
        // Disable button to prevent double clicks
        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.textContent = 'Deleting...';
        
        // Send delete request
        fetch(`/admin/tests/${testId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Show success message and redirect
                alert('Test đã được xóa thành công');
                window.location.href = '/admin/tests';
            } else {
                alert(data.message || 'Không thể xóa test');
                deleteModal.classList.add('hidden');
                // Re-enable button
                confirmDeleteBtn.disabled = false;
                confirmDeleteBtn.textContent = 'Delete Test';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Có lỗi xảy ra khi xóa test');
            deleteModal.classList.add('hidden');
            // Re-enable button
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.textContent = 'Delete Test';
        });
    });
});
      // Send delete request
      fetch(`/admin/tests/<%= test._id %>`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          window.location.href = '/admin/tests';
        } else {
          alert(data.message || 'Failed to delete test');
          deleteModal.classList.add('hidden');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while deleting the test');
        deleteModal.classList.add('hidden');
      });
    });
  });