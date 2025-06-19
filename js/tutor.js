// Zmienne związane z ćwiczeniami
let currentExercise = 0;
let exerciseMode = false;
let exerciseStartTime = null;
let exerciseAnswers = [];

// Chat z korepetytorem
function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (message) {
        addStudentMessage(message);
        input.value = '';
        
        // Symulacja odpowiedzi korepetytora
        setTimeout(() => {
            respondToStudent(message);
        }, 1000);
    }
}

function addStudentMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message student-message';
    messageDiv.textContent = message;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addTutorMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message tutor-message';
    messageDiv.innerHTML = message;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function respondToStudent(message) {
    const lowerMessage = message.toLowerCase();
    let response;

    if (lowerMessage.includes('pomoc') || lowerMessage.includes('help')) {
        response = "ok, pomagam. możesz zapytać o konkretne zadania albo poprosić żebym wytłumaczył jakiś temat. co konkretnie nie gra";
    } else if (lowerMessage.includes('matematyka') || lowerMessage.includes('mat')) {
        response = "matma... ok. która część sprawia ci problemy? funkcje, równania, geometria? to wszystko da się ogarnąć ale trzeba poćwiczyć";
    } else if (lowerMessage.includes('polski') || lowerMessage.includes('literatura')) {
        response = "polski może być spoko jak się da zrozumieć o co chodzi w tych wszystkich lekturach. może poćwiczymy analizę tekstu albo rozprawkę";
    } else if (lowerMessage.includes('trudne') || lowerMessage.includes('nie rozumiem')) {
        response = "każdy czasem nie łapie. to normalne że bywa trudno, ale da się to przebić. nie poddawaj się od razu";
    } else if (lowerMessage.includes('egzamin') || lowerMessage.includes('poprawka')) {
        response = "poprawka to druga szansa więc trzeba ją wykorzystać. mamy jeszcze trochę czasu więc spoko. lepiej się uczyć systematycznie niż na ostatnią chwilę";
    } else {
        const responses = [
            "hmm, rozwiń to trochę",
            "dobra obserwacja, myśl dalej",
            "okej, a co dalej",
            "interesujące, jak to widzisz",
            "spoko, gadaj śmiało"
        ];
        response = responses[Math.floor(Math.random() * responses.length)];
    }

    addTutorMessage(response);
}

function startLearningSession() {
    addTutorMessage(`okej, zaczynamy sesję nauki. na co masz ochotę 
    <br><br>
    <button class="btn" onclick="startMathSession()">matma</button>
    <button class="btn" onclick="startPolishSession()">polski</button>
    <br><br>
    wybieraj co chcesz`);
}

function startMathSession() {
    addTutorMessage(`no to matma. która część cię interesuje
    <br><br>
    <button class="btn" onclick="startQuadraticFunctions()">funkcje kwadratowe</button>
    <button class="btn" onclick="startLinearFunctions()">funkcje liniowe</button>
    <button class="btn" onclick="startTrigonometry()">trygonometria</button>
    <button class="btn" onclick="startGeometry()">geometria</button>
    <br><br>albo napisz z czym masz problem`);
}

function startPolishSession() {
    addTutorMessage(`polski... ok, co robimy<br><br>• analiza lektury<br>• pisanie wypracowań<br>• figury stylistyczne<br>• ortografia<br><br>napisz z czym potrzebujesz pomocy`);
}

// Rozpoczęcie sesji z funkcjami kwadratowymi
function startQuadraticFunctions() {
    currentExercise = 0;
    exerciseMode = true;
    exerciseStartTime = new Date();
    exerciseAnswers = [];
    
    addTutorMessage(`funkcje kwadratowe... okej. przygotowałem 10 zadań na podstawowym poziomie<br><br>
    jak będziesz potrzebować pomocy to pisz. nie ma co się stresować<br><br>
    <strong>zaczynamy</strong>`);
    
    setTimeout(() => {
        showCurrentExercise();
    }, 2000);
}

