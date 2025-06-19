// Zmienne związane z ćwiczeniami
let currentExercise = 0;
let exerciseMode = false;
let exerciseStartTime = null;
let exerciseAnswers = [];

// Learning & Replay System - Uczenie się od AI, potem autonomia
class LearningReplaySystem {
    constructor() {
        this.isLearningMode = this.checkLearningMode();
        this.claudeAPI = new ClaudeIntegration();
        this.interactionDatabase = this.loadInteractionDatabase();
        this.behaviorPatterns = this.loadBehaviorPatterns();
        this.learningStartDate = this.getLearningStartDate();
        this.lastInteractionId = null;
    }

    // Sprawdź czy jesteśmy w trybie uczenia
    checkLearningMode() {
        const learningStart = localStorage.getItem('learning_mode_start');
        if (!learningStart) return false;
        
        const daysSinceLearning = (Date.now() - parseInt(learningStart)) / (1000 * 60 * 60 * 24);
        return daysSinceLearning < 7; // 7 dni uczenia się
    }

    // Rozpocznij tryb uczenia się
    async startLearningMode() {
        localStorage.setItem('learning_mode_start', Date.now().toString());
        this.isLearningMode = true;
        this.interactionDatabase = { interactions: [], patterns: {}, responses: {} };
        this.saveInteractionDatabase();
        
        return {
            success: true,
            message: "rozpoczęto 7-dniowy okres uczenia się. alex będzie się uczyć twojego stylu nauki"
        };
    }

    // Główna funkcja odpowiedzi - router
    async respondToStudent(message, context = {}) {
        // Oceń efektywność poprzedniej odpowiedzi
        if (this.lastInteractionId) {
            this.evaluateResponseEffectiveness(this.lastInteractionId, message);
        }

        if (this.isLearningMode && this.claudeAPI.apiKey) {
            // FAZA UCZENIA: Używaj AI + zapisuj wszystko
            return await this.learningPhaseResponse(message, context);
        } else {
            // FAZA AUTONOMII: Używaj zebranych danych
            return this.autonomousResponse(message, context);
        }
    }

    // Faza uczenia się - prawdziwy AI + rejestrowanie
    async learningPhaseResponse(message, context) {
        try {
            // Zapytaj prawdziwego Claude
            const aiResponse = await this.claudeAPI.askClaude(message, context);
            
            // Zapisz pełną interakcję
            const interaction = {
                id: Date.now() + Math.random(),
                timestamp: new Date().toISOString(),
                userMessage: message,
                aiResponse: aiResponse,
                context: { ...context },
                sessionType: context.exerciseMode ? 'exercise' : 'chat',
                studentState: this.analyzeStudentState(message, context),
                responseCategory: this.categorizeResponse(aiResponse),
                effectiveness: null // będzie uzupełnione później
            };

            // Zapisz do bazy danych
            this.saveInteraction(interaction);
            this.lastInteractionId = interaction.id;
            
            // Analizuj wzorce w czasie rzeczywistym
            this.updatePatternsFromInteraction(interaction);
            
            // Zwróć odpowiedź z oznaczeniem trybu uczenia
            return `${aiResponse}\n\n<small style="color: #4facfe; font-size: 0.8em;">🧠 tryb uczenia: ${this.getDaysLeft()} dni pozostało</small>`;
            
        } catch (error) {
            console.warn('Claude API error, switching to autonomous:', error);
            return this.autonomousResponse(message, context);
        }
    }

    // Faza autonomii - symulacja AI na podstawie danych
    autonomousResponse(message, context) {
        const studentState = this.analyzeStudentState(message, context);
        const responseCategory = this.determineResponseCategory(message, context, studentState);
        
        // Znajdź najlepszą odpowiedź na podstawie podobnych sytuacji
        const bestResponse = this.findBestResponse(message, context, studentState, responseCategory);
        
        // Zapisz interakcję dla dalszego uczenia się
        this.saveAutonomousInteraction(message, bestResponse, context, studentState);
        
        const modeIndicator = this.interactionDatabase.interactions.length > 0 ? 
            `\n\n<small style="color: #28a745; font-size: 0.8em;">🤖 tryb autonomiczny (${this.interactionDatabase.interactions.length} zapisanych interakcji)</small>` : '';
        
        return bestResponse + modeIndicator;
    }

    // Zapisywanie interakcji do bazy danych
    saveInteraction(interaction) {
        this.interactionDatabase.interactions.push(interaction);
        
        // Ogranicz rozmiar bazy (maksymalnie 1000 interakcji)
        if (this.interactionDatabase.interactions.length > 1000) {
            this.interactionDatabase.interactions = this.interactionDatabase.interactions.slice(-1000);
        }
        
        this.saveInteractionDatabase();
        
        // Eksportuj do localStorage jako backup
        this.exportInteractionToStorage(interaction);
    }

    // Eksport pojedynczej interakcji do storage
    exportInteractionToStorage(interaction) {
        try {
            const exportData = {
                date: new Date().toISOString().split('T')[0],
                time: new Date().toISOString().split('T')[1].split('.')[0],
                user_message: interaction.userMessage,
                ai_response: interaction.aiResponse,
                context: interaction.context,
                student_state: interaction.studentState,
                response_category: interaction.responseCategory
            };

            const dateKey = `interactions_${exportData.date}`;
            const existingData = JSON.parse(localStorage.getItem(dateKey) || '[]');
            existingData.push(exportData);
            localStorage.setItem(dateKey, JSON.stringify(existingData));
            
        } catch (error) {
            console.warn('Nie udało się wyeksportować interakcji:', error);
        }
    }

