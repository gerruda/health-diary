import EventEmitter from './utils/event-emitter.js';

const STORAGE_KEY = 'health-diary-entries';
const DRAFTS_KEY = 'health-diary-drafts';
const DATA_VERSION = 1;

export default class DataManager extends EventEmitter {
    constructor() {
        super();
        this._saveTimeout = null;
        this._migrateLegacyData();
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

    _saveData() {
        clearTimeout(this._saveTimeout);
        this._saveTimeout = setTimeout(() => {
            const entries = this.getAllEntries();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
            this.emit('data-saved');
        }, 500);
    }

    getAllEntries() {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const drafts = JSON.parse(sessionStorage.getItem(DRAFTS_KEY) || '[]');
        return [...saved, ...drafts];
    }

    saveEntry(type, date, data, isDraft = false) {
        const entries = this.getAllEntries();
        const newEntry = this._createEntry(type, date, data, isDraft);

        // Удаляем старые записи того же типа и даты
        const filtered = entries.filter(entry =>
            !(entry.date === date && entry.type === type && entry.isDraft === isDraft)
        );

        const storage = isDraft ? sessionStorage : localStorage;
        storage.setItem(
            isDraft ? DRAFTS_KEY : STORAGE_KEY,
            JSON.stringify([...filtered, newEntry])
        );

        this.emit('entry-updated', { type, date, data, isDraft });
        this._saveData();
    }

    deleteDraft(date) {
        const drafts = JSON.parse(sessionStorage.getItem(DRAFTS_KEY) || '[]');
        const filtered = drafts.filter(entry => entry.date !== date);
        sessionStorage.setItem(DRAFTS_KEY, JSON.stringify(filtered));
        this.emit('draft-deleted', date);
        this._saveData();
    }

    getEntries(type, period = 'all') {
        const entries = this.getAllEntries().filter(entry =>
            entry.type === type && !entry.isDraft
        );

        // Фильтрация по периоду
        if (period === 'week') {
            const today = new Date();
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());

            return entries.filter(entry =>
                new Date(entry.date) >= startOfWeek
            );
        }

        return entries;
    }
}