// Wyświetlenie aktualnego zadania
function showCurrentExercise() {
    if (currentExercise >= quadraticExercises.length) {
        finishExerciseSession();
        return;
    }

    const exercise = quadraticExercises[currentExercise];
    const progress = ((currentExercise + 1) / quadraticExercises.length * 100).toFixed(0);
    
    addTutorMessage(`
        <div style="border: 2px solid #4facfe; border-radius: 15px; padding: 20px; margin: 10px 0; background: rgba(255,255,255,0.9);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <strong style="color: #4a5568;">Zadanie ${exercise.id}/10</strong>
                <div style="background: #4facfe; color: white; padding: 5px 10px; border-radius: 15px; font-size: 0.8em;">
                    ${exercise.difficulty}
                </div>
            </div>
            
            <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 15px; border-radius: 10px; margin: 10px 0;">
                <div style="font-size: 1.1em; font-weight: 600; color: #2d3748;">
                    📝 ${exercise.question}
                </div>
            </div>
            
            <div style="margin: 15px 0;">
                <div style="background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden;">
                    <div style="background: #4facfe; height: 100%; width: ${progress}%; transition: width 0.5s ease;"></div>
                </div>
                <small style="color: #718096;">Postęp: ${progress}%</small>
            </div>
            
            <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 15px;">
                <button class="btn" onclick="showHint()" style="font-size: 0.9em; padding: 8px 15px;">podpowiedź</button>
                <button class="btn" onclick="submitExerciseAnswer()" style="font-size: 0.9em; padding: 8px 15px;">sprawdź</button>
                <button class="btn" onclick="skipExercise()" style="font-size: 0.9em; padding: 8px 15px; background: #718096;">pomiń</button>
            </div>
        </div>
        
        <div style="margin: 10px 0; padding: 10px; background: #f0fff4; border-radius: 8px; border-left: 4px solid #48bb78;">
            <strong>napisz odpowiedź poniżej i kliknij sprawdź</strong>
        </div>
    `);
}

// Pokazanie podpowiedzi
function showHint() {
    const exercise = quadraticExercises[currentExercise];
    const hint = exercise.hints[Math.min(exerciseAnswers.filter(a => a.exerciseId === exercise.id).length, exercise.hints.length - 1)];
    
    addTutorMessage(`<strong>podpowiedź:</strong> ${hint}<br><br>luz, czasem każdy potrzebuje pomocy`);
}

// Sprawdzenie odpowiedzi
function submitExerciseAnswer() {
    const input = document.getElementById('chatInput');
    const userAnswer = input.value.trim();
    
    if (!userAnswer) {
        addTutorMessage("napisz najpierw odpowiedź");
        return;
    }
    
    addStudentMessage(userAnswer);
    input.value = '';
    
    const exercise = quadraticExercises[currentExercise];
    exerciseAnswers.push({
        exerciseId: exercise.id,
        userAnswer: userAnswer,
        correctAnswer: exercise.answer,
        timestamp: new Date()
    });
    
    // Prosta weryfikacja odpowiedzi (można ulepszyć)
    const isCorrect = checkAnswer(userAnswer, exercise.answer);
    
    if (isCorrect) {
        addTutorMessage(`<strong>git, masz to</strong><br><br>
        prawidłowa odpowiedź: ${exercise.answer}<br><br>
        poszło spoko, zobaczymy czy dasz radę z następnym`);
        
        setTimeout(() => {
            currentExercise++;
            showCurrentExercise();
        }, 3000);
    } else {
        addTutorMessage(`<strong>nie tym razem</strong><br><br>
        twoja odpowiedź: "${userAnswer}"<br>
        nie, to nie to. ale spoko, każdy się myli<br><br>
        chcesz spróbować jeszcze raz czy pokazać ci jak to zrobić<br><br>
        <button class="btn" onclick="showHint()" style="font-size: 0.9em;">podpowiedź</button>
        <button class="btn" onclick="showSolution()" style="font-size: 0.9em;">pokaż rozwiązanie</button>
        <button class="btn" onclick="tryAgain()" style="font-size: 0.9em;">jeszcze raz</button>`);
    }
}

