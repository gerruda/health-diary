import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Custom hook for health tracker functionality
const useHealthTracker = () => {
    // State for form fields
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [sleepHours, setSleepHours] = useState(8);
    const [sleepMinutes, setSleepMinutes] = useState(0);
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
            setSleepHours(existingEntry.sleepHours || 8);
            setSleepMinutes(existingEntry.sleepMinutes || 0);
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
            setSleepHours(8);
            setSleepMinutes(0);
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

        const totalSleep = parseFloat((sleepHours + sleepMinutes / 60).toFixed(2));

        const newEntry = {
            date,
            sleepHours,
            sleepMinutes,
            sleepQuality,
            sleepDuration: totalSleep,
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
    }, [date, sleepHours, sleepMinutes, sleepQuality, morningEnergy, weightEntries,
        steps, calories, alcohol, eveningMood, workout, notes, entries, restingPulse]);

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
            'Сон (часы)',
            'Сон (минуты)',
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
                        entry.sleepHours,
                        entry.sleepMinutes,
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
                    entry.sleepHours,
                    entry.sleepMinutes,
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
        sleepHours,
        sleepMinutes,
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
        setSleepHours,
        setSleepMinutes,
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
            <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                <p className="text-gray-500">Нет данных для отображения</p>
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
            <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                <p className="text-gray-500">Нет числовых данных для отображения</p>
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
        <div className="h-64 bg-gray-100 rounded-lg p-4">
            <h3 className="text-lg font-bold mb-2">{title}</h3>
            <div className="flex items-end h-full space-x-2 overflow-x-auto">
                {sortedData.map((group, index) => (
                    <div key={index} className="flex flex-col items-center flex-shrink-0 w-16">
                        {group.values.map((entry, subIndex) => (
                            <div key={subIndex} className="w-full relative group" title={`${entry.condition}: ${entry.value}`}>
                                <div
                                    className={`w-full rounded-t transition-all duration-300 hover:opacity-80 bg-${color}-500`}
                                    style={{
                                        height: `${getBarHeight(entry.value)}%`,
                                    }}
                                ></div>
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    {entry.condition}: {entry.value}
                                </div>
                            </div>
                        ))}
                        <span className="text-xs text-gray-500 mt-1 whitespace-nowrap">
              {new Date(group.date).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}
            </span>
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
        sleepHours,
        sleepMinutes,
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
        setSleepHours,
        setSleepMinutes,
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
        <div className="min-h-screen bg-gray-50">
            <header className="bg-blue-600 text-white p-6 shadow-md">
                <div className="container mx-auto">
                    <h1 className="text-3xl font-bold">🩺 Дневник здоровья</h1>
                    <p className="text-blue-100 mt-1">Отслеживайте свои показатели каждый день</p>
                </div>
            </header>

            <main className="container mx-auto py-8 px-4">
                {/* Tabs */}
                <div className="flex border-b border-gray-300 mb-6">
                    <button
                        className={`py-2 px-4 font-medium ${activeTab === 'entry' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
                        onClick={() => setActiveTab('entry')}
                    >
                        📝 Ввод данных
                    </button>
                    <button
                        className={`py-2 px-4 font-medium ${activeTab === 'charts' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
                        onClick={() => setActiveTab('charts')}
                    >
                        📊 Графики
                    </button>
                </div>

                {/* Daily Entry Tab */}
                {activeTab === 'entry' && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8 animate-fadeIn">
                        <h2 className="text-2xl font-bold mb-6">📊 Введите данные за {date === today ? 'сегодня' : new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">📅 Дата</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-gray-700">❤️ Пульс в покое</h3>

                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">Пульс в покое (ударов/мин)</label>
                                        <input
                                            type="number"
                                            value={restingPulse}
                                            onChange={(e) => setRestingPulse(e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Введите пульс"
                                            min="0"
                                            max="200"
                                            step="1"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-gray-700">🌙 Сон</h3>

                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">Время сна</label>
                                        <div className="flex space-x-4">
                                            <div className="flex-1">
                                                <input
                                                    type="number"
                                                    value={sleepHours}
                                                    onChange={(e) => setSleepHours(parseInt(e.target.value) || 0)}
                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    min="0"
                                                    max="24"
                                                />
                                                <p className="mt-1 text-sm text-gray-500">Часы</p>
                                            </div>
                                            <div className="flex-1">
                                                <input
                                                    type="number"
                                                    value={sleepMinutes}
                                                    onChange={(e) => setSleepMinutes(parseInt(e.target.value) || 0)}
                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    min="0"
                                                    max="59"
                                                />
                                                <p className="mt-1 text-sm text-gray-500">Минуты</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">Длительность сна</label>
                                        <div className="p-3 border border-gray-300 rounded-lg bg-gray-50">
                                            {sleepHours} ч {sleepMinutes} мин
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">Качество сна</label>
                                        <select
                                            value={sleepQuality}
                                            onChange={(e) => setSleepQuality(e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="excellent">Отличное</option>
                                            <option value="good">Хорошее</option>
                                            <option value="satisfactory">Удовлетворительное</option>
                                            <option value="poor">Плохое</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-gray-700">⚖️ Вес</h3>

                                    {weightEntries.map((entry, index) => (
                                        <div key={index} className="flex space-x-2">
                                            <div className="flex-1">
                                                <label className="block text-gray-700 font-medium mb-2">Вес (кг)</label>
                                                <input
                                                    type="number"
                                                    value={entry.value}
                                                    onChange={(e) => updateWeightEntry(index, 'value', e.target.value)}
                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="Ваш вес"
                                                    min="0"
                                                    max="300"
                                                    step="0.1"
                                                />
                                            </div>

                                            <div className="flex-1">
                                                <label className="block text-gray-700 font-medium mb-2">Условия</label>
                                                <div className="relative">
                                                    <input
                                                        list={`weightConditions-${index}`}
                                                        value={entry.condition}
                                                        onChange={(e) => updateWeightEntry(index, 'condition', e.target.value)}
                                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="Утром/Вечером, натощак и т.д."
                                                    />
                                                    <datalist id={`weightConditions-${index}`}>
                                                        {weightConditions.map((condition, idx) => (
                                                            <option key={idx} value={condition} />
                                                        ))}
                                                    </datalist>
                                                </div>
                                            </div>

                                            {index === weightEntries.length - 1 && (
                                                <button
                                                    type="button"
                                                    onClick={addWeightEntry}
                                                    className="mt-6 bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg transition-colors duration-300"
                                                    title="Добавить новое измерение веса"
                                                >
                                                    +
                                                </button>
                                            )}

                                            {index > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeWeightEntry(index)}
                                                    className="mt-6 bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg transition-colors duration-300"
                                                    title="Удалить это измерение"
                                                >
                                                    -
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-2">⚡ Утренняя энергия</label>
                                    <div className="flex items-center space-x-2">
                                        <span>1</span>
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            value={morningEnergy}
                                            onChange={(e) => setMorningEnergy(parseInt(e.target.value))}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <span>10</span>
                                        <span className="font-bold">{morningEnergy}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-gray-700 font-medium mb-2">👣 Общее количество шагов</label>
                                    <input
                                        type="number"
                                        value={steps}
                                        onChange={(e) => setSteps(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Сколько шагов вы прошли сегодня?"
                                        min="0"
                                        max="100000"
                                        step="1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-700 font-medium mb-2">🔥 Потрачено калорий</label>
                                    <input
                                        type="number"
                                        value={calories}
                                        onChange={(e) => setCalories(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Общее количество сожженных калорий"
                                        min="0"
                                        max="10000"
                                        step="1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-700 font-medium mb-2">🍷 Был ли алкоголь?</label>
                                    <div className="flex items-center space-x-4">
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                checked={alcohol}
                                                onChange={() => setAlcohol(true)}
                                                className="h-5 w-5 text-blue-600"
                                            />
                                            <span className="ml-2">Да</span>
                                        </label>
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                checked={!alcohol}
                                                onChange={() => setAlcohol(false)}
                                                className="h-5 w-5 text-blue-600"
                                            />
                                            <span className="ml-2">Нет</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-gray-700 font-medium mb-2">😊 Настроение вечером</label>
                                    <div className="flex items-center space-x-2">
                                        <span>1</span>
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            value={eveningMood}
                                            onChange={(e) => setEveningMood(parseInt(e.target.value))}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <span>10</span>
                                        <span className="font-bold">{eveningMood}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-gray-700 font-medium mb-2">🏋️ Тренировка</label>
                                    <div className="flex items-center space-x-4">
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                checked={workout}
                                                onChange={() => setWorkout(true)}
                                                className="h-5 w-5 text-blue-600"
                                            />
                                            <span className="ml-2">Да</span>
                                        </label>
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                checked={!workout}
                                                onChange={() => setWorkout(false)}
                                                className="h-5 w-5 text-blue-600"
                                            />
                                            <span className="ml-2">Нет</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-2">📝 Другие заметки</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows="4"
                                    placeholder="Любые другие заметки на сегодня..."
                                ></textarea>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 flex items-center"
                                >
                                    {entries.some(entry => entry.date === date) ? '🔄 Обновить запись' : '💾 Сохранить запись'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Charts Tab */}
                {activeTab === 'charts' && (
                    <div className="bg-white rounded-lg shadow-md p-6 animate-fadeIn">
                        <h2 className="text-2xl font-bold mb-6">📊 Анализ показателей</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Chart data={chartData.weight} title="⚖️ Изменение веса" color="blue" />
                            </div>

                            <div>
                                <Chart data={chartData.energy} title="⚡ Утренняя энергия" color="green" />
                            </div>

                            <div>
                                <Chart data={chartData.mood} title="😊 Вечернее настроение" color="purple" />
                            </div>

                            <div>
                                <Chart data={chartData.steps} title="👣 Ежедневные шаги" color="teal" />
                            </div>

                            <div>
                                <Chart data={chartData.calories} title="🔥 Сожженные калории" color="amber" />
                            </div>

                            <div>
                                <Chart data={chartData.pulse} title="❤️ Пульс в покое" color="pink" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Entry History */}
                <div className="bg-white rounded-lg shadow-md p-6 mt-8 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                        <h2 className="text-2xl font-bold">🗄️ История записей</h2>
                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                            <div className="flex gap-2">
                                <div>
                                    <label htmlFor="export-start" className="sr-only">Начальная дата</label>
                                    <input
                                        id="export-start"
                                        type="date"
                                        value={exportStartDate}
                                        onChange={(e) => setExportStartDate(e.target.value)}
                                        className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="export-end" className="sr-only">Конечная дата</label>
                                    <input
                                        id="export-end"
                                        type="date"
                                        value={exportEndDate}
                                        onChange={(e) => setExportEndDate(e.target.value)}
                                        className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={exportToCSV}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4 4m4-4v12"></path>
                                </svg>
                                📥 Экспорт в CSV
                            </button>
                        </div>
                    </div>

                    {entries.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">Нет записей. Начните с добавления данных за сегодня!</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white">
                                <thead className="bg-gray-100">
                                <tr>
                                    <th className="py-3 px-4 text-left">📅 Дата</th>
                                    <th className="py-3 px-4 text-left">🌙 Сон</th>
                                    <th className="py-3 px-4 text-left">❤️ Пульс</th>
                                    <th className="py-3 px-4 text-left">⚖️ Вес</th>
                                    <th className="py-3 px-4 text-left">👣 Шаги</th>
                                    <th className="py-3 px-4 text-left">🔥 Калории</th>
                                    <th className="py-3 px-4 text-left">😊 Настроение</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                {entries.sort((a, b) => new Date(b.date) - new Date(a.date)).map((entry, index) => (
                                    <tr
                                        key={index}
                                        className="hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                                        onClick={() => {
                                            setDate(entry.date);
                                            setSleepHours(entry.sleepHours || 8);
                                            setSleepMinutes(entry.sleepMinutes || 0);
                                            setSleepQuality(entry.sleepQuality || 'good');
                                            setMorningEnergy(entry.morningEnergy || 5);
                                            setWeightEntries(entry.weightEntries || [{ value: '', condition: '' }]);
                                            setSteps(entry.steps || '');
                                            setCalories(entry.calories || '');
                                            setAlcohol(entry.alcohol || false);
                                            setEveningMood(entry.eveningMood || 5);
                                            setWorkout(entry.workout || false);
                                            setNotes(entry.notes || '');
                                            setRestingPulse(entry.restingPulse || '');
                                            setActiveTab('entry');
                                        }}
                                    >
                                        <td className="py-3 px-4">{new Date(entry.date).toLocaleDateString('ru-RU')}</td>
                                        <td className="py-3 px-4">
                                            {entry.sleepHours || 8}ч {entry.sleepMinutes || 0}м<br/>
                                            {parseFloat((entry.sleepHours || 8) + (entry.sleepMinutes || 0) / 60).toFixed(1)} ч
                                        </td>
                                        <td className="py-3 px-4">{entry.restingPulse || '-'} уд/мин</td>
                                        <td className="py-3 px-4">
                                            {entry.weightEntries && entry.weightEntries.length > 0 ? (
                                                entry.weightEntries.map((weightEntry, i) => (
                                                    <div key={i}>{weightEntry.value || '-'}кг ({weightEntry.condition})</div>
                                                ))
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td className="py-3 px-4">{entry.steps || '-'}</td>
                                        <td className="py-3 px-4">{entry.calories || '-'}</td>
                                        <td className="py-3 px-4">{entry.eveningMood || '-'} /10</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Reminder Settings */}
                <div className="bg-white rounded-lg shadow-md p-6 mt-8 animate-fadeIn">
                    <h2 className="text-2xl font-bold mb-4">🔔 Настройки напоминаний</h2>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                        <label className="inline-flex items-center">
                            <input
                                type="checkbox"
                                checked={reminderEnabled}
                                onChange={() => setReminderEnabled(!reminderEnabled)}
                                className="h-5 w-5 text-blue-600"
                            />
                            <span className="ml-2">Включить ежедневное напоминание</span>
                        </label>

                        <div className="flex items-center space-x-2">
                            <label htmlFor="reminder-time" className="sr-only">Выберите время напоминания</label>
                            <input
                                id="reminder-time"
                                type="time"
                                value={reminderTime}
                                onChange={(e) => setReminderTime(e.target.value)}
                                className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={!reminderEnabled}
                            />
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 00-18 0 9 9 0 0018 0z"></path>
                            </svg>
                        </div>

                        <p className="text-sm text-gray-500 flex-1">
                            {reminderEnabled
                                ? "Вы будете получать напоминания в это время каждый день."
                                : "Включите напоминание, чтобы установить время для ежедневного ввода данных."}
                        </p>
                    </div>
                </div>
            </main>

            <footer className="bg-gray-100 py-6 mt-12">
                <div className="container mx-auto px-4 text-center text-gray-600">
                    <p>© {new Date().getFullYear()} 🩺 Дневник здоровья - Все права защищены</p>
                </div>
            </footer>
        </div>
    );
}
