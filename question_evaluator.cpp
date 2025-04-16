#include <vector>
#include <stack>
#include <queue>
#include <cstring>

extern "C" {

// Define a struct for questions
struct Question {
    int marks;
    int difficulty; // 1 = easy, 2 = medium, 3 = hard
};

// Stack to store processing history
std::stack<Question> history;

// Priority queue to keep highest difficulty on top
struct Compare {
    bool operator()(Question a, Question b) {
        return a.difficulty < b.difficulty;
    }
};
std::priority_queue<Question, std::vector<Question>, Compare> questionQueue;

// Add a question to the evaluator
void add_question(int marks, int difficulty) {
    Question q = { marks, difficulty };
    questionQueue.push(q);
    history.push(q);
}

// Get total marks from all questions
int get_total_marks() {
    std::priority_queue<Question, std::vector<Question>, Compare> temp = questionQueue;
    int total = 0;
    while (!temp.empty()) {
        total += temp.top().marks;
        temp.pop();
    }
    return total;
}

// Get average difficulty
int get_average_difficulty() {
    std::priority_queue<Question, std::vector<Question>, Compare> temp = questionQueue;
    int total = 0;
    int count = 0;
    while (!temp.empty()) {
        total += temp.top().difficulty;
        temp.pop();
        count++;
    }
    return (count == 0) ? 0 : (total / count);
}

// Get most difficult question's marks
int get_top_question_marks() {
    if (questionQueue.empty()) return 0;
    return questionQueue.top().marks;
}

// Undo last add
void undo_last_question() {
    if (!history.empty()) history.pop();
    // (For simplicity, doesn’t remove from queue here)
}

}
