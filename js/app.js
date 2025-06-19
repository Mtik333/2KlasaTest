// Dane ucznia (przechowywane w pamięci przeglądarki)
let studentData = {
    math: {
        totalSessions: 0,
        completedTopics: 0,
        totalTopics: 15,
        averageScore: 0,
        timeSpent: 0,
        lastSession: null,
        recentScores: [],
        weakAreas: ['Funkcje', 'Geometria'],
        achievements: []
    },
    polish: {
        totalSessions: 0,
        completedTopics: 0,
        totalTopics: 12,
        averageScore: 0,
        timeSpent: 0,
        lastSession: null,
        recentScores: [],
        weakAreas: ['Analiza tekstu', 'Ortografia'],
        achievements: []
    }
};

let currentSubject = 'math';
let chatHistory = [];

// Wczytanie danych z localStorage
function loadData() {
    const saved = localStorage.getItem('tutorSystemData');
    if (saved) {
        studentData = JSON.parse(saved);
    }
    updateDashboard();
}

// Zapisanie danych do localStorage
function saveData() {
    localStorage.setItem('tutorSystemData', JSON.stringify(studentData));
}

// Przełączanie między przedmiotami
function switchSubject(subject) {
    currentSubject = subject;
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    updateDashboard();
}

// Aktualizacja dashboardu
function updateDashboard() {
    const dashboard = document.getElementById('dashboard');
    
    if (currentSubject === 'overall') {
        dashboard.innerHTML = generateOverallDashboard();
    } else {
        dashboard.innerHTML = generateSubjectDashboard(currentSubject);
    }
}

// Generowanie dashboardu dla przedmiotu
function generateSubjectDashboard(subject) {
    const data = studentData[subject];
    const subjectName = subject === 'math' ? 'Matematyka' : 'Język Polski';
    const icon = subject === 'math' ? '📊' : '📚';
    
    return `
        <div class="card">
            <h3>${icon} Postęp w: ${subjectName}</h3>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${(data.completedTopics / data.totalTopics) * 100}%"></div>
            </div>
            <p>${data.completedTopics} / ${data.totalTopics} tematów ukończonych</p>
            
            <div class="stats">
                <div class="stat-item">
                    <span class="stat-number">${data.totalSessions}</span>
                    <small>Sesji</small>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${data.averageScore}%</span>
                    <small>Średnia</small>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${Math.round(data.timeSpent)}</span>
                    <small>Godzin</small>
                </div>
            </div>
            
            <button class="btn" onclick="addTestSession('${subject}')">Dodaj Sesję Testową</button>
        </div>

        <div class="card">
            <h3>🎯 Słabe Obszary</h3>
            ${data.weakAreas.map(area => `
                <div style="margin: 8px 0; padding: 8px; background: #fed7d7; border-radius: 5px; color: #c53030;">
                    ${area}
                </div>
            `).join('')}
            <button class="btn" onclick="practiceWeakArea('${subject}')">Ćwicz Słabe Obszary</button>
        </div>

        <div class="card">
            <h3>📈 Ostatnie Wyniki</h3>
            ${data.recentScores.length > 0 ? 
                data.recentScores.slice(-5).map((score, index) => `
                    <div style="margin: 5px 0; padding: 8px; background: ${score >= 70 ? '#c6f6d5' : score >= 50 ? '#fef5e7' : '#fed7d7'}; border-radius: 5px;">
                        Sesja ${data.recentScores.length - 4 + index}: ${score}%
                    </div>
                `).join('') : 
                '<p>Brak jeszcze wyników - rozpocznij pierwszą sesję!</p>'
            }
        </div>

        <div class="card">
            <h3>🏆 Osiągnięcia</h3>
            <div class="achievements">
                ${data.achievements.length > 0 ? 
                    data.achievements.map(achievement => `<div class="achievement">${achievement}</div>`).join('') :
                    '<p>Pierwsze osiągnięcia czekają na Ciebie!</p>'
                }
            </div>
        </div>
    `;
}

