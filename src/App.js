import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';

// Custom hook for health tracker functionality
const useHealthTracker = () => {
    // State for form fields
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [sleepStart, setSleepStart] = useState('23:00');
    const [sleepEnd, setSleepEnd] = useState('07:00');
    const [sleepQuality, setSleepQuality] = useState('good');
    const [morningEnergy, setMorningEnergy] = useState(5);
    const [weightEntries, setWeightEntries] = useState([{ value: '', condition: '' }]);
    const [weightConditions, setWeightConditions] = useState(['утро натощак', 'вечер', 'после тренировки']);
    const [steps, setSteps] = useState('');
    const [calories, setCalories] = useState('');
    const [alcohol, setAlcohol] = useState(false);
    const [eveningMood, setEveningMood] = useState(5);
    const [workout, setWorkout] = useState(false);
    const [notes, setNotes] = useState('');
    const [restingPulse, setRestingPulse] = useState('');
    const [entries, setEntries] = useState([]);
    const [activeTab, setActiveTab] = useState('entry');
    const [reminderTime, setReminderTime] = useState('09:00');
    const [reminderEnabled, setReminderEnabled] = useState(false);
    const [exportStartDate, setExportStartDate] = useState('');
    const [exportEndDate, setExportEndDate] = useState('');

    // Load entries from localStorage on initial render
    useEffect(() => {
        const savedEntries = localStorage.getItem('healthEntries');
        if (savedEntries) {
            const parsedEntries = JSON.parse(savedEntries);
            setEntries(parsedEntries);
        }

        const savedConditions = localStorage.getItem('weightConditions');
        if (savedConditions) {
            setWeightConditions(JSON.parse(savedConditions));
        }
    }, []);

    // Save entries and conditions to localStorage
    useEffect(() => {
        localStorage.setItem('healthEntries', JSON.stringify(entries));
    }, [entries]);

    useEffect(() => {
        localStorage.setItem('weightConditions', JSON.stringify(weightConditions));
    }, [weightConditions]);

    // Calculate sleep duration
    const calculateSleepDuration = useCallback(() => {
        if (!sleepStart || !sleepEnd) return 0;

        const [startHours, startMinutes] = sleepStart.split(':').map(Number);
        const [endHours, endMinutes] = sleepEnd.split(':').map(Number);

        let start = new Date();
        start.setHours(startHours, startMinutes, 0);

        let end = new Date();
        end.setHours(endHours, endMinutes, 0);

        // If end time is before start time (overnight sleep)
        if (end < start) {
            end.setDate(end.getDate() + 1);
        }

        return Math.round((end - start) / (1000 * 60 * 60 * 24) * 100) / 100;
    }, [sleepStart, sleepEnd]);

    // Check if entry exists for today
    const hasEntryForToday = useCallback(() => {
        const today = new Date().toISOString().split('T')[0];
        return entries.some(entry => entry.date === today);
    }, [entries]);

    // Set up reminder check
    useEffect(() => {
        if (!reminderEnabled) return;

        const checkReminder = () => {
            const now = new Date();
            const currentTime = now.toTimeString().slice(0, 5);

            if (currentTime === reminderTime && !hasEntryForToday()) {
                alert('⏰ Не забудьте ввести данные за сегодня!');
            }
        };

        const interval = setInterval(checkReminder, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [reminderTime, reminderEnabled, hasEntryForToday]);

    // Handle date change
    const handleDateChange = useCallback((newDate) => {
        setDate(newDate);

        // Load existing data for selected date
        const existingEntry = entries.find(entry => entry.date === newDate);
        if (existingEntry) {
            setSleepStart(existingEntry.sleepStart || '23:00');
            setSleepEnd(existingEntry.sleepEnd || '07:00');
            setSleepQuality(existingEntry.sleepQuality || 'good');
            setMorningEnergy(existingEntry.morningEnergy || 5);
            setWeightEntries(existingEntry.weightEntries || [{ value: '', condition: '' }]);
            setSteps(existingEntry.steps || '');
            setCalories(existingEntry.calories || '');
            setAlcohol(existingEntry.alcohol || false);
            setEveningMood(existingEntry.eveningMood || 5);
            setWorkout(existingEntry.workout || false);
            setNotes(existingEntry.notes || '');
            setRestingPulse(existingEntry.restingPulse || '');
        } else {
            // Reset form for new date
            setSleepStart('23:00');
            setSleepEnd('07:00');
            setSleepQuality('good');
            setMorningEnergy(5);
            setWeightEntries([{ value: '', condition: '' }]);
            setSteps('');
            setCalories('');
            setAlcohol(false);
            setEveningMood(5);
            setWorkout(false);
            setNotes('');
            setRestingPulse('');
        }
    }, [entries]);

    // Add new weight entry
    const addWeightEntry = useCallback(() => {
        setWeightEntries([...weightEntries, { value: '', condition: '' }]);
    }, [weightEntries]);

    // Update weight entry
    const updateWeightEntry = useCallback((index, field, value) => {
        const updatedEntries = [...weightEntries];
        updatedEntries[index][field] = value;

        // If condition is new, add to conditions list
        if (field === 'condition' && value && !weightConditions.includes(value)) {
            setWeightConditions([...weightConditions, value]);
        }

        setWeightEntries(updatedEntries);
    }, [weightEntries, weightConditions]);

    // Remove weight entry
    const removeWeightEntry = useCallback((index) => {
        if (weightEntries.length > 1) {
            const updatedEntries = [...weightEntries];
            updatedEntries.splice(index, 1);
            setWeightEntries(updatedEntries);
        }
    }, [weightEntries]);

    // Submit form
    const handleSubmit = useCallback((e) => {
        e.preventDefault();

        const newEntry = {
            date,
            sleepStart,
            sleepEnd,
            sleepQuality,
            sleepDuration: calculateSleepDuration(),
            restingPulse: parseFloat(restingPulse),
            morningEnergy,
            weightEntries,
            steps: parseInt(steps),
            calories: parseInt(calories),
            alcohol,
            eveningMood,
            workout,
            notes
        };

        // Check if entry for this date already exists
        const existingIndex = entries.findIndex(entry => entry.date === date);

        if (existingIndex >= 0) {
            // Update existing entry
            const updatedEntries = [...entries];
            updatedEntries[existingIndex] = newEntry;
            setEntries(updatedEntries);
        } else {
            // Add new entry
            setEntries([...entries, newEntry]);
        }
    }, [date, sleepStart, sleepEnd, sleepQuality, morningEnergy, weightEntries,
        steps, calories, alcohol, eveningMood, workout, notes, entries, calculateSleepDuration, restingPulse]);

    // Export data to CSV
    const exportToCSV = useCallback(() => {
        const csvRows = [];

        // Filter entries by date range
        const filteredEntries = entries.filter(entry => {
            if (!exportStartDate || !exportEndDate) return true;
            return entry.date >= exportStartDate && entry.date <= exportEndDate;
        });

        // Add header
        csvRows.push([
            'Дата',
            'Время сна (начало)',
            'Время сна (конец)',
            'Качество сна',
            'Длительность сна',
            'Пульс в покое',
            'Утренняя энергия',
            'Вес',
            'Условия взвешивания',
            'Шаги',
            'Калории',
            'Алкоголь',
            'Настроение вечером',
            'Тренировка',
            'Заметки'
        ].join(','));

        // Add data rows
        filteredEntries.forEach(entry => {
            if (entry.weightEntries && entry.weightEntries.length > 0) {
                entry.weightEntries.forEach(weightEntry => {
                    csvRows.push([
                        entry.date,
                        entry.sleepStart,
                        entry.sleepEnd,
                        entry.sleepQuality,
                        entry.sleepDuration,
                        entry.restingPulse,
                        entry.morningEnergy,
                        weightEntry.value,
                        weightEntry.condition,
                        entry.steps,
                        entry.calories,
                        entry.alcohol ? 'Да' : 'Нет',
                        entry.eveningMood,
                        entry.workout ? 'Да' : 'Нет',
                        `"${entry.notes}"`
                    ].join(','));
                });
            } else {
                csvRows.push([
                    entry.date,
                    entry.sleepStart,
                    entry.sleepEnd,
                    entry.sleepQuality,
                    entry.sleepDuration,
                    entry.restingPulse,
                    entry.morningEnergy,
                    '',
                    '',
                    entry.steps,
                    entry.calories,
                    entry.alcohol ? 'Да' : 'Нет',
                    entry.eveningMood,
                    entry.workout ? 'Да' : 'Нет',
                    `"${entry.notes}"`
                ].join(','));
            }
        });

        // Create CSV file
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `health_data_${exportStartDate || 'start'}_${exportEndDate || 'end'}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [entries, exportStartDate, exportEndDate]);

    // Chart data preparation
    const chartData = useMemo(() => {
        const weightData = [];
        const energyData = [];
        const moodData = [];
        const stepsData = [];
        const caloriesData = [];
        const pulseData = [];

        entries.forEach(entry => {
            if (entry.weightEntries) {
                entry.weightEntries.forEach(weightEntry => {
                    if (weightEntry.value && weightEntry.condition) {
                        weightData.push({ date: entry.date, value: parseFloat(weightEntry.value), condition: weightEntry.condition });
                    }
                });
            }

            energyData.push({ date: entry.date, value: entry.morningEnergy });
            moodData.push({ date: entry.date, value: entry.eveningMood });
            stepsData.push({ date: entry.date, value: entry.steps });
            caloriesData.push({ date: entry.date, value: entry.calories });
            pulseData.push({ date: entry.date, value: entry.restingPulse });
        });

        return {
            weight: weightData,
            energy: energyData,
            mood: moodData,
            steps: stepsData,
            calories: caloriesData,
            pulse: pulseData,
        };
    }, [entries]);

    return {
        // State
        date,
        sleepStart,
        sleepEnd,
        sleepQuality,
        morningEnergy,
        weightEntries,
        weightConditions,
        steps,
        calories,
        alcohol,
        eveningMood,
        workout,
        notes,
        restingPulse,
        entries,
        activeTab,
        reminderTime,
        reminderEnabled,
        chartData,
        exportStartDate,
        exportEndDate,

        // Functions
        setDate: handleDateChange,
        setSleepStart,
        setSleepEnd,
        setSleepQuality,
        setMorningEnergy,
        setWeightEntries,
        setSteps,
        setCalories,
        setAlcohol,
        setEveningMood,
        setWorkout,
        setNotes,
        setRestingPulse,
        setActiveTab,
        setReminderTime,
        setReminderEnabled,
        setExportStartDate,
        setExportEndDate,
        addWeightEntry,
        updateWeightEntry,
        removeWeightEntry,
        handleSubmit,
        exportToCSV
    };
};

// Chart Component
const Chart = React.memo(({ data, title, color = "blue" }) => {
    if (!data || data.length === 0) {
        return (
            <div className="chart-container">
                <h3>{title}</h3>
                <div className="chart-no-data">Нет данных для отображения</div>
            </div>
        );
    }

    // Group data by date
    const groupedData = data.reduce((acc, entry) => {
        if (!acc[entry.date]) {
            acc[entry.date] = { date: entry.date, values: [] };
        }
        if (entry.value !== null && entry.value !== undefined && !isNaN(entry.value)) {
            acc[entry.date].values.push(entry);
        }
        return acc;
    }, {});

    // Convert to array and sort by date
    const sortedData = Object.values(groupedData).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Find min and max values for scaling
    const values = sortedData.flatMap(d => d.values.map(v => v.value)).filter(v => !isNaN(v));
    if (values.length === 0) {
        return (
            <div className="chart-container">
                <h3>{title}</h3>
                <div className="chart-no-data">Нет числовых данных для отображения</div>
            </div>
        );
    }

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue;

    // Calculate bar height (with minimum height if range is zero)
    const getBarHeight = (value) => {
        if (range === 0) return 50;
        return Math.max(10, 100 * ((value - minValue) / range));
    };

    return (
        <div className="chart-container">
            <h3>{title}</h3>
            <div className="chart-axis">
                {sortedData.map((group, index) => (
                    <div key={index} className="chart-bar-group">
                        {group.values.map((entry, subIndex) => (
                            <div key={subIndex} className="chart-bar-wrapper">
                                <div
                                    className="chart-bar"
                                    style={{
                                        height: `${getBarHeight(entry.value)}%`,
                                        backgroundColor: `#${color}99`
                                    }}
                                    title={`${entry.condition}: ${entry.value}`}
                                ></div>
                                <div className="chart-bar-tooltip">
                                    {entry.condition}: {entry.value}
                                </div>
                            </div>
                        ))}
                        <div className="chart-date">
                            {new Date(group.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});

