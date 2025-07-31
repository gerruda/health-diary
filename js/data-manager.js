import EventEmitter from './utils/event-emitter.js';

const STORAGE_KEY = 'health-diary-entries';
const DRAFTS_KEY = 'health-diary-drafts';
const DATA_VERSION = 1;

export default class DataManager extends EventEmitter {
    constructor() {
        super();
        this._saveTimeout = null;
        this._migrateLegacyData();
        this._migrateWorkoutHistory(); // Добавляем миграцию старых тренировок
        this.load();
    }

    load() {
        try {
            const storedData = localStorage.getItem(STORAGE_KEY);
            if (storedData) {
                this.entries = JSON.parse(storedData) || [];
            }
        } catch (e) {
            console.error("Ошибка загрузки данных:", e);
            this.entries = [];
        }
    }

    save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
    }

    // Миграция старых данных
    _migrateLegacyData() {
        const legacyDiary = localStorage.getItem('diaryEntries');
        const legacyTraining = localStorage.getItem('trainingEntries');
        const legacyDraft = sessionStorage.getItem('currentDraft');

        const entries = [];

        if (legacyDiary) {
            const data = JSON.parse(legacyDiary);
            for (const [date, entry] of Object.entries(data)) {
                entries.push(this._createEntry('diary', date, entry, false));
            }
            localStorage.removeItem('diaryEntries');
        }

        if (legacyTraining) {
            const data = JSON.parse(legacyTraining);
            for (const [date, items] of Object.entries(data)) {
                items.forEach(item => {
                    entries.push(this._createEntry('training', date, item, false));
                });
            }
            localStorage.removeItem('trainingEntries');
        }

        if (entries.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
        }

        if (legacyDraft) {
            const { date, ...data } = JSON.parse(legacyDraft);
            sessionStorage.setItem(DRAFTS_KEY, JSON.stringify([
                this._createEntry('diary', date, data, true)
            ]));
            sessionStorage.removeItem('currentDraft');
        }
    }

    // Миграция старых данных тренировок
    _migrateWorkoutHistory() {
        const legacyTraining = localStorage.getItem('workoutHistory');
        if (!legacyTraining) return;

        try {
            const workoutHistory = JSON.parse(legacyTraining);

            for (const [date, exercises] of Object.entries(workoutHistory)) {
                exercises.forEach(exercise => {
                    this.saveEntry('training', date, exercise, false);
                });
            }

            localStorage.removeItem('workoutHistory');
        } catch (e) {
            console.error('Workout history migration failed:', e);
        }
    }

    _createEntry(type, date, data, isDraft) {
        return {
            date,
            type,
            data,
            isDraft,
            version: DATA_VERSION,
            timestamp: Date.now()
        };
    }

    getAllEntries() {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const drafts = JSON.parse(sessionStorage.getItem(DRAFTS_KEY) || '[]');
        return [...saved, ...drafts];
    }

    saveEntry(type, date, data, isDraft = false) {
        // Генерируем ID если нужно
        if (!data.id) {
            data.id = Date.now().toString();
        }

        const newEntry = {
            id: data.id, // Используем ID из данных
            type,
            date,
            data,
            isDraft,
            version: DATA_VERSION,
            timestamp: Date.now()
        };

        const entries = this.getAllEntries();
        const existingIndex = entries.findIndex(e =>
            e.id === newEntry.id &&
            e.isDraft === isDraft
        );

        let updatedEntries;
        if (existingIndex !== -1) {
            // Обновляем существующую запись
            updatedEntries = [...entries];
            updatedEntries[existingIndex] = newEntry;
        } else {
            // Добавляем новую запись
            updatedEntries = [...entries, newEntry];
        }

        // Разделяем на сохраненные и черновики
        const saved = updatedEntries.filter(e => !e.isDraft);
        const drafts = updatedEntries.filter(e => e.isDraft);

        // Сохраняем
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
        sessionStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));

        this.emit('entry-updated', newEntry);
    }

    deleteEntry(id) {
        const entries = this.getAllEntries();
        const updatedEntries = entries.filter(entry => entry.id != id);

        // Разделяем на сохраненные и черновики
        const saved = updatedEntries.filter(e => !e.isDraft);
        const drafts = updatedEntries.filter(e => e.isDraft);

        // Сохраняем раздельно
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
        sessionStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));

        this.emit('entry-deleted', id);
        return true;
    }

    deleteDraft(date) {
        const drafts = JSON.parse(sessionStorage.getItem(DRAFTS_KEY) || []);
        const filtered = drafts.filter(entry => !(entry.date === date && entry.isDraft));
        sessionStorage.setItem(DRAFTS_KEY, JSON.stringify(filtered));
        this.emit('draft-deleted', date);
    }

    getEntry(id) {
        if (!id) return null;
        return this.entries.find(entry => entry.id === id);
    }

    addEntry(entry) {
        // Генерируем ID если отсутствует
        if (!entry.id) {
            entry.id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
        }

        // Проверяем инициализирован ли массив
        if (!Array.isArray(this.entries)) {
            console.warn("this.entries is not array. Initializing new array.");
            this.entries = [];
        }

        this.entries.push(entry);
        this.save();
        return entry.id;
    }

    updateEntry(id, newData) {
        if (!id) return false;

        const index = this.entries.findIndex(entry => entry.id === id);
        if (index !== -1) {
            this.entries[index] = {
                ...this.entries[index],
                ...newData,
                id // Сохраняем оригинальный ID
            };
            this.save();
            return true;
        }
        return false;
    }

    bulkAddEntries(entries) {
        entries.forEach(entry => {
            const existing = this.getEntry(entry.id);
            if (existing) {
                this.updateEntry(entry.id, entry.data);
            } else {
                this.addEntry(entry);
            }
        });
    }
}