    // Analiza stanu ucznia
    analyzeStudentState(message, context) {
        const lowerMessage = message.toLowerCase();
        
        return {
            frustrationLevel: this.detectFrustration(lowerMessage, context),
            confidenceLevel: this.detectConfidence(lowerMessage, context),
            engagementLevel: this.detectEngagement(lowerMessage, context),
            helpNeed: this.detectHelpNeed(lowerMessage, context),
            topicDifficulty: context.exerciseMode ? this.assessTopicDifficulty(context) : 'unknown',
            timeInSession: context.sessionTimeMinutes || 0,
            recentPerformance: this.getRecentPerformance()
        };
    }

    // Wykrywanie frustracji
    detectFrustration(message, context) {
        const frustrationWords = ['trudne', 'nie rozumiem', 'za ciężkie', 'niemożliwe', 'nie wiem', 'poddaję się'];
        const frustrationCount = frustrationWords.filter(word => message.includes(word)).length;
        
        let level = frustrationCount * 2;
        if (context.exerciseSkipped) level += 3;
        if (context.hintsUsedInSession > 2) level += 2;
        
        return Math.min(10, level);
    }

    // Wykrywanie pewności siebie
    detectConfidence(message, context) {
        const confidenceWords = ['wiem', 'jasne', 'spoko', 'łatwe', 'git', 'okej'];
        const confidenceCount = confidenceWords.filter(word => message.includes(word)).length;
        
        let level = confidenceCount * 2;
        if (context.exerciseCorrect) level += 3;
        if (context.hintsUsedInSession === 0) level += 2;
        
        return Math.min(10, level);
    }

    // Wykrywanie zaangażowania
    detectEngagement(message, context) {
        const messageLength = message.length;
        const timeInSession = context.sessionTimeMinutes || 0;
        
        let level = 5; // baseline
        if (messageLength > 20) level += 2;
        if (timeInSession > 10) level += 2;
        if (message.includes('?')) level += 1;
        
        return Math.min(10, level);
    }

    // Wykrywanie potrzeby pomocy
    detectHelpNeed(message, context) {
        const helpWords = ['pomoc', 'help', 'wyjaśnij', 'jak', 'dlaczego', 'podpowiedź'];
        const helpCount = helpWords.filter(word => message.includes(word)).length;
        
        let level = helpCount * 3;
        if (context.hintRequested) level += 4;
        if (context.solutionRequested) level += 5;
        
        return Math.min(10, level);
    }

    // Określanie kategorii odpowiedzi
    determineResponseCategory(message, context, studentState) {
        if (context.exerciseCorrect) return 'positive_reinforcement';
        if (context.exerciseCorrect === false) return 'correction_guidance';
        if (studentState.helpNeed > 6) return 'help_explanation';
        if (studentState.frustrationLevel > 6) return 'calming_support';
        return 'general_response';
    }

    // Kategoryzacja odpowiedzi AI
    categorizeResponse(response) {
        const lower = response.toLowerCase();
        
        if (lower.includes('git') || lower.includes('spoko') || lower.includes('dobrze')) {
            return 'positive_reinforcement';
        } else if (lower.includes('nie tym razem') || lower.includes('błąd') || lower.includes('spróbuj')) {
            return 'correction_guidance';
        } else if (lower.includes('pomoc') || lower.includes('wyjaśnię') || lower.includes('krok po kroku')) {
            return 'help_explanation';
        } else if (lower.includes('luz') || lower.includes('spokojnie') || lower.includes('nie martw się')) {
            return 'calming_support';
        } else if (lower.includes('następne') || lower.includes('dalej') || lower.includes('kolejne')) {
            return 'progression_encouragement';
        } else {
            return 'general_response';
        }
    }

    // Znajdowanie najlepszej odpowiedzi w trybie autonomicznym
    findBestResponse(message, context, studentState, category) {
        // Szukaj podobnych sytuacji w bazie danych
        const similarInteractions = this.findSimilarInteractions(message, context, studentState);
        
        if (similarInteractions.length > 0) {
            // Wybierz najlepszą odpowiedź na podstawie efektywności
            const bestInteraction = similarInteractions
                .filter(i => i.effectiveness !== null && i.effectiveness > 5)
                .sort((a, b) => b.effectiveness - a.effectiveness)[0];
                
            if (bestInteraction) {
                return this.adaptResponse(bestInteraction.aiResponse, studentState);
            }
        }
        
        // Fallback do szablonów
        return this.getTemplateResponse(category, studentState);
    }

    // Znajdowanie podobnych interakcji
    findSimilarInteractions(message, context, studentState) {
        return this.interactionDatabase.interactions.filter(interaction => {
            // Podobny typ sesji
            const sameSessionType = interaction.context.exerciseMode === context.exerciseMode;
            
            // Podobny stan ucznia (±2 punkty we frustracji/pewności)
            const similarFrustration = Math.abs(interaction.studentState.frustrationLevel - studentState.frustrationLevel) <= 2;
            const similarConfidence = Math.abs(interaction.studentState.confidenceLevel - studentState.confidenceLevel) <= 2;
            
            // Podobne słowa kluczowe
            const commonWords = this.findCommonWords(message.toLowerCase(), interaction.userMessage.toLowerCase());
            
            return sameSessionType && similarFrustration && similarConfidence && commonWords >= 1;
        });
    }

