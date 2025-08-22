const mongoose = require('mongoose');
const UserAttempt = require('../models/UserAttempt');
const Test = require('../models/Test');
const Question = require('../models/Question');

// Kết nối database
mongoose.connect('mongodb://127.0.0.1:27017/reading-practice', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Hàm chuyển đổi điểm sang thang điểm IELTS
function convertToIELTSScore(rawScore, totalPossibleScore) {
  if (totalPossibleScore === 0) return { ieltsScore: 0, score40: 0, percentage: 0 };
  
  // Tính tỷ lệ phần trăm và chuyển về thang 40 điểm chuẩn IELTS Reading
  const percentage = (rawScore / totalPossibleScore) * 100;
  const score40 = Math.round((percentage / 100) * 40);
  
  // Bảng chuyển đổi điểm IELTS Reading
  const ieltsConversionTable = [
    { min: 39, max: 40, ielts: 9.0 },
    { min: 37, max: 38, ielts: 8.5 },
    { min: 35, max: 36, ielts: 8.0 },
    { min: 33, max: 34, ielts: 7.5 },
    { min: 30, max: 32, ielts: 7.0 },
    { min: 27, max: 29, ielts: 6.5 },
    { min: 23, max: 26, ielts: 6.0 },
    { min: 19, max: 22, ielts: 5.5 },
    { min: 15, max: 18, ielts: 5.0 },
    { min: 13, max: 14, ielts: 4.5 },
    { min: 10, max: 12, ielts: 4.0 },
    { min: 8, max: 9, ielts: 3.5 },
    { min: 6, max: 7, ielts: 3.0 }
  ];
  
  // Tìm điểm IELTS tương ứng
  for (const range of ieltsConversionTable) {
    if (score40 >= range.min && score40 <= range.max) {
      return {
        ieltsScore: range.ielts,
        score40: score40,
        percentage: percentage
      };
    }
  }
  
  // Nếu dưới 6 điểm thì trả về 3.0 (mức thấp nhất)
  return {
    ieltsScore: 3.0,
    score40: score40,
    percentage: percentage
  };
}

// Hàm utility để tính điểm chính xác cho từng loại câu hỏi
function calculateQuestionScore(question, userAnswer) {
  const maxScore = question.score || 1;
  let isCorrect = false;
  let earnedScore = 0;
  
  // Kiểm tra nếu không có câu trả lời
  if (userAnswer === undefined || userAnswer === null || userAnswer === '') {
    return { isCorrect: false, earnedScore: 0 };
  }
  
  try {
    switch (question.questionType || question.type) {
      case 'multiple_choice':
        if (question.multipleAnswers) {
          // Câu hỏi nhiều đáp án
          let userAnswerArray = Array.isArray(userAnswer) ? userAnswer : 
                              (typeof userAnswer === 'string' ? JSON.parse(userAnswer) : [userAnswer]);
          let correctAnswerArray = Array.isArray(question.correctAnswer) ? question.correctAnswer : 
                                 (typeof question.correctAnswer === 'string' ? JSON.parse(question.correctAnswer) : [question.correctAnswer]);
          
          const sortedUserAnswers = [...userAnswerArray].sort();
          const sortedCorrectAnswers = [...correctAnswerArray].sort();
          isCorrect = JSON.stringify(sortedUserAnswers) === JSON.stringify(sortedCorrectAnswers);
        } else {
          // Câu hỏi một đáp án
          isCorrect = String(userAnswer) === String(question.correctAnswer);
        }
        earnedScore = isCorrect ? maxScore : 0;
        break;
        
      case 'true_false_not_given':
        isCorrect = String(userAnswer).toLowerCase() === String(question.correctAnswer).toLowerCase();
        earnedScore = isCorrect ? maxScore : 0;
        break;
        
      case 'fill_blank':
        let userAnswerObj = {};
        let correctAnswerObj = {};
        
        // Parse user answer
        if (typeof userAnswer === 'object' && userAnswer !== null) {
          userAnswerObj = userAnswer;
        } else if (typeof userAnswer === 'string') {
          try {
            userAnswerObj = JSON.parse(userAnswer);
          } catch {
            userAnswerObj = { 0: userAnswer };
          }
        }
        
        // Parse correct answer
        if (typeof question.correctAnswer === 'object' && question.correctAnswer !== null) {
          correctAnswerObj = question.correctAnswer;
        } else if (typeof question.correctAnswer === 'string') {
          try {
            correctAnswerObj = JSON.parse(question.correctAnswer);
          } catch {
            correctAnswerObj = { 0: question.correctAnswer };
          }
        }
        
        // Tính số câu đúng
        let correctCount = 0;
        let totalPositions = Object.keys(correctAnswerObj).length;
        
        for (const key of Object.keys(correctAnswerObj)) {
          const userValue = userAnswerObj[key] ? String(userAnswerObj[key]).trim().toLowerCase() : '';
          const correctValue = String(correctAnswerObj[key]).trim().toLowerCase();
          
          if (userValue === correctValue) {
            correctCount++;
          }
        }
        
                 // Tính điểm theo tỷ lệ: (số đúng / tổng số) * điểm tối đa
         isCorrect = correctCount === totalPositions && totalPositions > 0;
         earnedScore = totalPositions > 0 ? Math.round((correctCount / totalPositions) * maxScore) : 0;
        break;
        
      case 'matching':
        let userMatchObj = {};
        let correctMatchObj = {};
        
        // Parse user answer
        if (typeof userAnswer === 'object' && userAnswer !== null) {
          userMatchObj = userAnswer;
        } else if (typeof userAnswer === 'string') {
          try {
            userMatchObj = JSON.parse(userAnswer);
          } catch {
            userMatchObj = {};
          }
        }
        
        // Parse correct answer - Xử lý cấu trúc phức tạp
        if (typeof question.correctAnswer === 'object' && question.correctAnswer !== null) {
          correctMatchObj = question.correctAnswer;
          
          // Kiểm tra nếu có cấu trúc với type và selections
          if (correctMatchObj.type && correctMatchObj.selections) {
            correctMatchObj = correctMatchObj.selections;
          }
        } else if (typeof question.correctAnswer === 'string') {
          try {
            const parsed = JSON.parse(question.correctAnswer);
            // Kiểm tra nếu có cấu trúc với type và selections
            if (parsed.type && parsed.selections) {
              correctMatchObj = parsed.selections;
            } else {
              correctMatchObj = parsed;
            }
          } catch {
            correctMatchObj = {};
          }
        }
        
        // Tính số cặp ghép đúng
        let matchCorrectCount = 0;
        let totalMatches = Object.keys(correctMatchObj).length;
        
        for (const key of Object.keys(correctMatchObj)) {
          const userValue = userMatchObj[key] !== undefined ? String(userMatchObj[key]) : '';
          const correctValue = String(correctMatchObj[key]);
          
          if (userValue === correctValue) {
            matchCorrectCount++;
          }
        }
        
                 // Tính điểm theo tỷ lệ: (số đúng / tổng số) * điểm tối đa
         isCorrect = matchCorrectCount === totalMatches && totalMatches > 0;
         earnedScore = totalMatches > 0 ? Math.round((matchCorrectCount / totalMatches) * maxScore) : 0;
        break;
        
      case 'short_answer':
        const normalizedUserAnswer = String(userAnswer).trim().toLowerCase();
        
        // Lấy danh sách các đáp án chấp nhận được
        let acceptableAnswers = [];
        
        if (question.acceptableShortAnswers && Array.isArray(question.acceptableShortAnswers)) {
          acceptableAnswers = question.acceptableShortAnswers;
        } else if (question.correctAnswer) {
          acceptableAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer];
        }
        
        // Chuẩn hóa tất cả các đáp án chấp nhận được
        const normalizedAcceptableAnswers = acceptableAnswers.map(answer => 
          String(answer).trim().toLowerCase()
        );
        
        // Kiểm tra xem đáp án của người dùng có nằm trong danh sách không
        isCorrect = normalizedAcceptableAnswers.includes(normalizedUserAnswer);
        earnedScore = isCorrect ? maxScore : 0;
        break;
        
      default:
        isCorrect = false;
        earnedScore = 0;
    }
  } catch (error) {
    console.error('Error calculating question score:', error);
    isCorrect = false;
    earnedScore = 0;
  }
  
  return { isCorrect, earnedScore };
}

