import { test, expect } from '@playwright/test';
import { DiaryPage } from './pom/diary.po';

test.describe('Дневник, главная страниц', async () => {
  let diaryPage: DiaryPage;

  test.beforeEach(async ({ page }) => {
    diaryPage = new DiaryPage(page);
    await page.goto('/');
  });

    test('заполнение формы и проверка localStorage', async () => {
      // Получаем состояние localStorage до заполнения формы
      const localStorageBefore = await diaryPage.getLocalStorageData('healthData');
      console.log('Local Storage Before:', localStorageBefore);

      // Заполняем форму
      await diaryPage.fillForm('55', '3', '10050', '2300', 'light', 'good', 'Привет');

      // Получаем состояние localStorage после заполнения формы
      const localStorageAfter = await diaryPage.getLocalStorageData('healthData');
      console.log('Local Storage After:', localStorageAfter);

      // Проверяем, что данные в localStorage изменились
      expect(localStorageAfter).not.toEqual(localStorageBefore);
    });

  test('заполняет форму и проверяет localStorage', async () => {
    // --- Проверка состояния localStorage до заполнения ---
    const initialData = await diaryPage.getLocalStorageData('healthData');
    const initialEntries = initialData ? JSON.parse(initialData).length : {};
    const initialLength = Object.values(initialEntries!).flat().length;

    // --- Заполняем форму ---
    await diaryPage.fillPulse('55');
    await diaryPage.selectDate();
    await diaryPage.addWeightEntry();
    await diaryPage.fillSteps('10050');
    await diaryPage.fillCalories('2300');
    await diaryPage.selectWorkout('light');
    await diaryPage.selectMoodEvening('good');
    await diaryPage.fillNotes('Привет');
    await diaryPage.save();

    // --- Проверка: данные сохранились в localStorage ---
    const updatedData = await diaryPage.getLocalStorageData('healthData');
    expect(updatedData).not.toBeNull();
    expect(initialData).not.toEqual(updatedData);
    const updatedEntries = Object.values(JSON.parse(updatedData!)).flat();

    const updatedLength = Object.values(JSON.parse(updatedData!)).flat().length;
    expect(updatedLength).toBeGreaterThan(initialLength);

    // Дополнительно: проверим, что есть запись с нужными данными
    const latestEntry = updatedEntries[updatedEntries.length - 1];
    expect(latestEntry.pulse).toBe('55');
    expect(latestEntry.steps).toBe('10050');
    expect(latestEntry.calories).toBe('2300');
    expect(latestEntry.workout).toBe('light');
    expect(latestEntry.mood).toBe('good');
    expect(latestEntry.notes).toBe('Привет');
  });
//   dailyFormDrafts
})