    // Znajdowanie wspólnych słów
    findCommonWords(message1, message2) {
        const words1 = message1.split(' ').filter(w => w.length > 3);
        const words2 = message2.split(' ').filter(w => w.length > 3);
        
        return words1.filter(word => words2.includes(word)).length;
    }

    // Dostosowanie odpowiedzi do obecnego stanu
    adaptResponse(originalResponse, currentState) {
        let adaptedResponse = originalResponse;
        
        // Usuń znaczniki trybu uczenia z oryginalnej odpowiedzi
        adaptedResponse = adaptedResponse.replace(/<small[^>]*>.*?<\/small>/g, '');
        
        // Dostosuj ton do poziomu frustracji
        if (currentState.frustrationLevel > 7) {
            adaptedResponse = this.makeResponseCalmer(adaptedResponse);
        } else if (currentState.confidenceLevel > 7) {
            adaptedResponse = this.makeResponseMoreChallenging(adaptedResponse);
        }
        
        return adaptedResponse.trim();
    }

    // Uspokajanie odpowiedzi
    makeResponseCalmer(response) {
        return response
            .replace(/szybko|natychmiast|od razu/g, 'spokojnie')
            .replace(/trudne|ciężkie/g, 'nie najłatwiejsze')
            + (response.includes('luz') ? '' : '. luz, dasz radę');
    }

    // Dodawanie wyzwania do odpowiedzi
    makeResponseMoreChallenging(response) {
        const challenges = [
            'może spróbuj trudniejszą wersję?',
            'jak myślisz, co by było gdyby...',
            'spróbuj rozwiązać to innym sposobem'
        ];
        
        return response + '. ' + challenges[Math.floor(Math.random() * challenges.length)];
    }

