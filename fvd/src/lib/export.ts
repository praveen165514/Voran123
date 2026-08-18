import * as XLSX from 'xlsx';
import { Quiz, Participant, Response } from '../types';

export const exportResultsToExcel = (quiz: Quiz, participants: Participant[], responses: Response[]) => {
  // Sheet 1: Leaderboard
  const leaderboardData = participants.map((p, index) => ({
    'Rank': index + 1,
    'Student Name': p.name,
    'Total Score': p.score,
    'Correct Answers': p.correctAnswers,
    'Questions Attempted': p.questionsAttempted,
    'Accuracy': p.questionsAttempted > 0 ? `${Math.round((p.correctAnswers / p.questionsAttempted) * 100)}%` : '0%',
  }));

  const leaderboardSheet = XLSX.utils.json_to_sheet(leaderboardData);

  // Sheet 2: Detailed Performance
  // Map responses by participant
  const detailedData: any[] = [];
  
  participants.forEach(p => {
    // Get all responses for this participant
    const studentResponses = responses.filter(r => r.participantId === p.id);
    
    // Create a row for this student
    const studentRow: any = {
      'Student Name': p.name,
      'Total Score': p.score,
    };

    // Add columns for each question
    quiz.questions.forEach((q, idx) => {
      const resp = studentResponses.find(r => r.questionId === q.id);
      studentRow[`Q${idx + 1} Status`] = resp ? (resp.isCorrect ? 'Correct' : 'Incorrect') : 'Not Answered';
      studentRow[`Q${idx + 1} Points`] = resp ? resp.pointsEarned : 0;
      studentRow[`Q${idx + 1} Time (s)`] = resp ? (resp.responseTime / 1000).toFixed(1) : '-';
    });

    detailedData.push(studentRow);
  });

  const detailedSheet = XLSX.utils.json_to_sheet(detailedData);

  // Sheet 3: Question Analytics (Optional, but useful)
  const analyticsData = quiz.questions.map((q, idx) => {
    const qResponses = responses.filter(r => r.questionId === q.id);
    const correctCount = qResponses.filter(r => r.isCorrect).length;
    const answeredCount = qResponses.length;
    
    return {
      'Question': `Q${idx + 1}`,
      'Text': q.text,
      'Total Answers': answeredCount,
      'Correct Answers': correctCount,
      'Success Rate': answeredCount > 0 ? `${Math.round((correctCount / answeredCount) * 100)}%` : '0%',
    };
  });

  const analyticsSheet = XLSX.utils.json_to_sheet(analyticsData);

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, leaderboardSheet, "Leaderboard");
  XLSX.utils.book_append_sheet(wb, detailedSheet, "Student Details");
  XLSX.utils.book_append_sheet(wb, analyticsSheet, "Question Analytics");

  // Generate and download file
  const fileName = `${quiz.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_results.xlsx`;
  XLSX.writeFile(wb, fileName);
};
