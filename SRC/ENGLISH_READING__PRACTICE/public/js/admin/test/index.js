
  function deleteTest(testId) {
    if (confirm('Are you sure you want to delete this test? This action cannot be undone.')) {
      fetch(`/admin/tests/${testId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          window.location.reload();
        } else {
          alert(data.message || 'Error deleting test');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while deleting the test');
      });
    }
  }