    // Szablon odpowiedzi fallback
    getTemplateResponse(category, studentState) {
        const templates = {
            positive_reinforcement: [
                'git, masz to',
                'spoko, idzie ci dobrze',
                'okej, widzę postęp'
            ],
            correction_guidance: [
                'nie tym razem, ale spróbuj jeszcze raz',
                'hmm, może inaczej podejść do tego',
                'nie, ale dobry kierunek myślenia'
            ],
            help_explanation: [
                'okej, pomogę. która część sprawia problem',
                'jasne, wyjaśnię to krok po kroku',
                'spoko, pokażę jak to zrobić'
            ],
            calming_support: [
                'luz, każdy czasem ma problem',
                'spokojnie, to normalne że bywa trudno',
                'nie martw się, razem to ogarnemy'
            ],
            general_response: [
                'hmm, interesujące',
                'okej, myśl dalej',
                'spoko, rozwijaj tę myśl'
            ]
        };
        
        const categoryTemplates = templates[category] || templates.general_response;
        return categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];
    }

    // Zapisywanie interakcji autonomicznej
    saveAutonomousInteraction(message, response, context, studentState) {
        const interaction = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            userMessage: message,
            aiResponse: response,
            context: { ...context },
            sessionType: context.exerciseMode ? 'exercise' : 'chat',
            studentState: studentState,
            responseCategory: this.categorizeResponse(response),
            effectiveness: null,
            autonomous: true
        };

        this.interactionDatabase.interactions.push(interaction);
        this.lastInteractionId = interaction.id;
        this.saveInteractionDatabase();
    }

    // Aktualizacja wzorców na podstawie interakcji
    updatePatternsFromInteraction(interaction) {
        const pattern = {
            studentState: interaction.studentState,
            responseCategory: interaction.responseCategory,
            context: interaction.context,
            timestamp: interaction.timestamp
        };
        
        const patternKey = `${interaction.context.exerciseMode ? 'exercise' : 'chat'}_${interaction.responseCategory}`;
        
        if (!this.behaviorPatterns[patternKey]) {
            this.behaviorPatterns[patternKey] = [];
        }
        
        this.behaviorPatterns[patternKey].push(pattern);
        this.saveBehaviorPatterns();
    }

    // Ocena efektywności odpowiedzi
    evaluateResponseEffectiveness(interactionId, nextUserMessage) {
        const interaction = this.interactionDatabase.interactions.find(i => i.id === interactionId);
        if (!interaction) return;
        
        let effectiveness = 5; // baseline
        const nextMessage = nextUserMessage.toLowerCase();
        
        // Pozytywne sygnały
        if (nextMessage.includes('spoko') || nextMessage.includes('okej') || nextMessage.includes('dzięki')) {
            effectiveness += 3;
        }
        
        // Negatywne sygnały  
        if (nextMessage.includes('nie rozumiem') || nextMessage.includes('trudne') || nextMessage.includes('źle')) {
            effectiveness -= 2;
        }
        
        // Kontynuacja nauki = dobry znak
        if (nextMessage.length > 10) {
            effectiveness += 1;
        }
        
        interaction.effectiveness = Math.max(0, Math.min(10, effectiveness));
        this.saveInteractionDatabase();
    }

    // Raport z procesu uczenia się
    generateLearningReport() {
        const totalInteractions = this.interactionDatabase.interactions.length;
        const effectiveInteractions = this.interactionDatabase.interactions.filter(i => i.effectiveness > 6).length;
        
        const categoryStats = {};
        this.interactionDatabase.interactions.forEach(i => {
            if (!categoryStats[i.responseCategory]) {
                categoryStats[i.responseCategory] = 0;
            }
            categoryStats[i.responseCategory]++;
        });
        
        return {
            totalInteractions,
            effectiveInteractions,
            effectivenessRate: totalInteractions > 0 ? Math.round((effectiveInteractions / totalInteractions) * 100) : 0,
            categoryStats,
            learningProgress: this.calculateLearningProgress(),
            readyForAutonomy: this.isReadyForAutonomy(),
            daysInLearning: this.getDaysInLearning(),
            daysLeft: this.getDaysLeft()
        };
    }

    calculateLearningProgress() {
        const daysPassed = this.getDaysInLearning();
        return Math.min(100, Math.round((daysPassed / 7) * 100));
    }

    getDaysInLearning() {
        const start = parseInt(localStorage.getItem('learning_mode_start') || Date.now());
        return (Date.now() - start) / (1000 * 60 * 60 * 24);
    }

    // Sprawdź czy gotowy na autonomię
    isReadyForAutonomy() {
        const report = this.generateLearningReport();
        return report.totalInteractions >= 30 && report.effectivenessRate >= 60;
    }

    // Przełączenie w tryb autonomii
    switchToAutonomy() {
        this.isLearningMode = false;
        localStorage.setItem('learning_mode_completed', Date.now().toString());
        
        return {
            success: true,
            message: "przełączono w tryb autonomii. alex będzie teraz działać na podstawie zebranych danych",
            report: this.generateLearningReport()
        };
    }

    // Funkcje pomocnicze
    getRecentPerformance() {
        return studentData.math.recentScores.slice(-3);
    }

    assessTopicDifficulty(context) {
        if (context.currentExercise <= 3) return 'easy';
        if (context.currentExercise <= 7) return 'medium';
        return 'hard';
    }

    saveInteractionDatabase() {
        localStorage.setItem('interaction_database', JSON.stringify(this.interactionDatabase));
    }

    loadInteractionDatabase() {
        const saved = localStorage.getItem('interaction_database');
        return saved ? JSON.parse(saved) : { interactions: [], patterns: {}, responses: {} };
    }

    saveBehaviorPatterns() {
        localStorage.setItem('behavior_patterns', JSON.stringify(this.behaviorPatterns));
    }

    loadBehaviorPatterns() {
        const saved = localStorage.getItem('behavior_patterns');
        return saved ? JSON.parse(saved) : {};
    }

    getLearningStartDate() {
        const start = localStorage.getItem('learning_mode_start');
        return start ? new Date(parseInt(start)) : null;
    }

    getDaysLeft() {
        if (!this.isLearningMode) return 0;
        const start = parseInt(localStorage.getItem('learning_mode_start'));
        const daysPassed = (Date.now() - start) / (1000 * 60 * 60 * 24);
        return Math.max(0, Math.ceil(7 - daysPassed));
    }

    // Eksport wszystkich danych
    exportAllData() {
        const exportData = {
            interactionDatabase: this.interactionDatabase,
            behaviorPatterns: this.behaviorPatterns,
            learningReport: this.generateLearningReport(),
            exportDate: new Date().toISOString(),
            studentProfile: this.claudeAPI.studentProfile
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        console.log('Learning data export:', dataStr);
        
        return { 
            success: true, 
            message: "dane uczenia się zostały wyeksportowane do konsoli przeglądarki",
            data: exportData
        };
    }
}

// Claude API Configuration (uproszczona wersja dla Learning System)
class ClaudeIntegration {
    constructor() {
        this.apiKey = localStorage.getItem('claude_api_key') || null;
        this.baseURL = 'https://api.anthropic.com/v1/messages';
        this.studentProfile = this.loadStudentProfile();
    }

    async setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('claude_api_key', key);
        