// Generowanie ogólnego dashboardu
function generateOverallDashboard() {
    const totalSessions = studentData.math.totalSessions + studentData.polish.totalSessions;
    const totalTime = studentData.math.timeSpent + studentData.polish.timeSpent;
    const overallProgress = ((studentData.math.completedTopics + studentData.polish.completedTopics) / 
                           (studentData.math.totalTopics + studentData.polish.totalTopics)) * 100;

    return `
        <div class="card">
            <h3>📊 Ogólny Postęp</h3>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${overallProgress}%"></div>
            </div>
            <p>Ukończono ${Math.round(overallProgress)}% materiału</p>
            
            <div class="stats">
                <div class="stat-item">
                    <span class="stat-number">${totalSessions}</span>
                    <small>Wszystkich Sesji</small>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${Math.round(totalTime)}</span>
                    <small>Godzin Nauki</small>
                </div>
            </div>
        </div>

        <div class="card">
            <h3>📅 Plan Dnia</h3>
            <div style="padding: 15px; background: #f0fff4; border-radius: 8px; margin: 10px 0;">
                <strong>Dziś zaplanowane:</strong><br>
                📊 Matematyka: 1.5h - ${getRandomMathTopic()}<br>
                📚 Polski: 1.5h - ${getRandomPolishTopic()}
            </div>
            <button class="btn" onclick="generateDailyPlan()">Wygeneruj Nowy Plan</button>
        </div>

        <div class="card">
            <h3>⏰ Do Egzaminu Zostało</h3>
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 3em; font-weight: bold; color: #e53e3e;">${getDaysToExam()}</div>
                <div style="font-size: 1.2em; color: #718096;">dni</div>
            </div>
            ${getDaysToExam() <= 30 ? '<div style="color: #e53e3e; font-weight: bold;">⚡ Czas na intensywną naukę!</div>' : ''}
        </div>

        <div class="card">
            <h3>💡 Motywacyjna Wskazówka Dnia</h3>
            <div style="padding: 15px; background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); border-radius: 8px; font-style: italic;">
                "${getMotivationalTip()}"
            </div>
        </div>
    `;
}

// Pomocnicze funkcje
function getRandomMathTopic() {
    const topics = ['Funkcje liniowe', 'Równania kwadratowe', 'Geometria analityczna', 'Trygonometria', 'Logarytmy'];
    return topics[Math.floor(Math.random() * topics.length)];
}

function getRandomPolishTopic() {
    const topics = ['Analiza "Lalki"', 'Romantyzm', 'Techniki poetyckie', 'Wypracowanie - rozprawka', 'Interpunkcja'];
    return topics[Math.floor(Math.random() * topics.length)];
}

function getDaysToExam() {
    const examDate = new Date('2025-08-29'); // Ostatni tydzień sierpnia
    const today = new Date();
    const diffTime = examDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
}

function getMotivationalTip() {
    const tips = [
        "Każdy ekspert był kiedyś początkującym!",
        "Nie liczą się upadki, tylko to, ile razy się podnosisz.",
        "Sukces to 1% inspiracji i 99% transpiracji.",
        "Mózg to mięsień - im więcej go ćwiczysz, tym silniejszy się staje!",
        "Każda minuta nauki to inwestycja w swoją przyszłość!"
    ];
    return tips[Math.floor(Math.random() * tips.length)];
}

// Dodawanie sesji testowej
function addTestSession(subject) {
    const score = prompt(`Podaj wynik z sesji ${subject === 'math' ? 'matematyki' : 'polskiego'} (0-100):`);
    if (score !== null && score !== '') {
        const numScore = parseInt(score);
        if (numScore >= 0 && numScore <= 100) {
            studentData[subject].recentScores.push(numScore);
            studentData[subject].totalSessions++;
            studentData[subject].timeSpent += 1.5; // Zakładamy 1.5h na sesję
            
            // Aktualizacja średniej
            const scores = studentData[subject].recentScores;
            studentData[subject].averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
            
            // Sprawdzenie osiągnięć
            checkAchievements(subject, numScore);
            
            saveData();
            updateDashboard();
            
            addTutorMessage(`właśnie dodałem wynik ${numScore}% z ${subject === 'math' ? 'matematyki' : 'polskiego'}. ${getEncouragement(numScore)}`);
        }
    }
}

function checkAchievements(subject, score) {
    const data = studentData[subject];
    const achievements = data.achievements;
    
    if (data.totalSessions === 1 && !achievements.includes("Pierwszy Krok")) {
        achievements.push("Pierwszy Krok");
    }
    if (score >= 90 && !achievements.includes("Mistrz")) {
        achievements.push("Mistrz");
    }
    if (data.totalSessions >= 10 && !achievements.includes("Wytrwały")) {
        achievements.push("Wytrwały");
    }
}

// Obsługa Enter w polu chat
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('chatInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            if (exerciseMode) {
                submitExerciseAnswer();
            } else {
                sendMessage();
            }
        }
    });
    
    // Inicjalizacja
    loadData();
});