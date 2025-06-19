// Zmienne związane z ćwiczeniami
let currentExercise = 0;
let exerciseMode = false;
let exerciseStartTime = null;
let exerciseAnswers = [];

// Claude API Configuration
class ClaudeIntegration {
    constructor() {
        this.apiKey = localStorage.getItem('claude_api_key') || null;
        this.baseURL = 'https://api.anthropic.com/v1/messages';
        this.studentProfile = this.loadStudentProfile();
        this.conversationHistory = [];
    }

    // Ustawienie klucza API
    async setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('claude_api_key', key);
        
        // Test połączenia
        try {
            await this.testConnection();
            return { success: true, message: "Połączenie z Claude API działa!" };
        } catch (error) {
            this.apiKey = null;
            localStorage.removeItem('claude_api_key');
            return { success: false, message: "Błąd połączenia: " + error.message };
        }
    }

    // Test połączenia z API
    async testConnection() {
        const response = await fetch(this.baseURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: "claude-3-sonnet-20240229",
                max_tokens: 50,
                messages: [{ 
                    role: "user", 
                    content: "Odpowiedz krótko: 'test połączenia ok'" 
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    }

    // Główna funkcja komunikacji z Claude
    async askClaude(message, context = {}) {
        if (!this.apiKey) {
            return this.getFallbackResponse(message);
        }

        try {
            const prompt = this.buildSystemPrompt(context);
            const userMessage = this.buildUserMessage(message, context);

            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: "claude-3-sonnet-20240229",
                    max_tokens: 300,
                    messages: [
                        { role: "user", content: prompt + "\n\nUCZEŃ: " + userMessage }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            const aiResponse = data.content[0].text;

            // Zapisz interakcję
            this.recordInteraction(message, aiResponse, context);
            
            return aiResponse;

        } catch (error) {
            console.error('Claude API Error:', error);
            return this.getFallbackResponse(message);
        }
    }

    // Budowanie systemu prompt dla Claude
    buildSystemPrompt(context) {
        const profile = this.studentProfile;
        
        return `Jesteś Alex - flegmatyczny korepetytor AI dla ucznia 2 klasy liceum. 

TWÓJ STYL:
- piszesz małymi literami na początku zdań (czasem zapominasz o wielkiej literze)
- NIE używasz emoji ani wykrzykników  
- młodzieżowy język: "okej", "spoko", "luz", "git", "no to"
- flegmatyczny ton - bez przesadnego entuzjazmu
- realistyczne oceny: "poszło spoko" zamiast "fantastycznie!"
- czasem krótkie odpowiedzi

PROFIL UCZNIA:
- Łącznie sesji: ${profile.totalSessions}
- Średni wynik: ${profile.averageScore}%
- Często używa podpowiedzi: ${profile.hintsUsageRate > 0.7 ? 'tak' : 'nie'}
- Często pomija zadania: ${profile.skipRate > 0.3 ? 'tak' : 'nie'}
- Ostatnie 3 wyniki: ${profile.recentScores.slice(-3).join('%, ')}%
- Obecny poziom frustracji: ${profile.frustrationLevel}/10
- Słabe obszary: ${profile.weakAreas.join(', ')}
- Na co dobrze reaguje: ${profile.respondsWellTo.join(', ')}

OBECNA SESJA:
${context.exerciseMode ? `
- Tryb ćwiczeń: AKTYWNY (${context.currentExercise}/10 zadanie)
- Poprawnych w tej sesji: ${context.correctInSession}
- Użyto podpowiedzi: ${context.hintsUsedInSession} razy
- Czas sesji: ${context.sessionTimeMinutes} minut
- Obecne zadanie: "${context.currentQuestion || 'brak'}"
` : '- Tryb ćwiczeń: NIEAKTYWNY (rozmowa ogólna)'}

WYTYCZNE:
1. Dostosuj ton do profilu ucznia i obecnej sytuacji
2. Jeśli uczeń się frustruje (>6/10) - uspokajaj, używaj "luz", "spoko"
3. Jeśli ma dobre wyniki - pochwal bez przesady: "git", "niezły wynik"
4. Jeśli często używa podpowiedzi - zachęcaj do samodzielności
5. Jeśli zadanie z słabego obszaru - oferuj dodatkową pomoc
6. Pamiętaj o flegmatycznym stylu - nie bądź za entuzjastyczny

PRZYKŁADY DOBREGO STYLU:
✓ "git, masz to. poszło spoko"
✓ "hmm, nie tym razem. ale luz, każdy się myli"  
✓ "okej, która część sprawia problemy"
✓ "trzeba jeszcze poćwiczyć ale da się to ogarnąć"

UNIKAJ:
✗ "Fantastycznie!" "Świetnie!" "Brawo!" 
✗ Emoji i wykrzykników
✗ Przesadnego entuzjazmu
✗ Długich wyjaśnień bez potrzeby`;
    }

    // Budowanie wiadomości użytkownika z kontekstem
    buildUserMessage(message, context) {
        let contextInfo = "";
        
        if (context.exerciseMode && context.lastInteraction) {
            contextInfo = `\n[KONTEKST: ${context.lastInteraction}]`;
        }
        
        return message + contextInfo;
    }

    // Zapisywanie interakcji dla uczenia się
    recordInteraction(userMessage, aiResponse, context) {
        const interaction = {
            timestamp: Date.now(),
            userMessage,
            aiResponse,
            context: { ...context },
            exerciseMode: exerciseMode
        };

        this.conversationHistory.push(interaction);
        
        // Zachowaj tylko ostatnie 50 interakcji
        if (this.conversationHistory.length > 50) {
            this.conversationHistory.shift();
        }

        // Aktualizuj profil ucznia
        this.updateStudentProfile(userMessage, context);
        this.saveStudentProfile();
        
        localStorage.setItem('conversation_history', JSON.stringify(this.conversationHistory));
    }

    // Aktualizacja profilu ucznia
    updateStudentProfile(message, context) {
        const profile = this.studentProfile;
        const lowerMessage = message.toLowerCase();

        // Wykrywanie frustracji
        if (lowerMessage.includes('trudne') || 
            lowerMessage.includes('nie rozumiem') || 
            lowerMessage.includes('za ciężkie') ||
            context.exerciseSkipped) {
            profile.frustrationLevel = Math.min(10, profile.frustrationLevel + 1);
        } else if (lowerMessage.includes('spoko') || 
                   lowerMessage.includes('okej') || 
                   lowerMessage.includes('git') ||
                   context.exerciseCorrect) {
            profile.frustrationLevel = Math.max(0, profile.frustrationLevel - 0.5);
        }

        // Śledzenie używania podpowiedzi
        if (context.hintUsed) {
            profile.hintsUsed++;
        }

        // Śledzenie sesji
        if (context.exerciseMode) {
            profile.totalExercises++;
            if (context.exerciseSkipped) {
                profile.exercisesSkipped++;
            }
        }

        // Obliczanie wskaźników
        profile.hintsUsageRate = profile.hintsUsed / Math.max(profile.totalExercises, 1);
        profile.skipRate = profile.exercisesSkipped / Math.max(profile.totalExercises, 1);

        // Aktualizacja obszarów gdzie uczniu idzie dobrze/słabo
        if (context.topic && context.exerciseCorrect !== undefined) {
            if (!profile.topicStats[context.topic]) {
                profile.topicStats[context.topic] = { correct: 0, total: 0 };
            }
            profile.topicStats[context.topic].total++;
            if (context.exerciseCorrect) {
                profile.topicStats[context.topic].correct++;
            }

            // Aktualizuj słabe obszary
            const topicRate = profile.topicStats[context.topic].correct / profile.topicStats[context.topic].total;
            if (topicRate < 0.6 && profile.topicStats[context.topic].total >= 3) {
                if (!profile.weakAreas.includes(context.topic)) {
                    profile.weakAreas.push(context.topic);
                }
            }
        }
    }

    // Ładowanie profilu ucznia
    loadStudentProfile() {
        const saved = localStorage.getItem('student_profile_claude');
        if (saved) {
            return JSON.parse(saved);
        }

        return {
            totalSessions: 0,
            totalExercises: 0,
            averageScore: 0,
            recentScores: [],
            hintsUsed: 0,
            hintsUsageRate: 0,
            exercisesSkipped: 0,
            skipRate: 0,
            frustrationLevel: 5, // 0-10 skala
            weakAreas: ['funkcje kwadratowe'],
            respondsWellTo: ['zachęta', 'spokojne wyjaśnienia'],
            topicStats: {},
            lastSessionDate: null
        };
    }

    // Zapisywanie profilu ucznia
    saveStudentProfile() {
        localStorage.setItem('student_profile_claude', JSON.stringify(this.studentProfile));
    }

    // Fallback odpowiedzi gdy API nie działa
    getFallbackResponse(message) {
        const responses = [
            "hmm, rozwiń to trochę",
            "okej, a co dalej",
            "spoko, myśl głośno",
            "jasne, jak to widzisz",
            "dobra obserwacja"
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // Raport o uczniu dla monitora
    generateStudentReport() {
        const profile = this.studentProfile;
        return {
            frustrationLevel: profile.frustrationLevel,
            hintsUsage: Math.round(profile.hintsUsageRate * 100),
            skipRate: Math.round(profile.skipRate * 100),
            recentTrend: this.calculateTrend(),
            weakAreas: profile.weakAreas,
            recommendations: this.generateRecommendations()
        };
    }

    calculateTrend() {
        const recent = this.studentProfile.recentScores.slice(-5);
        const older = this.studentProfile.recentScores.slice(-10, -5);
        
        if (recent.length < 3) return 'za mało danych';
        
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recentAvg;
        
        if (recentAvg > olderAvg + 5) return 'poprawia się';
        if (recentAvg < olderAvg - 5) return 'pogarsza się';
        return 'stabilny';
    }

    generateRecommendations() {
        const profile = this.studentProfile;
        const recommendations = [];
        
        if (profile.frustrationLevel > 7) {
            recommendations.push("Wysoki poziom frustracji - rozważ przerwę lub łatwiejsze zadania");
        }
        
        if (profile.hintsUsageRate > 0.7) {
            recommendations.push("Często używa podpowiedzi - może zadania są za trudne");
        }
        
        if (profile.skipRate > 0.4) {
            recommendations.push("Często pomija zadania - sprawdź motywację");
        }
        
        return recommendations;
    }
}

// Inicjalizacja Claude integration
const claudeAI = new ClaudeIntegration();

// Chat z korepetytorem
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (message) {
        addStudentMessage(message);
        input.value = '';
        
        // Pokaż że AI "myśli"
        const thinkingMsg = addTutorMessage("...");
        
        // Przygotuj kontekst
        const context = {
            exerciseMode: exerciseMode,
            currentExercise: currentExercise + 1,
            correctInSession: exerciseMode ? exerciseAnswers.filter(a => checkAnswer(a.userAnswer, a.correctAnswer)).length : 0,
            hintsUsedInSession: exerciseMode ? exerciseAnswers.filter(a => a.hintUsed).length : 0,
            sessionTimeMinutes: exerciseMode && exerciseStartTime ? Math.round((new Date() - exerciseStartTime) / 60000) : 0,
            currentQuestion: exerciseMode && currentExercise < quadraticExercises.length ? quadraticExercises[currentExercise].question : null,
            topic: exerciseMode ? 'funkcje kwadratowe' : 'ogólne'
        };
        
        // Zapytaj Claude
        const response = await claudeAI.askClaude(message, context);
        
        // Zastąp "..." prawdziwą odpowiedzią
        thinkingMsg.innerHTML = response;
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
    return messageDiv; // Zwróć element żeby można było go później modyfikować
}

// Konfiguracja Claude API
async function setupClaudeAPI() {
    const apiKey = prompt(`Wprowadź swój klucz API Anthropic Claude:

Gdzie go znaleźć:
1. Idź na: https://console.anthropic.com/
2. Zaloguj się lub załóż konto
3. Idź do "API Keys" 
4. Skopiuj klucz

Klucz API:`);
    
    if (apiKey && apiKey.trim()) {
        addTutorMessage("sprawdzam połączenie...");
        
        const result = await claudeAI.setApiKey(apiKey.trim());
        
        if (result.success) {
            addTutorMessage("okej, podłączyłem się do claude api. teraz będę się uczyć twojego stylu nauki i dostosowywać odpowiedzi");
        } else {
            addTutorMessage(`hmm, coś nie gra z api: ${result.message}<br><br>sprawdź czy klucz jest dobry albo użyj systemu bez api`);
        }
    }
}

// Funkcja fallback dla kompatybilności wstecznej  
async function respondToStudent(message) {
    // Ta funkcja jest już zastąpiona przez sendMessage() z Claude API
    // Pozostawiona dla kompatybilności
    await sendMessage();
}

function startLearningSession() {
    claudeAI.askClaude("rozpocznij sesję nauki", {
        exerciseMode: false,
        topic: 'wybór przedmiotu'
    }).then(response => {
        addTutorMessage(`${response}
        <br><br>
        <button class="btn" onclick="startMathSession()">matma</button>
        <button class="btn" onclick="startPolishSession()">polski</button>
        <br><br>
        wybieraj co chcesz`);
    });
}

function startMathSession() {
    claudeAI.askClaude("wybrano matematykę, przedstaw tematy", {
        exerciseMode: false,
        topic: 'matematyka'
    }).then(response => {
        addTutorMessage(`${response}
        <br><br>
        <button class="btn" onclick="startQuadraticFunctions()">funkcje kwadratowe</button>
        <button class="btn" onclick="startLinearFunctions()">funkcje liniowe</button>
        <button class="btn" onclick="startTrigonometry()">trygonometria</button>
        <button class="btn" onclick="startGeometry()">geometria</button>
        <br><br>albo napisz z czym masz problem`);
    });
}

function startPolishSession() {
    claudeAI.askClaude("wybrano język polski, przedstaw tematy", {
        exerciseMode: false,
        topic: 'język polski'
    }).then(response => {
        addTutorMessage(`${response}<br><br>• analiza lektury<br>• pisanie wypracowań<br>• figury stylistyczne<br>• ortografia<br><br>napisz z czym potrzebujesz pomocy`);
    });
}

// Rozpoczęcie sesji z funkcjami kwadratowymi
async function startQuadraticFunctions() {
    currentExercise = 0;
    exerciseMode = true;
    exerciseStartTime = new Date();
    exerciseAnswers = [];
    
    const response = await claudeAI.askClaude("rozpoczynamy ćwiczenia z funkcji kwadratowych", {
        exerciseMode: true,
        currentExercise: 0,
        topic: 'funkcje kwadratowe',
        totalExercises: quadraticExercises.length
    });
    
    addTutorMessage(`${response}<br><br><strong>zaczynamy</strong>`);
    
    setTimeout(() => {
        showCurrentExercise();
    }, 2000);
}

// Wyświetlenie aktualnego zadania
async function showCurrentExercise() {
    if (currentExercise >= quadraticExercises.length) {
        finishExerciseSession();
        return;
    }

    const exercise = quadraticExercises[currentExercise];
    const progress = ((currentExercise + 1) / quadraticExercises.length * 100).toFixed(0);
    
    // Poproś Claude o skomentowanie zadania
    const exerciseComment = await claudeAI.askClaude(`przedstawiam zadanie ${currentExercise + 1}: ${exercise.question}`, {
        exerciseMode: true,
        currentExercise: currentExercise + 1,
        topic: 'funkcje kwadratowe',
        exerciseType: exercise.type,
        difficulty: exercise.difficulty
    });
    
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
            
            <div style="padding: 10px; background: #f0f8ff; border-radius: 8px; margin: 10px 0; border-left: 4px solid #4facfe;">
                <strong>Alex:</strong> ${exerciseComment}
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
async function showHint() {
    const exercise = quadraticExercises[currentExercise];
    const hintIndex = Math.min(
        exerciseAnswers.filter(a => a.exerciseId === exercise.id && a.hintUsed).length,
        exercise.hints.length - 1
    );
    
    const hint = exercise.hints[hintIndex];
    
    // Zapisz że użyto podpowiedzi
    claudeAI.updateStudentProfile("", {
        hintUsed: true,
        topic: 'funkcje kwadratowe'
    });
    
    const response = await claudeAI.askClaude(`uczeń poprosił o podpowiedź do zadania: ${exercise.question}. Dostępna podpowiedź: ${hint}`, {
        exerciseMode: true,
        hintRequested: true,
        exerciseType: exercise.type,
        topic: 'funkcje kwadratowe'
    });
    
    addTutorMessage(`<strong>podpowiedź:</strong> ${hint}<br><br>${response}`);
}ises.length) {
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