        try {
            await this.testConnection();
            return { success: true, message: "połączenie z claude api działa!" };
        } catch (error) {
            this.apiKey = null;
            localStorage.removeItem('claude_api_key');
            return { success: false, message: "błąd połączenia: " + error.message };
        }
    }

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
                messages: [{ role: "user", content: "odpowiedz krótko: test ok" }]
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return await response.json();
    }

    async askClaude(message, context = {}) {
        if (!this.apiKey) {
            throw new Error('No API key');
        }

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
                messages: [{ role: "user", content: prompt + "\n\nUCZEŃ: " + userMessage }]
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.content[0].text;
    }

    buildSystemPrompt(context) {
        const profile = this.studentProfile;
        
        return `Jesteś Alex - flegmatyczny korepetytor AI dla ucznia 2 klasy liceum. 

TWÓJ STYL:
- piszesz małymi literami na początku zdań (czasem zapominasz o wielkiej literze)
- NIE używasz emoji ani wykrzykników  
- młodzieżowy język: "okej", "spoko", "luz", "git", "no to"
- flegmatyczny ton - bez przesadnego entuzjazmu
- realistyczne oceny: "poszło spoko" zamiast "fantastycznie!"

PROFIL UCZNIA:
- Średni wynik: ${profile.averageScore}%
- Poziom frustracji: ${profile.frustrationLevel}/10
- Słabe obszary: ${profile.weakAreas.join(', ')}

OBECNA SESJA:
${context.exerciseMode ? `
- Tryb ćwiczeń: AKTYWNY (${context.currentExercise}/10 zadanie)
- Czas sesji: ${context.sessionTimeMinutes} minut
` : '- Tryb ćwiczeń: NIEAKTYWNY (rozmowa ogólna)'}

WYTYCZNE:
1. Dostosuj ton do profilu ucznia
2. Jeśli się frustruje - uspokajaj: "luz", "spoko"
3. Jeśli ma dobre wyniki - pochwal bez przesady: "git", "niezły wynik"
4. Pamiętaj o flegmatycznym stylu

PRZYKŁADY:
✓ "git, masz to. poszło spoko"
✓ "hmm, nie tym razem. ale luz, każdy się myli"  
✓ "okej, która część sprawia problemy"

UNIKAJ:
✗ Emoji i wykrzykników
✗ Przesadnego entuzjazmu`;
    }

    buildUserMessage(message, context) {
        let contextInfo = "";
        if (context.exerciseMode && context.lastInteraction) {
            contextInfo = `\n[KONTEKST: ${context.lastInteraction}]`;
        }
        return message + contextInfo;
    }

    loadStudentProfile() {
        const saved = localStorage.getItem('student_profile_claude');
        if (saved) {
            return JSON.parse(saved);
        }

        return {
            averageScore: 0,
            frustrationLevel: 5,
            weakAreas: ['funkcje kwadratowe']
        };
    }

    saveStudentProfile() {
        localStorage.setItem('student_profile_claude', JSON.stringify(this.studentProfile));
    }
}

// Inicjalizacja systemów
const claudeAI = new ClaudeIntegration();
const learningReplaySystem = new LearningReplaySystem();tokens: 300,
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

// Chat z korepetytorem - GŁÓWNA FUNKCJA ZINTEGROWANA Z LEARNING SYSTEM
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
        
        // Użyj Learning & Replay System
        const response = await learningReplaySystem.respondToStudent(message, context);
        
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

// Modal konfiguracji API - nowa implementacja
let isLearningModeEnabled = false;
let modalApiKey = '';

// Otwórz modal konfiguracji
function openApiModal() {
    // Załaduj aktualny stan
    isLearningModeEnabled = learningReplaySystem.isLearningMode || localStorage.getItem('learning_mode_enabled') === 'true';
    modalApiKey = claudeAI.apiKey || '';
    
    // Zaktualizuj interfejs
    updateModalInterface();
    
    // Pokaż modal
    document.getElementById('apiModal').style.display = 'block';
}

// Zamknij modal
function closeApiModal() {
    document.getElementById('apiModal').style.display = 'none';
}

// Przełącz tryb uczenia/autonomii
function toggleMode() {
    isLearningModeEnabled = !isLearningModeEnabled;
    updateModalInterface();
}

// Aktualizuj interfejs modala
function updateModalInterface() {
    const toggle = document.getElementById('modeToggle');
    const title = document.getElementById('toggleTitle');
    const description = document.getElementById('toggleDescription');
    const apiKeyGroup = document.getElementById('apiKeyGroup');
    const learningInfo = document.getElementById('learningInfo');
    const currentStatus = document.getElementById('currentStatus');
    const saveBtn = document.getElementById('saveConfigBtn');
    
    // Aktualizuj przełącznik
    if (isLearningModeEnabled) {
        toggle.classList.add('active');
        title.textContent = 'Tryb Uczenia się';
        description.textContent = 'System uczy się przez 7 dni z prawdziwym Claude AI';
        apiKeyGroup.style.display = 'block';
        learningInfo.style.display = 'block';
    } else {
        toggle.classList.remove('active');
        title.textContent = 'Tryb Autonomiczny';
        description.textContent = 'System używa zapisanych wzorców bez API';
        apiKeyGroup.style.display = 'none';
        learningInfo.style.display = 'none';
    }
    
    // Pokaż aktualny status
    const report = learningReplaySystem.generateLearningReport();
    let statusHtml = '';
    
    if (learningReplaySystem.isLearningMode) {
        statusHtml = `<div class="status-indicator status-learning">
            🧠 Aktywny tryb uczenia - ${report.daysLeft} dni pozostało
        </div>`;
    } else if (report.totalInteractions > 0) {
        statusHtml = `<div class="status-indicator status-autonomous">
            🤖 Tryb autonomiczny - ${report.totalInteractions} zapisanych interakcji
        </div>`;
    } else {
        statusHtml = `<div class="status-indicator status-disabled">
            ⚪ System nieaktywny
        </div>`;
    }
    
    currentStatus.innerHTML = statusHtml;
    
    // Zaktualizuj klucz API w polu
    if (modalApiKey) {
        document.getElementById('apiKeyInput').value = modalApiKey;
    }
    
    // Zaktualizuj tekst przycisku
    if (isLearningModeEnabled && !modalApiKey) {
        saveBtn.innerHTML = '<span class="loading"></span>Wymagany klucz API';
        saveBtn.disabled = true;
        saveBtn.style.opacity = '0.6';
    } else {
        saveBtn.innerHTML = 'Zapisz konfigurację';
        saveBtn.disabled = false;
        saveBtn.style.opacity = '1';
    }
}