// Main Component
export default function App() {
    const {
        // State
        date,
        sleepStart,
        sleepEnd,
        sleepQuality,
        morningEnergy,
        weightEntries,
        weightConditions,
        steps,
        calories,
        alcohol,
        eveningMood,
        workout,
        notes,
        restingPulse,
        entries,
        activeTab,
        reminderTime,
        reminderEnabled,
        chartData,
        exportStartDate,
        exportEndDate,

        // Functions
        setDate,
        setSleepStart,
        setSleepEnd,
        setSleepQuality,
        setMorningEnergy,
        setWeightEntries,
        setSteps,
        setCalories,
        setAlcohol,
        setEveningMood,
        setWorkout,
        setNotes,
        setRestingPulse,
        setActiveTab,
        setReminderTime,
        setReminderEnabled,
        setExportStartDate,
        setExportEndDate,
        addWeightEntry,
        updateWeightEntry,
        removeWeightEntry,
        handleSubmit,
        exportToCSV
    } = useHealthTracker();

    // Get today's date for comparison
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="app-container">
            <header className="header">
                <div className="header-content">
                    <h1>🩺 Дневник здоровья</h1>
                    <p>Отслеживайте свои показатели каждый день</p>
                </div>
            </header>

            <main className="main">
                {/* Tabs */}
                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'entry' ? 'active' : ''}`}
                        onClick={() => setActiveTab('entry')}
                    >
                        📝 Ввод данных
                    </button>
                    <button
                        className={`tab ${activeTab === 'charts' ? 'active' : ''}`}
                        onClick={() => setActiveTab('charts')}
                    >
                        📊 Графики
                    </button>
                </div>

                {/* Daily Entry Tab */}
                {activeTab === 'entry' && (
                    <div className="form-container">
                        <h2>📊 Введите данные за {date === today ? 'сегодня' : new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</h2>

                        <form onSubmit={handleSubmit} className="data-form">
                            <div className="form-group">
                                <label>📅 Дата</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-section">
                                <h3>❤️ Пульс в покое</h3>
                                <div className="form-group">
                                    <label>Пульс в покое (ударов/мин)</label>
                                    <input
                                        type="number"
                                        value={restingPulse}
                                        onChange={(e) => setRestingPulse(e.target.value)}
                                        placeholder="Введите пульс"
                                        min="0"
                                        max="200"
                                        step="1"
                                    />
                                </div>
                            </div>

                            <div className="form-section">
                                <h3>🌙 Сон</h3>
                                <div className="form-group">
                                    <label>Время сна (начало)</label>
                                    <input
                                        type="time"
                                        value={sleepStart}
                                        onChange={(e) => setSleepStart(e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Время сна (конец)</label>
                                    <input
                                        type="time"
                                        value={sleepEnd}
                                        onChange={(e) => setSleepEnd(e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Качество сна</label>
                                    <select
                                        value={sleepQuality}
                                        onChange={(e) => setSleepQuality(e.target.value)}
                                    >
                                        <option value="excellent">Отличное</option>
                                        <option value="good">Хорошее</option>
                                        <option value="satisfactory">Удовлетворительное</option>
                                        <option value="poor">Плохое</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3>⚖️ Вес</h3>

                                {weightEntries.map((entry, index) => (
                                    <div key={index} className="form-group">
                                        <div className="weight-entry">
                                            <div className="weight-field">
                                                <label>Вес (кг)</label>
                                                <input
                                                    type="number"
                                                    value={entry.value}
                                                    onChange={(e) => updateWeightEntry(index, 'value', e.target.value)}
                                                    placeholder="Ваш вес"
                                                    min="0"
                                                    max="300"
                                                    step="0.1"
                                                />
                                            </div>

                                            <div className="condition-field">
                                                <label>Условия</label>
                                                <input
                                                    list={`weightConditions-${index}`}
                                                    value={entry.condition}
                                                    onChange={(e) => updateWeightEntry(index, 'condition', e.target.value)}
                                                    placeholder="Утром/Вечером, натощак и т.д."
                                                />
                                                <datalist id={`weightConditions-${index}`}>
                                                    {weightConditions.map((condition, idx) => (
                                                        <option key={idx} value={condition} />
                                                    ))}
                                                </datalist>
                                            </div>

                                            <div className="weight-buttons">
                                                {index === weightEntries.length - 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={addWeightEntry}
                                                        className="add-button"
                                                    >
                                                        +
                                                    </button>
                                                )}

                                                {index > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeWeightEntry(index)}
                                                        className="remove-button"
                                                    >
                                                        -
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="form-section">
                                <h3>⚡ Утренняя энергия</h3>
                                <div className="range-container">
                                    <span>1</span>
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={morningEnergy}
                                        onChange={(e) => setMorningEnergy(parseInt(e.target.value))}
                                    />
                                    <span>10</span>
                                    <span className="range-value">{morningEnergy}</span>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3>👣 Общее количество шагов</h3>
                                <div className="form-group">
                                    <input
                                        type="number"
                                        value={steps}
                                        onChange={(e) => setSteps(e.target.value)}
                                        placeholder="Сколько шагов вы прошли сегодня?"
                                        min="0"
                                        max="100000"
                                        step="1"
                                    />
                                </div>
                            </div>

                            <div className="form-section">
                                <h3>🔥 Потрачено калорий</h3>
                                <div className="form-group">
                                    <input
                                        type="number"
                                        value={calories}
                                        onChange={(e) => setCalories(e.target.value)}
                                        placeholder="Общее количество сожженных калорий"
                                        min="0"
                                        max="10000"
                                        step="1"
                                    />
                                </div>
                            </div>

                            <div className="form-section">
                                <h3>🍷 Был ли алкоголь?</h3>
                                <div className="radio-group">
                                    <label>
                                        <input
                                            type="radio"
                                            checked={alcohol}
                                            onChange={() => setAlcohol(true)}
                                        />
                                        <span>Да</span>
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            checked={!alcohol}
                                            onChange={() => setAlcohol(false)}
                                        />
                                        <span>Нет</span>
                                    </label>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3>😊 Настроение вечером</h3>
                                <div className="range-container">
                                    <span>1</span>
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={eveningMood}
                                        onChange={(e) => setEveningMood(parseInt(e.target.value))}
                                    />
                                    <span>10</span>
                                    <span className="range-value">{eveningMood}</span>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3>🏋️ Тренировка</h3>
                                <div className="radio-group">
                                    <label>
                                        <input
                                            type="radio"
                                            checked={workout}
                                            onChange={() => setWorkout(true)}
                                        />
                                        <span>Да</span>
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            checked={!workout}
                                            onChange={() => setWorkout(false)}
                                        />
                                        <span>Нет</span>
                                    </label>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3>📝 Другие заметки</h3>
                                <div className="form-group">
                  <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Любые другие заметки на сегодня..."
                  ></textarea>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="save-button">
                                    {entries.some(entry => entry.date === date) ? '🔄 Обновить запись' : '💾 Сохранить запись'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Charts Tab */}
                {activeTab === 'charts' && (
                    <div className="charts-container">
                        <h2>📊 Анализ показателей</h2>

                        <div className="charts">
                            <div className="chart-wrapper">
                                <Chart data={chartData.weight} title="⚖️ Изменение веса" color="4A90E2" />
                            </div>

                            <div className="chart-wrapper">
                                <Chart data={chartData.energy} title="⚡ Утренняя энергия" color="764BA2" />
                            </div>

                            <div className="chart-wrapper">
                                <Chart data={chartData.mood} title="😊 Вечернее настроение" color="9063CD" />
                            </div>

                            <div className="chart-wrapper">
                                <Chart data={chartData.steps} title="👣 Ежедневные шаги" color="FF6B6B" />
                            </div>

                            <div className="chart-wrapper">
                                <Chart data={chartData.calories} title="🔥 Сожженные калории" color="FF964A" />
                            </div>

                            <div className="chart-wrapper">
                                <Chart data={chartData.pulse} title="❤️ Пульс в покое" color="FF475C" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Entry History */}
                <div className="history-container">
                    <div className="history-header">
                        <h2>🗄️ История записей</h2>
                        <div className="export-controls">
                            <div className="date-range">
                                <input
                                    type="date"
                                    value={exportStartDate}
                                    onChange={(e) => setExportStartDate(e.target.value)}
                                />
                                <input
                                    type="date"
                                    value={exportEndDate}
                                    onChange={(e) => setExportEndDate(e.target.value)}
                                />
                            </div>
                            <button onClick={exportToCSV} className="export-button">
                                <span>📥</span> Экспорт в CSV
                            </button>
                        </div>
                    </div>

                    {entries.length === 0 ? (
                        <div className="no-data">
                            <p>Нет записей. Начните с добавления данных за сегодня!</p>
                        </div>
                    ) : (
                        <div className="history-table">
                            <table>
                                <thead>
                                <tr>
                                    <th>📅 Дата</th>
                                    <th>🌙 Сон</th>
                                    <th>❤️ Пульс</th>
                                    <th>⚖️ Вес</th>
                                    <th>👣 Шаги</th>
                                    <th>🔥 Калории</th>
                                    <th>😊 Настроение</th>
                                </tr>
                                </thead>
                                <tbody>
                                {entries.sort((a, b) => new Date(b.date) - new Date(a.date)).map((entry, index) => (
                                    <tr
                                        key={index}
                                        className="history-row"
                                        onClick={() => {
                                            setDate(entry.date);
                                            setSleepStart(entry.sleepStart || '23:00');
                                            setSleepEnd(entry.sleepEnd || '07:00');
                                            setSleepQuality(entry.sleepQuality || 'good');
                                            setMorningEnergy(entry.morningEnergy || 5);
                                            setWeightEntries(entry.weightEntries || [{ value: '', condition: '' }]);
                                            setSteps(entry.steps || '');
                                            setCalories(entry.calories || '');
                                            setAlcohol(entry.alcohol || false);
                                            setEveningMood(entry.eveningMood || 5);
                                            setWorkout(entry.workout || false);
                                            setNotes(entry.notes || '');
                                            setActiveTab('entry');
                                        }}
                                    >
                                        <td>{new Date(entry.date).toLocaleDateString('ru-RU')}</td>
                                        <td>{entry.sleepStart} - {entry.sleepEnd}</td>
                                        <td>{entry.restingPulse || '-'} уд/мин</td>
                                        <td>
                                            {entry.weightEntries && entry.weightEntries.length > 0 ? (
                                                entry.weightEntries.map((weightEntry, i) => (
                                                    <div key={i}>{weightEntry.value || '-'}кг ({weightEntry.condition})</div>
                                                ))
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td>{entry.steps || '-'}</td>
                                        <td>{entry.calories || '-'}</td>
                                        <td>{entry.eveningMood || '-'} /10</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Reminder Settings */}
                <div className="reminder-container">
                    <h2>🔔 Настройки напоминаний</h2>

                    <div className="reminder-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={reminderEnabled}
                                onChange={() => setReminderEnabled(!reminderEnabled)}
                            />
                            <span>Включить ежедневное напоминание</span>
                        </label>

                        <div className="reminder-time">
                            <input
                                type="time"
                                value={reminderTime}
                                onChange={(e) => setReminderTime(e.target.value)}
                                disabled={!reminderEnabled}
                            />
                        </div>
                    </div>
                </div>
            </main>

            <footer className="footer">
                <div className="footer-content">
                    <p>© {new Date().getFullYear()} 🩺 Дневник здоровья - Все права защищены</p>
                </div>
            </footer>
        </div>
    );
}