async function recalculateScores() {
  try {
    console.log('Bắt đầu tính lại điểm số cho tất cả các bài test...');
    
    // Lấy tất cả các attempt
    const attempts = await UserAttempt.find({}).populate({
      path: 'test',
      populate: {
        path: 'passages.questions',
        model: 'Question'
      }
    });
    
    console.log(`Tìm thấy ${attempts.length} bài test cần tính lại điểm.`);
    
    for (let i = 0; i < attempts.length; i++) {
      const attempt = attempts[i];
      console.log(`Đang xử lý attempt ${i + 1}/${attempts.length}: ${attempt._id}`);
      
      if (!attempt.test || !attempt.test.passages) {
        console.log(`Bỏ qua attempt ${attempt._id} - không có dữ liệu test hợp lệ`);
        continue;
      }
      
      let totalScore = 0;
      let totalPossibleScore = 0;
      const updatedAnswers = [];
      
      // Tạo map để tìm nhanh câu hỏi theo ID
      const questionMap = new Map();
      for (const passage of attempt.test.passages) {
        if (passage.questions) {
          for (const question of passage.questions) {
            questionMap.set(question._id.toString(), question);
            totalPossibleScore += (question.score || 1);
          }
        }
      }
      
      // Tính lại điểm cho từng câu trả lời
      for (const answer of attempt.answers) {
        const question = questionMap.get(answer.questionId.toString());
        
        if (question) {
          const result = calculateQuestionScore(question, answer.userAnswer);
          
          updatedAnswers.push({
            questionId: answer.questionId,
            userAnswer: answer.userAnswer,
            isCorrect: result.isCorrect,
            score: result.earnedScore
          });
          
          totalScore += result.earnedScore;
          
          console.log(`  Question ${answer.questionId}: ${answer.isCorrect ? 'Đúng' : 'Sai'} -> ${result.isCorrect ? 'Đúng' : 'Sai'}, Điểm: ${answer.score} -> ${result.earnedScore}`);
        } else {
          // Giữ nguyên nếu không tìm thấy câu hỏi
          updatedAnswers.push(answer);
          totalScore += (answer.score || 0);
        }
      }
      
      // Tính điểm IELTS
      const ieltsResult = convertToIELTSScore(totalScore, totalPossibleScore);
      
      // Cập nhật attempt
      const newPercentageScore = totalPossibleScore > 0 ? (totalScore / totalPossibleScore) * 100 : 0;
      
      await UserAttempt.findByIdAndUpdate(attempt._id, {
        answers: updatedAnswers,
        score: totalScore,
        totalPossibleScore: totalPossibleScore,
        percentageScore: newPercentageScore,
        ieltsScore: ieltsResult.ieltsScore,
        ieltsScore40: ieltsResult.score40
      });
      
      console.log(`  Cập nhật xong: ${attempt.score} -> ${totalScore} điểm (${attempt.percentageScore.toFixed(2)}% -> ${newPercentageScore.toFixed(2)}%) - IELTS: ${ieltsResult.ieltsScore}`);
    }
    
    console.log('Hoàn thành việc tính lại điểm số!');
    
  } catch (error) {
    console.error('Lỗi khi tính lại điểm số:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Chạy script
recalculateScores(); 