// Pokaż/ukryj klucz API
function toggleApiKeyVisibility() {
    const input = document.getElementById('apiKeyInput');
    const button = document.querySelector('.api-key-toggle');
    
    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🙈';
    } else {
        input.type = 'password';
        button.textContent = '👁️';
    }
}

// Zapisz konfigurację
async function saveConfiguration() {
    const apiKeyInput = document.getElementById('apiKeyInput');
    const saveBtn = document.getElementById('saveConfigBtn');
    
    // Pokaż loading
    saveBtn.innerHTML = '<span class="loading"></span>Zapisywanie...';
    saveBtn.disabled = true;
    
    try {
        if (isLearningModeEnabled) {
            // Tryb uczenia się - wymagany klucz API
            const newApiKey = apiKeyInput.value.trim();
            
            if (!newApiKey) {
                throw new Error('Klucz API jest wymagany w trybie uczenia się');
            }
            
            // Test klucza API
            const apiResult = await claudeAI.setApiKey(newApiKey);
            if (!apiResult.success) {
                throw new Error(`Błąd API: ${apiResult.message}`);
            }
            
            // Rozpocznij tryb uczenia się
            const learningResult = await learningReplaySystem.startLearningMode();
            localStorage.setItem('learning_mode_enabled', 'true');
            
            addTutorMessage(`✅ konfiguracja zapisana<br><br>
            ${apiResult.message}<br>
            ${learningResult.message}<br><br>
            przez następne 7 dni będę się uczyć twojego stylu nauki`);
            
        } else {
            // Tryb autonomiczny - wyłącz uczenie się
            learningReplaySystem.isLearningMode = false;
            localStorage.setItem('learning_mode_enabled', 'false');
            localStorage.removeItem('learning_mode_start');
            
            // Opcjonalnie usuń klucz API
            if (claudeAI.apiKey) {
                claudeAI.apiKey = null;
                localStorage.removeItem('claude_api_key');
            }
            
            const report = learningReplaySystem.generateLearningReport();
            addTutorMessage(`✅ przełączono na tryb autonomiczny<br><br>
            system będzie używać ${report.totalInteractions} zapisanych interakcji<br>
            ${report.totalInteractions > 0 ? 'jestem gotowy do samodzielnej pracy' : 'zacznę się uczyć z twoich odpowiedzi'}`);
        }
        
        // Zamknij modal
        closeApiModal();
        
    } catch (error) {
        // Pokaż błąd
        addTutorMessage(`❌ błąd konfiguracji: ${error.message}<br><br>sprawdź klucz api i spróbuj ponownie`);
        
    } finally {
        // Przywróć przycisk
        saveBtn.innerHTML = 'Zapisz konfigurację';
        saveBtn.disabled = false;
    }
}

// Aktualizacja funkcji setupClaudeAPI (legacy support)
async function setupClaudeAPI() {
    openApiModal();
}

// Zamknij modal po kliknięciu poza nim
window.onclick = function(event) {
    const modal = document.getElementById('apiModal');
    if (event.target === modal) {
        closeApiModal();
    }
}

// Event listener dla ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeApiModal();
    }
});

// Aktualizuj Learning & Replay System żeby respektował ustawienia
const originalCheckLearningMode = learningReplaySystem.checkLearningMode;
learningReplaySystem.checkLearningMode = function() {
    // Sprawdź czy tryb uczenia jest włączony w ustawieniach
    const enabled = localStorage.getItem('learning_mode_enabled') === 'true';
    if (!enabled) return false;
    
    // Jeśli włączony, sprawdź standardowo
    return originalCheckLearningMode.call(this);
};

// Inicjalizacja przy starcie
document.addEventListener('DOMContentLoaded', function() {
    // Sprawdź zapisane ustawienia
    const savedMode = localStorage.getItem('learning_mode_enabled');
    if (savedMode !== null) {
        isLearningModeEnabled = savedMode === 'true';
        
        // Jeśli był włączony tryb uczenia ale brak API key, wyłącz
        if (isLearningModeEnabled && !claudeAI.apiKey) {
            localStorage.setItem('learning_mode_enabled', 'false');
            isLearningModeEnabled = false;
        }
    }
});

