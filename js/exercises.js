// Zadania z funkcji kwadratowych
const quadraticExercises = [
    {
        id: 1,
        question: "Rozwiąż równanie: x² = 16",
        type: "equation",
        difficulty: "podstawowy",
        hints: ["Wyciągnij pierwiastek z obu stron", "Pamiętaj o dwóch rozwiązaniach!"],
        answer: "x = 4 lub x = -4"
    },
    {
        id: 2,
        question: "Rozwiąż równanie: x² - 9 = 0",
        type: "equation", 
        difficulty: "podstawowy",
        hints: ["Przenieś -9 na prawą stronę", "To jest różnica kwadratów!"],
        answer: "x = 3 lub x = -3"
    },
    {
        id: 3,
        question: "Rozwiąż równanie: 2x² = 18",
        type: "equation",
        difficulty: "podstawowy", 
        hints: ["Podziel obie strony przez 2", "Następnie wyciągnij pierwiastek"],
        answer: "x = 3 lub x = -3"
    },
    {
        id: 4,
        question: "Rozwiąż równanie: x² + 4 = 20",
        type: "equation",
        difficulty: "podstawowy",
        hints: ["Przenieś 4 na prawą stronę", "x² = 16"],
        answer: "x = 4 lub x = -4"
    },
    {
        id: 5,
        question: "Rozwiąż równanie: 3x² - 12 = 0",
        type: "equation",
        difficulty: "podstawowy",
        hints: ["Wyłącz 3 przed nawias", "3(x² - 4) = 0"],
        answer: "x = 2 lub x = -2"
    },
    {
        id: 6,
        question: "Wskaż współczynniki a, b, c w funkcji f(x) = 2x² - 5x + 3",
        type: "coefficients",
        difficulty: "podstawowy",
        hints: ["Postać ogólna to ax² + bx + c", "Porównaj z daną funkcją"],
        answer: "a = 2, b = -5, c = 3"
    },
    {
        id: 7,
        question: "Wskaż współczynniki a, b, c w funkcji f(x) = -x² + 7x - 1",
        type: "coefficients",
        difficulty: "podstawowy",
        hints: ["Pamiętaj o znaku minus przy x²", "a = -1"],
        answer: "a = -1, b = 7, c = -1"
    },
    {
        id: 8,
        question: "Oblicz wartość funkcji f(x) = x² + 2x - 3 dla x = 1",
        type: "calculation",
        difficulty: "podstawowy",
        hints: ["Podstaw x = 1 do wzoru", "f(1) = 1² + 2·1 - 3"],
        answer: "f(1) = 0"
    },
    {
        id: 9,
        question: "Oblicz wartość funkcji f(x) = -2x² + 4x + 1 dla x = 2",
        type: "calculation",
        difficulty: "podstawowy",
        hints: ["Podstaw x = 2", "f(2) = -2·4 + 4·2 + 1"],
        answer: "f(2) = 1"
    },
    {
        id: 10,
        question: "Dla jakiej wartości x funkcja f(x) = x² - 4x + 3 przyjmuje wartość 0?",
        type: "zeros",
        difficulty: "podstawowy",
        hints: ["Rozwiąż równanie f(x) = 0", "x² - 4x + 3 = 0"],
        answer: "x = 1 lub x = 3"
    }
];

// Sprawdzanie odpowiedzi (uproszczone)
function checkAnswer(userAnswer, correctAnswer) {
    const cleanUser = userAnswer.toLowerCase().replace(/\s/g, '');
    const cleanCorrect = correctAnswer.toLowerCase().replace(/\s/g, '');
    
    // Sprawdzenie dokładnego dopasowania
    if (cleanUser === cleanCorrect) return true;
    
    // Sprawdzanie różnych formatów odpowiedzi
    const patterns = [
        cleanCorrect.replace('lub', 'i'),
        cleanCorrect.replace('lub', ','),
        cleanCorrect.replace('=', ''),
        cleanCorrect.replace('x=', ''),
        cleanCorrect.replace(' ', '')
    ];
    
    // Sprawdzenie czy odpowiedź pasuje do któregoś z wzorców
    for (let pattern of patterns) {
        if (cleanUser.includes(pattern) || pattern.includes(cleanUser)) {
            return true;
        }
    }
    
    // Specjalne sprawdzenia dla typowych odpowiedzi
    if (correctAnswer.includes('4') && correctAnswer.includes('-4')) {
        return cleanUser.includes('4') && cleanUser.includes('-4');
    }
    if (correctAnswer.includes('3') && correctAnswer.includes('-3')) {
        return cleanUser.includes('3') && cleanUser.includes('-3');
    }
    if (correctAnswer.includes('2') && correctAnswer.includes('-2')) {
        return cleanUser.includes('2') && cleanUser.includes('-2');
    }
    
    // Sprawdzenie pojedynczych liczb
    if (correctAnswer.includes('a=') && correctAnswer.includes('b=') && correctAnswer.includes('c=')) {
        return cleanUser.includes('a=') || cleanUser.includes('b=') || cleanUser.includes('c=');
    }
    
    return false;
}