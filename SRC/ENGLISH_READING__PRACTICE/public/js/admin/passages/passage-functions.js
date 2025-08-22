function deletePassage(passageId) {
    if (confirm('Bạn có chắc chắn muốn xóa bài đọc này? Hành động này không thể hoàn tác.')) {
      fetch(`/admin/passages/${passageId}`, {
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
          alert(data.message || 'Lỗi khi xóa bài đọc');
        }
      })
      .catch(error => {
        console.error('Lỗi:', error);
        alert('Đã xảy ra lỗi khi xóa bài đọc');
      });
    }
  }