import { BasePage } from './base.po';
import { Page } from '@playwright/test';

export class DiaryPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // === Форма ввода ===
  readonly pulseInput = () => this.page.getByRole('spinbutton', { name: ' Пульс (уд/мин):' });
  readonly dateInput = () => this.page.getByPlaceholder('М', { exact: true });
  readonly dateDay3 = () => this.page.getByText('3', { exact: true });
  readonly addWeightButton = () => this.page.getByRole('button', { name: '+ + Добавить взвешивание' });
  readonly stepsInput = () => this.page.getByRole('spinbutton', { name: ' Шаги:' });
  readonly caloriesInput = () => this.page.getByRole('spinbutton', { name: ' Калории (ккал):' });
  readonly workoutSelect = () => this.page.getByLabel('Тренировка:');
  readonly moodEveningSelect = () => this.page.getByLabel('Настроение вечером:');
  readonly notesTextarea = () => this.page.getByRole('textbox', { name: ' Заметки:' });
  readonly saveButton = () => this.page.getByRole('button', { name: 'Сохранить' });

  // Метод для заполнения формы
  async fillForm(pulse: string, weight: string, steps: string, calories: string, workout: string, mood: string, notes: string) {
    await this.page.getByRole('spinbutton', { name: ' Пульс (уд/мин):' }).fill(pulse);
    await this.page.getByPlaceholder('М', { exact: true }).click();
    await this.page.getByText(weight, { exact: true }).click();
    await this.page.getByRole('button', { name: '+ + Добавить взвешивание' }).click();
    await this.page.getByRole('spinbutton', { name: ' Шаги:' }).fill(steps);
    await this.page.getByRole('spinbutton', { name: ' Калории (ккал):' }).fill(calories);
    await this.page.getByLabel('Тренировка:').selectOption(workout);
    await this.page.getByLabel('Настроение вечером:').selectOption(mood);
    await this.page.getByRole('textbox', { name: ' Заметки:' }).fill(notes);
    await this.page.getByRole('button', { name: 'Сохранить' }).click();
  }

  // === Методы ===
  async fillPulse(value: string) {
    await this.pulseInput().click();
    await this.pulseInput().fill(value);
  }

  async selectDate() {
    await this.dateInput().click();
    await this.dateDay3().click();
  }

  async addWeightEntry() {
    await this.addWeightButton().click();
  }

  async fillSteps(value: string) {
    await this.stepsInput().click();
    await this.stepsInput().fill(value);
  }

  async fillCalories(value: string) {
    await this.caloriesInput().click();
    await this.caloriesInput().fill(value);
  }

  async selectWorkout(option: string) {
    await this.workoutSelect().selectOption(option);
  }

  async selectMoodEvening(option: string) {
    await this.moodEveningSelect().selectOption(option);
  }

  async fillNotes(text: string) {
    await this.notesTextarea().click();
    await this.notesTextarea().fill(text);
  }

  async save() {
    await this.saveButton().click();
  }


  // Метод для получения данных из localStorage
  async getLocalStorageData(key: string): Promise<string | null> {
    return await this.page.evaluate((key) => localStorage.getItem(key), key);
  }

  async setLocalStorage(key: string, value: string) {
    await this.page.evaluate(({ k, v }) => {
      localStorage.setItem(k, v);
    }, { k: key, v: value });
  }

  async clearLocalStorage() {
    await this.page.evaluate(() => localStorage.clear());
  }
}