// Panel sterowania Learning System
function showLearningPanel() {
    const report = learningReplaySystem.generateLearningReport();
    const modeText = learningReplaySystem.isLearningMode ? 
        `🧠 tryb uczenia (${report.daysLeft} dni pozostało)` : 
        `🤖 tryb autonomiczny`;
    
    addTutorMessage(`
        <div style="border: 2px solid #4facfe; border-radius: 15px; padding: 20px; margin: 10px 0; background: rgba(255,255,255,0.95);">
            <h3 style="color: #4a5568; margin-bottom: 15px;">📊 Panel Learning System</h3>
            
            <div style="background: #f7fafc; padding: 15px; border-radius: 10px; margin: 10px 0;">
                <strong>Status:</strong> ${modeText}<br>
                <strong>Zapisanych interakcji:</strong> ${report.totalInteractions}<br>
                <strong>Efektywność:</strong> ${report.effectivenessRate}%<br>
                <strong>Postęp uczenia:</strong> ${report.learningProgress}%
            </div>
            
            ${report.categoryStats && Object.keys(report.categoryStats).length > 0 ? `
            <div style="background: #f0fff4; padding: 15px; border-radius: 10px; margin: 10px 0;">
                <strong>Statystyki kategorii odpowiedzi:</strong><br>
                ${Object.entries(report.categoryStats).map(([cat, count]) => 
                    `• ${cat}: ${count} razy`
                ).join('<br>')}
            </div>
            ` : ''}
            
            <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 15px;">
                ${!learningReplaySystem.isLearningMode && !claudeAI.apiKey ? 
                    '<button class="btn" onclick="setupClaudeAPI()" style="font-size: 0.9em;">🧠 rozpocznij uczenie</button>' : ''}
                ${learningReplaySystem.isLearningMode && report.readyForAutonomy ? 
                    '<button class="btn" onclick="switchToAutonomy()" style="font-size: 0.9em;">🤖 przełącz na autonomię</button>' : ''}
                <button class="btn" onclick="exportLearningData()" style="font-size: 0.9em;">📁 eksportuj dane</button>
            </div>
        </div>
    `);
}

// Przełączenie na autonomię
async function switchToAutonomy() {
    const result = learningReplaySystem.switchToAutonomy();
    addTutorMessage(`${result.message}<br><br>
    <strong>raport końcowy:</strong><br>
    • zapisanych interakcji: ${result.report.totalInteractions}<br>
    • efektywność: ${result.report.effectivenessRate}%<br>
    • dni uczenia: ${Math.round(result.report.daysInLearning)}<br><br>
    teraz będę działać na podstawie zebranych danych o twoim stylu nauki`);
}

// Eksport danych uczenia się
function exportLearningData() {
    const result = learningReplaySystem.exportAllData();
    addTutorMessage(`${result.message}<br><br>otwórz konsolę przeglądarki (F12) żeby zobaczyć wszystkie dane`);
}

// Funkcja fallback dla kompatybilności wstecznej  
async function respondToStudent(message) {
    // Ta funkcja jest zastąpiona przez Learning System
    return await learningReplaySystem.respondToStudent(message, {});
}