// Pokazanie rozwiązania
function showSolution() {
    const exercise = quadraticExercises[currentExercise];
    addTutorMessage(`<strong>jak to zrobić:</strong><br><br>
    ${exercise.question}<br><br>
    <strong>odpowiedź:</strong> ${exercise.answer}<br><br>
    jasne teraz? lecimy dalej<br><br>
    <button class="btn" onclick="nextExercise()" style="font-size: 0.9em;">następne zadanie</button>`);
}

// Następne zadanie
function nextExercise() {
    currentExercise++;
    showCurrentExercise();
}

// Ponowna próba
function tryAgain() {
    addTutorMessage("okej, próbuj jeszcze raz. napisz odpowiedź");
}

// Pominięcie zadania
function skipExercise() {
    const exercise = quadraticExercises[currentExercise];
    addTutorMessage(`spoko, pomijamy<br><br>
    <strong>żeby wiedziałeś, prawidłowa odpowiedź to:</strong> ${exercise.answer}<br><br>
    idziemy dalej`);
    
    setTimeout(() => {
        currentExercise++;
        showCurrentExercise();
    }, 2000);
}

// Zakończenie sesji ćwiczeń
function finishExerciseSession() {
    exerciseMode = false;
    const sessionTime = Math.round((new Date() - exerciseStartTime) / 1000 / 60);
    const correctAnswers = exerciseAnswers.filter(a => checkAnswer(a.userAnswer, a.correctAnswer)).length;
    const score = Math.round((correctAnswers / quadraticExercises.length) * 100);
    
    // Aktualizacja danych
    studentData.math.totalSessions++;
    studentData.math.timeSpent += sessionTime / 60;
    studentData.math.recentScores.push(score);
    
    if (score >= 70) {
        studentData.math.completedTopics++;
        if (!studentData.math.achievements.includes("funkcje kwadratowe")) {
            studentData.math.achievements.push("funkcje kwadratowe");
        }
    }
    
    // Aktualizacja średniej
    const scores = studentData.math.recentScores;
    studentData.math.averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    
    saveData();
    updateDashboard();
    
    addTutorMessage(`skończone. oto jak poszło<br><br>
    <strong>wyniki:</strong><br>
    • poprawne odpowiedzi: ${correctAnswers}/10<br>
    • wynik: ${score}%<br>
    • czas: ${sessionTime} minut<br><br>
    ${score >= 80 ? "niezły wynik, git" : 
      score >= 60 ? "okej, da się żyć" : 
      "hmm, trzeba jeszcze poćwiczyć"}<br><br>
    chcesz porobić jeszcze coś czy na dziś wystarczy`);
}

function getEncouragement(score) {
    if (score >= 80) return "poszło spoko, niezły wynik";
    if (score >= 60) return "okej, da się żyć z tym wynikiem";
    if (score >= 40) return "trzeba jeszcze popracować ale nie jest źle";
    return "hmm, nie było najlepiej ale da się to poprawić";
}

// Inne funkcje matematyczne (placeholder)
function startLinearFunctions() {
    addTutorMessage("funkcje liniowe jeszcze nie gotowe. na razie pograj z funkcjami kwadratowymi");
}

function startTrigonometry() {
    addTutorMessage("trygonometria będzie niedługo. trzymaj się na razie funkcji kwadratowych");
}

function startGeometry() {
    addTutorMessage("geometria w przygotowaniu. skup się teraz na funkcjach kwadratowych");
}

// Funkcje dodatkowe
function practiceWeakArea(subject) {
    const area = studentData[subject].weakAreas[0];
    addTutorMessage(`ćwiczymy słaby obszar: ${area}. to świetnie że chcesz poprawić swoje słabsze strony. zaczynajmy`);
}

function generateDailyPlan() {
    const mathTopic = getRandomMathTopic();
    const polishTopic = getRandomPolishTopic();
    
    addTutorMessage(`nowy plan dnia<br><br>
    <strong>rano (9:00-10:30):</strong> matma - ${mathTopic}<br>
    <strong>przerwa:</strong> 30 min relaksu<br>
    <strong>popołudnie (15:00-16:30):</strong> polski - ${polishTopic}<br><br>
    pamiętaj że regularne przerwy to nie lenistwo tylko mądrość`);
}
