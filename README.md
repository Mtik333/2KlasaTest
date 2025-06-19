# System Korepetycji AI - 2 Klasa Liceum

Interaktywny system korepetycji dla uczniów 2 klasy liceum przygotowujących się do egzaminów poprawkowych z matematyki i języka polskiego.

## 🎯 Funkcjonalności

- **Interaktywny korepetytor AI** - Alex prowadzi sesje nauki w flegmatycznym, młodzieżowym stylu
- **Śledzenie postępów** - monitoring wyników, czasu nauki i ukończonych tematów
- **Zadania z funkcji kwadratowych** - 10 interaktywnych zadań podstawowych
- **System osiągnięć** - gamifikacja procesu nauki
- **Responsywny design** - działa na komputerze i telefonie
- **Zapis lokalny** - postępy zapisywane w przeglądarce

## 🚀 Jak uruchomić

1. **GitHub Pages (zalecane):**
   - Wejdź na: `https://mtik333.github.io/2KlasaTest`

2. **Lokalnie:**
   ```bash
   git clone https://github.com/Mtik333/2KlasaTest.git
   cd 2KlasaTest
   ```
   Otwórz `index.html` w przeglądarce

## 📚 Dostępne tematy

### Matematyka
- ✅ **Funkcje kwadratowe** (10 zadań)
  - Równania kwadratowe podstawowe
  - Współczynniki funkcji
  - Obliczanie wartości funkcji
  - Miejsca zerowe
- 🔄 Funkcje liniowe (w przygotowaniu)
- 🔄 Trygonometria (w przygotowaniu)
- 🔄 Geometria (w przygotowaniu)

### Język Polski
- 🔄 Analiza lektury (w przygotowaniu)
- 🔄 Wypracowania (w przygotowaniu)
- 🔄 Figury stylistyczne (w przygotowaniu)

## 🤖 Korepetytor Alex

Alex to AI o flegmatycznym charakterze, który:
- Nie używa emoji i wykrzykników
- Mówi młodzieżowym językiem
- Czasem zapomina o wielkiej literze
- Jest cierpliwy ale bez przesadnego entuzjazmu
- Daje realistyczne oceny postępów

**Przykłady stylu:**
- "funkcje kwadratowe... okej. przygotowałem 10 zadań"
- "git, masz to. poszło spoko, zobaczymy czy dasz radę z następnym"
- "hmm, trzeba jeszcze poćwiczyć ale da się to poprawić"

## 🛠️ Struktura projektu

```
2KlasaTest/
├── index.html          # Główny plik HTML
├── css/
│   └── style.css       # Style CSS
├── js/
│   ├── app.js          # Główna logika aplikacji
│   ├── exercises.js    # Zadania i sprawdzanie odpowiedzi
│   └── tutor.js        # Logika korepetytora Alex
└── README.md          # Ta dokumentacja
```

## 💾 System zapisywania

- Dane przechowywane w `localStorage` przeglądarki
- Automatyczny zapis po każdej sesji
- Śledzenie: sesji, wyników, czasu nauki, osiągnięć

## 🎮 Jak używać

1. **Rozpocznij sesję:** Kliknij "Rozpocznij Sesję"
2. **Wybierz przedmiot:** Matematyka lub Polski
3. **Wybierz temat:** np. "Funkcje kwadratowe"
4. **Rozwiązuj zadania:** Wpisz odpowiedź i kliknij "sprawdź"
5. **Korzystaj z pomocy:** Podpowiedzi, rozwiązania, możliwość pominięcia
6. **Śledź postępy:** W zakładkach przedmiotów i podsumowaniu

## 🧪 Technologie

- **HTML5** - struktura
- **CSS3** - style z animacjami i gradientami
- **Vanilla JavaScript** - logika aplikacji
- **LocalStorage** - zapis postępów
- **Responsive Design** - dostosowanie do urządzeń

## 📈 Monitorowanie postępów

System śledzi:
- **Sesje nauki** - liczba i czas
- **Wyniki** - procent poprawnych odpowiedzi
- **Tematy** - ukończone zagadnienia
- **Słabe obszary** - do dodatkowego ćwiczenia
- **Osiągnięcia** - motywacyjne odznaki

## 🔄 Planowana rozbudowa

- [ ] Więcej zadań z matematyki (średni, trudny poziom)
- [ ] Kompletny moduł języka polskiego
- [ ] Zadania z trygonometrii i geometrii
- [ ] Export postępów do PDF
- [ ] Powiadomienia o regularnej nauce
- [ ] Tryb offline
- [ ] Więcej stylów korepetytora

## 🤝 Contributing

Pull requests są mile widziane! Przed rozpoczęciem pracy nad większymi zmianami, otwórz issue żeby przedyskutować zmiany.

### Dodawanie nowych zadań:

1. Edytuj `js/exercises.js`
2. Dodaj zadanie do odpowiedniej tablicy
3. Sprawdź format: `{ id, question, type, difficulty, hints, answer }`
4. Przetestuj sprawdzanie odpowiedzi

### Zmiany w stylu Alex'a:

1. Edytuj funkcje w `js/tutor.js`
2. Zachowaj flegmatyczny ton
3. Unikaj emoji i wykrzykników
4. Użyj młodzieżowego języka

## 👥 Autorzy

- **Korepetytor AI:** Alex (flegmatyczny styl)
- **System:** Claude AI + Użytkownik
- **Repo:** [Mtik333](https://github.com/Mtik333)

## 📄 Licencja

MIT License - możesz swobodnie używać, modyfikować i dystrybuować.

## 🐛 Zgłaszanie błędów

Jeśli znajdziesz błąd:
1. Sprawdź czy nie został już zgłoszony w Issues
2. Opisz kroki do reprodukcji
3. Dodaj zrzut ekranu jeśli pomaga
4. Określ przeglądarkę i system

## 📞 Kontakt

Masz pytania? Otwórz issue na GitHubie!