function startLearningSession() {
    learningReplaySystem.respondToStudent("rozpocznij sesję nauki", {
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
    learningReplaySystem.respondToStudent("wybrano matematykę, przedstaw tematy", {
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
    learningReplaySystem.respondToStudent("wybrano język polski, przedstaw tematy", {
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
// Sprawdzenie odpowiedzi
async function submitExerciseAnswer() {
    const input = document.getElementById('chatInput');
    const userAnswer = input.value.trim();
    
    if (!userAnswer) {
        const response = await claudeAI.askClaude("uczeń nie wpisał odpowiedzi ale kliknął sprawdź", {
            exerciseMode: true,
            topic: 'funkcje kwadratowe'
        });
        addTutorMessage(response);
        return;
    }
    
    addStudentMessage(userAnswer);
    input.value = '';
    
    const exercise = quadraticExercises[currentExercise];
    const isCorrect = checkAnswer(userAnswer, exercise.answer);
    
    exerciseAnswers.push({
        exerciseId: exercise.id,
        userAnswer: userAnswer,
        correctAnswer: exercise.answer,
        timestamp: new Date(),
        hintUsed: false, // będzie aktualizowane jeśli używano podpowiedzi
        isCorrect: isCorrect
    });
    
    // Przygotuj kontekst dla Claude
    const context = {
        exerciseMode: true,
        exerciseCorrect: isCorrect,
        userAnswer: userAnswer,
        correctAnswer: exercise.answer,
        exerciseQuestion: exercise.question,
        topic: 'funkcje kwadratowe',
        currentExercise: currentExercise + 1,
        totalExercises: quadraticExercises.length
    };
    
    let response;
    if (isCorrect) {
        response = await claudeAI.askClaude(`uczeń odpowiedział poprawnie: "${userAnswer}" na zadanie: ${exercise.question}. Prawidłowa odpowiedź to: ${exercise.answer}`, context);
        
        addTutorMessage(`<strong>git, masz to</strong><br><br>
        prawidłowa odpowiedź: ${exercise.answer}<br><br>
        ${response}`);
        
        setTimeout(() => {
            currentExercise++;
            showCurrentExercise();
        }, 3000);
    } else {
        response = await claudeAI.askClaude(`uczeń odpowiedział niepoprawnie: "${userAnswer}" na zadanie: ${exercise.question}. Prawidłowa odpowiedź to: ${exercise.answer}`, context);
        
        addTutorMessage(`<strong>nie tym razem</strong><br><br>
        twoja odpowiedź: "${userAnswer}"<br>
        ${response}<br><br>
        <button class="btn" onclick="showHint()" style="font-size: 0.9em;">podpowiedź</button>
        <button class="btn" onclick="showSolution()" style="font-size: 0.9em;">pokaż rozwiązanie</button>
        <button class="btn" onclick="tryAgain()" style="font-size: 0.9em;">jeszcze raz</button>`);
    }
}

// Pokazanie rozwiązania
async function showSolution() {
    const exercise = quadraticExercises[currentExercise];
    
    const response = await claudeAI.askClaude(`uczeń poprosił o pokazanie rozwiązania zadania: ${exercise.question}. Prawidłowa odpowiedź: ${exercise.answer}`, {
        exerciseMode: true,
        solutionRequested: true,
        topic: 'funkcje kwadratowe'
    });
    
    addTutorMessage(`<strong>jak to zrobić:</strong><br><br>
    ${exercise.question}<br><br>
    <strong>odpowiedź:</strong> ${exercise.answer}<br><br>
    ${response}<br><br>
    <button class="btn" onclick="nextExercise()" style="font-size: 0.9em;">następne zadanie</button>`);
}

// Następne zadanie
function nextExercise() {
    currentExercise++;
    showCurrentExercise();
}

// Ponowna próba
async function tryAgain() {
    const response = await claudeAI.askClaude("uczeń chce spróbować ponownie to samo zadanie", {
        exerciseMode: true,
        retryAttempt: true,
        topic: 'funkcje kwadratowe'
    });
    addTutorMessage(response);
}

// Pominięcie zadania
async function skipExercise() {
    const exercise = quadraticExercises[currentExercise];
    
    // Zapisz informację o pominięciu
    claudeAI.updateStudentProfile("", {
        exerciseSkipped: true,
        topic: 'funkcje kwadratowe'
    });
    
    const response = await claudeAI.askClaude(`uczeń pomija zadanie: ${exercise.question}. Prawidłowa odpowiedź: ${exercise.answer}`, {
        exerciseMode: true,
        exerciseSkipped: true,
        topic: 'funkcje kwadratowe'
    });
    
    addTutorMessage(`${response}<br><br>
    <strong>żeby wiedziałeś, prawidłowa odpowiedź to:</strong> ${exercise.answer}<br><br>
    idziemy dalej`);
    
    setTimeout(() => {
        currentExercise++;
        showCurrentExercise();
    }, 2000);
}

// Zakończenie sesji ćwiczeń
async function finishExerciseSession() {
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
    
    // Aktualizacja profilu Claude
    claudeAI.studentProfile.totalSessions++;
    claudeAI.studentProfile.recentScores.push(score);
    claudeAI.studentProfile.averageScore = studentData.math.averageScore;
    claudeAI.saveStudentProfile();
    
    saveData();
    updateDashboard();
    
    // Podsumowanie od Claude
    const summaryResponse = await claudeAI.askClaude(`zakończona sesja z funkcjami kwadratowymi. Wyniki: ${correctAnswers}/10 poprawnych (${score}%), czas: ${sessionTime} minut`, {
        exerciseMode: false,
        sessionCompleted: true,
        finalScore: score,
        sessionTime: sessionTime,
        topic: 'funkcje kwadratowe'
    });
    
    addTutorMessage(`skończone. oto jak poszło<br><br>
    <strong>wyniki:</strong><br>
    • poprawne odpowiedzi: ${correctAnswers}/10<br>
    • wynik: ${score}%<br>
    • czas: ${sessionTime} minut<br><br>
    ${summaryResponse}`);
}

function getEncouragement(score) {
    if (score >= 80) return "poszło spoko, niezły wynik";
    if (score >= 60) return "okej, da się żyć z tym wynikiem";
    if (score >= 40) return "trzeba jeszcze popracować ale nie jest źle";
    return "hmm, nie było najlepiej ale da się to poprawić";
}

// Inne funkcje matematyczne (placeholder)
async function startLinearFunctions() {
    const response = await claudeAI.askClaude("uczeń chce ćwiczyć funkcje liniowe ale nie mamy jeszcze zadań", {
        exerciseMode: false,
        topic: 'funkcje liniowe'
    });
    addTutorMessage(`${response}<br><br>na razie pograj z funkcjami kwadratowymi`);
}

async function startTrigonometry() {
    const response = await claudeAI.askClaude("uczeń chce ćwiczyć trygonometrię ale nie mamy jeszcze zadań", {
        exerciseMode: false,
        topic: 'trygonometria'
    });
    addTutorMessage(`${response}<br><br>trzymaj się na razie funkcji kwadratowych`);
}

async function startGeometry() {
    const response = await claudeAI.askClaude("uczeń chce ćwiczyć geometrię ale nie mamy jeszcze zadań", {
        exerciseMode: false,
        topic: 'geometria'
    });
    addTutorMessage(`${response}<br><br>skup się teraz na funkcjach kwadratowych`);
}

// Funkcje dodatkowe
async function practiceWeakArea(subject) {
    const area = studentData[subject].weakAreas[0];
    const response = await claudeAI.askClaude(`uczeń chce ćwiczyć słaby obszar: ${area}`, {
        exerciseMode: false,
        topic: area,
        weakAreaPractice: true
    });
    addTutorMessage(`${response}<br><br>zaczynajmy`);
}

async function generateDailyPlan() {
    const mathTopic = getRandomMathTopic();
    const polishTopic = getRandomPolishTopic();
    
    const response = await claudeAI.askClaude(`wygeneruj plan dnia nauki: matematyka (${mathTopic}), polski (${polishTopic})`, {
        exerciseMode: false,
        planGeneration: true
    });
    
    addTutorMessage(`${response}<br><br>
    <strong>plan na dziś:</strong><br>
    rano (9:00-10:30): matma - ${mathTopic}<br>
    popołudnie (15:00-16:30): polski - ${polishTopic}`);
}
