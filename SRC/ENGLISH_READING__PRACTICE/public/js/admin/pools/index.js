document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('confirmationModal');
    const cancelButton = document.getElementById('cancelButton');
    const confirmButton = document.getElementById('confirmButton');
    
    let poolIdToDelete = null;
    
    // Function to delete a test pool
    window.deletePool = function(poolId) {
      poolIdToDelete = poolId;
      openModal();
    };
    
    // Function to open the confirmation modal
    function openModal() {
      modal.classList.remove('hidden');
    }
    
    // Function to close the confirmation modal
    function closeModal() {
      modal.classList.add('hidden');
    }
    
    // Event listener for cancel button
    cancelButton.addEventListener('click', function() {
      closeModal();
    });
    
    // Event listener for confirm button
    confirmButton.addEventListener('click', function() {
      if (poolIdToDelete) {
        deleteTestPool(poolIdToDelete);
      }
    });
    
    // Function to handle the actual deletion via AJAX
    function deleteTestPool(poolId) {
      fetch(`/admin/pools/${poolId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(data => {
        closeModal();
        
        if (data.success) {
          // If deletion was successful, refresh the page
          window.location.reload();
        } else {
          // If deletion failed, show an error message
          alert(data.message || 'Failed to delete the test pool. Please try again.');
        }
      })
      .catch(error => {
        closeModal();
        console.error('Error:', error);
        alert('An error occurred while trying to delete the test pool. Please try again.');
      });
    }
    
    // Close modal when clicking outside of it
    window.addEventListener('click', function(event) {
      if (event.target === modal) {
        closeModal();
      }
    });
  });