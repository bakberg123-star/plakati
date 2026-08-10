'use client';

import React, { useState, useEffect } from 'react';
import MoscowPoster from "./MoscowPoster";
import MeetingPoster from "./MeetingPoster";
import PikPoster from "./PikPoster";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RotateCcw, X, Download, FileText, Plus } from "lucide-react";
import { Clock, Calendar } from "lucide-react";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface DateInfo {
	id: number;
	date: string;
	isoDate: string;
	timeStart: string;
	timeEnd: string;
}

type PosterType = 'rounds' | 'meetings' | 'pik';

export default function PosterGenerator() {
	const [posterType, setPosterType] = useState<PosterType>('rounds');
	const [dates, setDates] = useState<DateInfo[]>([
		{
			id: 1,
			date: '',
			isoDate: '',
			timeStart: '',
			timeEnd: ''
		}
	]);
	const [phone, setPhone] = useState('8 (499) 652-62-11');
	const [showPhone, setShowPhone] = useState(true);
	const [isLoaded, setIsLoaded] = useState(false);

	// Новые поля для плаката встреч
	const [meetingType, setMeetingType] = useState<'registration' | 'oss'>('registration');
	const [meetingLocation, setMeetingLocation] = useState('');
	const [agenda, setAgenda] = useState('');

	// Новые поля для ПИК плаката
	const [ukName, setUkName] = useState('ПИК-Комфорт Сириус');
	const [pikAddress, setPikAddress] = useState('улица Большая Очаковская,\nдом 2, подъезд 3');
	const [workDays, setWorkDays] = useState([
		{ name: 'Понедельник', enabled: false, timeStart: '09:00', timeEnd: '18:00' },
		{ name: 'Вторник', enabled: false, timeStart: '09:00', timeEnd: '18:00' },
		{ name: 'Среда', enabled: true, timeStart: '09:00', timeEnd: '18:00' },
		{ name: 'Четверг', enabled: false, timeStart: '09:00', timeEnd: '18:00' },
		{ name: 'Пятница', enabled: true, timeStart: '09:00', timeEnd: '18:00' },
		{ name: 'Суббота', enabled: false, timeStart: '09:00', timeEnd: '18:00' },
		{ name: 'Воскресенье', enabled: false, timeStart: '09:00', timeEnd: '18:00' }
	]);

	// Обработчик изменения типа плаката
	const handlePosterTypeChange = (newType: PosterType) => {
		setPosterType(newType);

		// Если переключаемся на плакат встреч или ПИК и у нас больше одной даты, оставляем только первую
		if (newType !== 'rounds' && dates.length > 1) {
			const firstDate = dates[0];
			setDates([firstDate]);
		}

		// Если переключаемся на плакат обходов и у нас только одна пустая дата, добавляем еще одну
		if (newType === 'rounds' && dates.length === 1 && !dates[0].date && !dates[0].timeStart) {
			setDates([
				dates[0],
				{
					id: 2,
					date: '',
					isoDate: '',
					timeStart: '',
					timeEnd: ''
				}
			]);
		}
	};

	// Загрузка сохраненного состояния при монтировании компонента
	useEffect(() => {
		const savedData = localStorage.getItem('posterGeneratorData');
		if (savedData) {
			try {
				const parsedData = JSON.parse(savedData);

				// Загружаем тип плаката
				if (parsedData.posterType) {
					setPosterType(parsedData.posterType);
				}

				// Проверяем, в каком формате сохранены данные
				if (parsedData.dates) {
					// Если это массив - используем как есть
					if (Array.isArray(parsedData.dates)) {
						setDates(parsedData.dates);
					} else {
						// Если это старый формат с first/second - конвертируем в массив
						const convertedDates: DateInfo[] = [];

						if (parsedData.dates.first) {
							convertedDates.push({
								id: 1,
								date: parsedData.dates.first.date || '',
								isoDate: parsedData.dates.first.isoDate || '',
								timeStart: parsedData.dates.first.timeStart || '',
								timeEnd: parsedData.dates.first.timeEnd || ''
							});
						}

						if (parsedData.dates.second) {
							convertedDates.push({
								id: 2,
								date: parsedData.dates.second.date || '',
								isoDate: parsedData.dates.second.isoDate || '',
								timeStart: parsedData.dates.second.timeStart || '',
								timeEnd: parsedData.dates.second.timeEnd || ''
							});
						}

						// Если нет конвертированных дат, устанавливаем пустой массив по умолчанию
						if (convertedDates.length === 0) {
							convertedDates.push({
								id: 1,
								date: '',
								isoDate: '',
								timeStart: '',
								timeEnd: ''
							});
						}

						setDates(convertedDates);
					}
				}

				if (parsedData.phone) {
					setPhone(parsedData.phone);
				}
				if (parsedData.showPhone !== undefined) {
					setShowPhone(parsedData.showPhone);
				}

				// Загружаем новые поля для встреч
				if (parsedData.meetingType) {
					setMeetingType(parsedData.meetingType);
				}
				if (parsedData.meetingLocation) {
					setMeetingLocation(parsedData.meetingLocation);
				}
				if (parsedData.agenda) {
					setAgenda(parsedData.agenda);
				}

				// Загружаем новые поля для ПИК
				if (parsedData.ukName) {
					setUkName(parsedData.ukName);
				}
				if (parsedData.pikAddress) {
					setPikAddress(parsedData.pikAddress);
				}
				if (parsedData.workDays && Array.isArray(parsedData.workDays)) {
					setWorkDays(parsedData.workDays);
				}

				// Проверяем флаг автоматической генерации и очищаем его
				if (parsedData.autoGenerate) {
					// Очищаем флаг автоматической генерации
					const updatedData = { ...parsedData, autoGenerate: false };
					localStorage.setItem('posterGeneratorData', JSON.stringify(updatedData));
					// Автоскачивание убрано по просьбе пользователя
				}
			} catch (error) {
				console.error('Ошибка при загрузке сохраненных данных:', error);
				// Очищаем поврежденные данные
				localStorage.removeItem('posterGeneratorData');
				// В случае ошибки устанавливаем значения по умолчанию
				setDates([
					{
						id: 1,
						date: '',
						isoDate: '',
						timeStart: '',
						timeEnd: ''
					}
				]);
				// Сбрасываем workDays к значению по умолчанию
				setWorkDays([
					{ name: 'Понедельник', enabled: false, timeStart: '09:00', timeEnd: '18:00' },
					{ name: 'Вторник', enabled: false, timeStart: '09:00', timeEnd: '18:00' },
					{ name: 'Среда', enabled: true, timeStart: '09:00', timeEnd: '18:00' },
					{ name: 'Четверг', enabled: false, timeStart: '09:00', timeEnd: '18:00' },
					{ name: 'Пятница', enabled: true, timeStart: '09:00', timeEnd: '18:00' },
					{ name: 'Суббота', enabled: false, timeStart: '09:00', timeEnd: '18:00' },
					{ name: 'Воскресенье', enabled: false, timeStart: '09:00', timeEnd: '18:00' }
				]);
			}
		}
		setIsLoaded(true);
	}, []);

	// Сохранение состояния при изменении данных (только после загрузки)
	useEffect(() => {
		if (!isLoaded) return;

		// Убеждаемся, что dates это массив перед сохранением
		const safeDatesForSave = Array.isArray(dates) ? dates : [];
		const dataToSave = {
			posterType,
			dates: safeDatesForSave,
			phone,
			showPhone,
			meetingType,
			meetingLocation,
			agenda,
			ukName,
			pikAddress,
			workDays
		};
		localStorage.setItem('posterGeneratorData', JSON.stringify(dataToSave));
	}, [dates, phone, showPhone, posterType, meetingType, meetingLocation, agenda, ukName, pikAddress, workDays, isLoaded]);

	// Добавить новую дату
	const addDate = () => {
		const currentDates = Array.isArray(dates) ? dates : [];
		const maxDates = posterType === 'rounds' ? 4 : 1; // Для встреч и ПИК максимум 1 дата
		if (currentDates.length >= maxDates) return;
		const newId = currentDates.length > 0 ? Math.max(...currentDates.map(d => d.id)) + 1 : 1;
		setDates(prev => {
			const prevArray = Array.isArray(prev) ? prev : [];
			return [...prevArray, {
				id: newId,
				date: '',
				isoDate: '',
				timeStart: '',
				timeEnd: ''
			}];
		});
	};

	// Удалить дату
	const removeDate = (id: number) => {
		const currentDates = Array.isArray(dates) ? dates : [];
		if (currentDates.length <= 1) return; // Минимум 1 дата
		setDates(prev => {
			const prevArray = Array.isArray(prev) ? prev : [];
			return prevArray.filter(d => d.id !== id);
		});
	};

	// Функция для распознавания и конвертации различных форматов даты
	const parseDateFromClipboard = (clipboardText: string): string | null => {
		const cleanText = clipboardText.trim();

		// Уже в ISO формате (YYYY-MM-DD)
		if (/^\d{4}-\d{2}-\d{2}$/.test(cleanText)) {
			return cleanText;
		}

		// Форматы с точками (DD.MM.YYYY, D.M.YYYY)
		const dotFormat = cleanText.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
		if (dotFormat) {
			const [, day, month, year] = dotFormat;
			return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
		}

		// Форматы с слешами (DD/MM/YYYY, MM/DD/YYYY)
		const slashFormat = cleanText.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
		if (slashFormat) {
			const [, first, second, year] = slashFormat;
			// Предполагаем DD/MM/YYYY (европейский формат)
			return `${year}-${second.padStart(2, '0')}-${first.padStart(2, '0')}`;
		}

		// Русские месяцы (DD месяц YYYY)
		const monthNames = {
			'январь': '01', 'января': '01',
			'февраль': '02', 'февраля': '02',
			'март': '03', 'марта': '03',
			'апрель': '04', 'апреля': '04',
			'май': '05', 'мая': '05',
			'июнь': '06', 'июня': '06',
			'июль': '07', 'июля': '07',
			'август': '08', 'августа': '08',
			'сентябрь': '09', 'сентября': '09',
			'октябрь': '10', 'октября': '10',
			'ноябрь': '11', 'ноября': '11',
			'декабрь': '12', 'декабря': '12'
		};

		const russianFormat = cleanText.toLowerCase().match(/^(\d{1,2})\s+(\w+)\s+(\d{4})$/);
		if (russianFormat) {
			const [, day, monthName, year] = russianFormat;
			const monthNumber = monthNames[monthName as keyof typeof monthNames];
			if (monthNumber) {
				return `${year}-${monthNumber}-${day.padStart(2, '0')}`;
			}
		}

		// Попытка использовать Date.parse для других форматов
		try {
			const parsedDate = new Date(cleanText);
			if (!isNaN(parsedDate.getTime())) {
				return parsedDate.toISOString().split('T')[0];
			}
		} catch (e) {
			// Игнорируем ошибки парсинга
		}

		return null;
	};

	// Обработчик вставки для полей даты
	const handleDatePaste = (e: React.ClipboardEvent<HTMLInputElement>, dateId: number) => {
		e.preventDefault();
		const clipboardText = e.clipboardData.getData('text');
		const parsedDate = parseDateFromClipboard(clipboardText);

		if (parsedDate) {
			handleDateChange(parsedDate, dateId);
		} else {
			// Если не удалось распознать формат, показываем подсказку
			alert('Не удалось распознать формат даты. Поддерживаются форматы:\n• DD.MM.YYYY (например, 15.03.2024)\n• DD/MM/YYYY (например, 15/03/2024)\n• DD месяца YYYY (например, 15 марта 2024)\n• YYYY-MM-DD (например, 2024-03-15)');
		}
	};

	// Обработчик быстрого выбора времени
	const handleQuickTimeSelect = (dateId: number, timeType: 'start' | 'end', value: string) => {
		const timeKey = timeType === 'start' ? 'timeStart' : 'timeEnd';
		setDates(prev => {
			const prevArray = Array.isArray(prev) ? prev : [];
			return prevArray.map(date =>
				date.id === dateId
					? { ...date, [timeKey]: value }
					: date
			);
		});
	};

	// Функция преобразования ISO даты в нужный формат
	const convertISOToDisplayDate = (isoDate: string): string => {
		if (!isoDate) return '';

		const date = new Date(isoDate);
		const months = [
			'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
			'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
		];

		const day = date.getDate();
		const month = months[date.getMonth()];

		return `${day} ${month}`;
	};

	// Обработчик изменения даты
	const handleDateChange = (value: string, dateId: number) => {
		const displayDate = convertISOToDisplayDate(value);
		setDates(prev => {
			const prevArray = Array.isArray(prev) ? prev : [];
			return prevArray.map(date =>
				date.id === dateId
					? { ...date, date: displayDate, isoDate: value }
					: date
			);
		});
	};

	// Обработчик очистки даты и времени
	const clearDateAndTime = (dateId: number) => {
		setDates(prev => {
			const prevArray = Array.isArray(prev) ? prev : [];
			return prevArray.map(date =>
				date.id === dateId
					? { ...date, date: '', isoDate: '', timeStart: '', timeEnd: '' }
					: date
			);
		});
	};

	// Обработчик изменения времени
	const handleTimeChange = (dateId: number, timeType: 'start' | 'end', value: string) => {
		const timeKey = timeType === 'start' ? 'timeStart' : 'timeEnd';
		setDates(prev => {
			const prevArray = Array.isArray(prev) ? prev : [];
			return prevArray.map(date =>
				date.id === dateId
					? { ...date, [timeKey]: value }
					: date
			);
		});
	};

	// Обработчик сброса всех полей
	const resetAllFields = () => {
		setDates([
			{
				id: 1,
				date: '',
				isoDate: '',
				timeStart: '',
				timeEnd: ''
			}
		]);
		setPhone('8 (499) 652-62-11');
		setShowPhone(true);
		setMeetingType('registration');
		setMeetingLocation('');
		setAgenda('');
		setUkName('ПИК-Комфорт Сириус');
		setPikAddress('улица Большая Очаковская,\nдом 2, подъезд 3');
		setWorkDays([
			{ name: 'Понедельник', enabled: false, timeStart: '09:00', timeEnd: '18:00' },
			{ name: 'Вторник', enabled: false, timeStart: '09:00', timeEnd: '18:00' },
			{ name: 'Среда', enabled: true, timeStart: '09:00', timeEnd: '18:00' },
			{ name: 'Четверг', enabled: false, timeStart: '09:00', timeEnd: '18:00' },
			{ name: 'Пятница', enabled: true, timeStart: '09:00', timeEnd: '18:00' },
			{ name: 'Суббота', enabled: false, timeStart: '09:00', timeEnd: '18:00' },
			{ name: 'Воскресенье', enabled: false, timeStart: '09:00', timeEnd: '18:00' }
		]);
		// Очищаем сохраненные данные
		localStorage.removeItem('posterGeneratorData');
	};

	// Функция для экспорта в PDF
	const handleExportPDF = async () => {
		const posterElement = document.querySelector('.moscow-poster-container');
		if (!posterElement) return;

		// Сохраняем элементы для восстановления
		const elementsToRestore: Array<{ element: HTMLElement, properties: string[] }> = [];

		try {
			// Находим все элементы с подчеркиванием дат и временно увеличиваем отступ
			const dateUnderlines = posterElement.querySelectorAll('.poster-date-underline');
			dateUnderlines.forEach(element => {
				const el = element as HTMLElement;
				elementsToRestore.push({ element: el, properties: ['padding-bottom'] });
				el.style.setProperty('padding-bottom', '20px', 'important');
			});

			// Находим все элементы с датами и приподнимаем их на 8px
			const dateElements = posterElement.querySelectorAll('.poster-date-container, .poster-date, .date-wrapper');
			dateElements.forEach(element => {
				const el = element as HTMLElement;
				elementsToRestore.push({ element: el, properties: ['margin-top'] });
				el.style.setProperty('margin-top', '-8px', 'important');
			});

			// Ждем применения изменений
			await new Promise(resolve => setTimeout(resolve, 100));

			const canvas = await html2canvas(posterElement as HTMLElement, {
				scale: 2,
				useCORS: true,
				allowTaint: true,
				backgroundColor: '#ffffff',
				logging: false,
				width: (posterElement as HTMLElement).offsetWidth,
				height: (posterElement as HTMLElement).offsetHeight,
				scrollX: 0,
				scrollY: 0
			});

			// Восстанавливаем стили - удаляем все inline стили, которые мы добавили
			elementsToRestore.forEach(({ element, properties }) => {
				properties.forEach(property => {
					element.style.removeProperty(property);
				});
			});

			// Создаем PDF
			const imgData = canvas.toDataURL('image/png');
			const pdf = new jsPDF({
				orientation: 'portrait',
				unit: 'mm',
				format: 'a4'
			});

			const pageWidth = 210;
			const pageHeight = 297;
			const canvasRatio = canvas.width / canvas.height;
			const pageRatio = pageWidth / pageHeight;

			let imgWidth, imgHeight;
			if (canvasRatio > pageRatio) {
				imgWidth = pageWidth - 2;
				imgHeight = imgWidth / canvasRatio;
			} else {
				imgHeight = pageHeight - 2;
				imgWidth = imgHeight * canvasRatio;
			}

			const x = (pageWidth - imgWidth) / 2;
			const y = (pageHeight - imgHeight) / 2;

			pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
			let fileName = 'плакат.pdf';
			if (posterType === 'rounds') fileName = 'плакат-обходы.pdf';
			else if (posterType === 'meetings') fileName = 'плакат-встречи.pdf';
			else if (posterType === 'pik') fileName = 'плакат-ПИК.pdf';
			pdf.save(fileName);
		} catch (error) {
			console.error('Ошибка при создании PDF:', error);
			alert('Произошла ошибка при создании PDF файла');

			// В случае ошибки тоже восстанавливаем стили
			elementsToRestore.forEach(({ element, properties }) => {
				properties.forEach(property => {
					element.style.removeProperty(property);
				});
			});
		}
	};

	// Функция для экспорта в PNG
	const handleExportPNG = async () => {
		const element = document.getElementById('moscow-poster');
		if (!element) {
			alert('Элемент плаката не найден!');
			return;
		}

		const posterContainer = element.querySelector('.moscow-poster-container');
		if (!posterContainer) return;

		// Сохраняем элементы для восстановления
		const elementsToRestore: Array<{ element: HTMLElement, properties: string[] }> = [];

		try {
			// Находим все элементы с подчеркиванием дат и временно увеличиваем отступ
			const dateUnderlines = posterContainer.querySelectorAll('.poster-date-underline');
			dateUnderlines.forEach(element => {
				const el = element as HTMLElement;
				elementsToRestore.push({ element: el, properties: ['padding-bottom'] });
				el.style.setProperty('padding-bottom', '15px', 'important'); // Меньше чем для PDF
			});

			// Ждем применения изменений
			await new Promise(resolve => setTimeout(resolve, 100));

			const canvas = await html2canvas(element, {
				scale: 2,
				useCORS: true,
				allowTaint: true,
				backgroundColor: '#ffffff',
				width: element.offsetWidth,
				height: element.offsetHeight,
				logging: false,
				scrollX: 0,
				scrollY: 0
			});

			// Восстанавливаем стили - удаляем все inline стили, которые мы добавили
			elementsToRestore.forEach(({ element, properties }) => {
				properties.forEach(property => {
					element.style.removeProperty(property);
				});
			});

			// Скачиваем файл
			const link = document.createElement('a');
			let fileName = 'плакат.png';
			if (posterType === 'rounds') fileName = 'плакат-обходы.png';
			else if (posterType === 'meetings') fileName = 'плакат-встречи.png';
			else if (posterType === 'pik') fileName = 'плакат-ПИК.png';
			link.download = fileName;
			link.href = canvas.toDataURL('image/png');
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		} catch (error) {
			console.error('Ошибка при экспорте PNG:', error);
			alert('Ошибка при создании PNG: ' + (error instanceof Error ? error.message : String(error)));

			// В случае ошибки тоже восстанавливаем стили
			elementsToRestore.forEach(({ element, properties }) => {
				properties.forEach(property => {
					element.style.removeProperty(property);
				});
			});
		}
	};

	const getDayName = (index: number): string => {
		if (posterType === 'meetings') {
			return 'Дата встречи';
		}
		if (posterType === 'pik') {
			return 'Дата (не используется для ПИК)';
		}
		const dayNames = ['Первый день', 'Второй день', 'Третий день', 'Четвертый день'];
		return dayNames[index] || `${index + 1}-й день`;
	};

	// Убеждаемся, что dates всегда массив
	const safeDates = Array.isArray(dates) ? dates : [];

	return (
		<div className="space-y-6">
			<Card className="glass-card card-hover shadow-lg">
				<CardHeader>
					<div className="flex items-center gap-2">
						<FileText className="h-5 w-5 text-primary" />
						<CardTitle>Генератор плакатов</CardTitle>
					</div>
					<CardDescription>Создание плакатов для собраний собственников</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex gap-8">
						{/* Форма */}
						<div className="w-1/3">
							<Card>
								<CardHeader>
									<div className="flex items-center justify-between">
										<CardTitle>Параметры объявления</CardTitle>
										<Button
											variant="outline"
											size="sm"
											onClick={resetAllFields}
											className="text-gray-600 hover:text-gray-800"
										>
											<RotateCcw className="w-4 h-4" />
										</Button>
									</div>
								</CardHeader>
								<CardContent className="space-y-6">
									{/* Выбор типа плаката */}
									<div>
										<Label>Тип плаката</Label>
										<Select value={posterType} onValueChange={(value: PosterType) => handlePosterTypeChange(value)}>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="rounds">Для обходов</SelectItem>
												<SelectItem value="meetings">Для встреч</SelectItem>
												<SelectItem value="pik">Для ПИКа</SelectItem>
											</SelectContent>
										</Select>
									</div>

									{/* Дополнительные поля для встреч */}
									{posterType === 'meetings' && (
										<div className="space-y-4">
											<div>
												<Label>Тип встречи</Label>
												<Select value={meetingType} onValueChange={(value: 'registration' | 'oss') => setMeetingType(value)}>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="registration">По вопросу регистрации на платформе</SelectItem>
														<SelectItem value="oss">По вопросу проведения ОСС</SelectItem>
													</SelectContent>
												</Select>
											</div>

											{meetingType === 'oss' && (
												<div>
													<Label htmlFor="agenda">Повестка собрания</Label>
													<Textarea
														id="agenda"
														value={agenda}
														onChange={(e) => setAgenda(e.target.value)}
														placeholder="Например: установка умного видеодомофона"
														rows={3}
													/>
												</div>
											)}

											<div>
												<Label htmlFor="meetingLocation">Место встречи</Label>
												<Input
													id="meetingLocation"
													value={meetingLocation}
													onChange={(e) => setMeetingLocation(e.target.value)}
													placeholder="Например: Кронштадтский бульвар, дом 24, корпус 3"
												/>
											</div>
										</div>
									)}

									{/* Дополнительные поля для ПИК */}
									{posterType === 'pik' && (
										<div className="space-y-4">
											<div>
												<Label htmlFor="ukName">Название организации</Label>
												<Input
													id="ukName"
													value={ukName}
													onChange={(e) => setUkName(e.target.value)}
													placeholder="ПИК-Комфорт Сириус"
												/>
											</div>

											<div>
												<Label htmlFor="pikAddress">Адрес</Label>
												<Textarea
													id="pikAddress"
													value={pikAddress}
													onChange={(e) => setPikAddress(e.target.value)}
													placeholder="улица Большая Очаковская,&#10;дом 2, подъезд 3"
													rows={2}
												/>
											</div>

											<div>
												<Label>График работы</Label>
												<div className="space-y-3 mt-2">
													{Array.isArray(workDays) && workDays.map((day, index) => (
														<div key={day.name} className="flex items-center gap-3">
															<Checkbox
																id={`day-${index}`}
																checked={day.enabled}
																onCheckedChange={(checked) => {
																	const newWorkDays = [...workDays];
																	newWorkDays[index].enabled = checked as boolean;
																	setWorkDays(newWorkDays);
																}}
															/>
															<Label htmlFor={`day-${index}`} className="w-24 text-sm">
																{day.name}
															</Label>
															{day.enabled && (
																<div className="flex gap-2">
																	<Input
																		type="time"
																		value={day.timeStart}
																		onChange={(e) => {
																			const newWorkDays = [...workDays];
																			newWorkDays[index].timeStart = e.target.value;
																			setWorkDays(newWorkDays);
																		}}
																		className="w-24 text-xs"
																	/>
																	<span className="text-xs self-center">-</span>
																	<Input
																		type="time"
																		value={day.timeEnd}
																		onChange={(e) => {
																			const newWorkDays = [...workDays];
																			newWorkDays[index].timeEnd = e.target.value;
																			setWorkDays(newWorkDays);
																		}}
																		className="w-24 text-xs"
																	/>
																</div>
															)}
														</div>
													))}
												</div>
											</div>
										</div>
									)}

									{/* Динамический список дат - скрываем для ПИК */}
									{posterType !== 'pik' && safeDates.map((dateItem, index) => (
										<div key={dateItem.id} className="space-y-4 border-b pb-4 last:border-b-0">
											<div className="flex items-center justify-between">
												<h3 className="font-semibold">{getDayName(index)}</h3>
												{safeDates.length > 1 && (
													<Button
														variant="outline"
														size="sm"
														onClick={() => removeDate(dateItem.id)}
														className="text-red-600 hover:text-red-700"
													>
														<X className="w-4 h-4" />
													</Button>
												)}
											</div>
											<div>
												<Label htmlFor={`date${dateItem.id}`}>Дата</Label>
												<div className="flex gap-2">
													<Input
														id={`date${dateItem.id}`}
														type="date"
														value={dateItem.isoDate || ''}
														onChange={(e) => handleDateChange(e.target.value, dateItem.id)}
														onPaste={(e) => handleDatePaste(e, dateItem.id)}
														className="flex-1"
													/>
													{(dateItem.date || dateItem.timeStart || dateItem.timeEnd) && (
														<Button
															variant="outline"
															size="sm"
															onClick={() => clearDateAndTime(dateItem.id)}
															className="w-10 h-10 p-0"
														>
															<X className="w-4 h-4" />
														</Button>
													)}
												</div>
											</div>
											<div className="grid grid-cols-2 gap-4">
												<div>
													<Label htmlFor={`time${dateItem.id}Start`}>Время начала</Label>
													<div className="flex gap-2">
														<Input
															id={`time${dateItem.id}Start`}
															type="time"
															value={dateItem.timeStart || ''}
															onChange={(e) => handleTimeChange(dateItem.id, 'start', e.target.value)}
															className="flex-1"
														/>
														<Select onValueChange={(value) => handleQuickTimeSelect(dateItem.id, 'start', value)}>
															<SelectTrigger className="w-20">
																<Clock className="w-4 h-4" />
															</SelectTrigger>
															<SelectContent>
																<SelectItem value="15:00">15:00</SelectItem>
																<SelectItem value="15:30">15:30</SelectItem>
																<SelectItem value="16:00">16:00</SelectItem>
																<SelectItem value="16:30">16:30</SelectItem>
																<SelectItem value="17:00">17:00</SelectItem>
																<SelectItem value="17:30">17:30</SelectItem>
																<SelectItem value="18:00">18:00</SelectItem>
																<SelectItem value="18:30">18:30</SelectItem>
															</SelectContent>
														</Select>
													</div>
												</div>
												<div>
													<Label htmlFor={`time${dateItem.id}End`}>Время окончания</Label>
													<div className="flex gap-2">
														<Input
															id={`time${dateItem.id}End`}
															type="time"
															value={dateItem.timeEnd || ''}
															onChange={(e) => handleTimeChange(dateItem.id, 'end', e.target.value)}
															className="flex-1"
														/>
														<Select onValueChange={(value) => handleQuickTimeSelect(dateItem.id, 'end', value)}>
															<SelectTrigger className="w-20">
																<Clock className="w-4 h-4" />
															</SelectTrigger>
															<SelectContent>
																<SelectItem value="18:00">18:00</SelectItem>
																<SelectItem value="18:30">18:30</SelectItem>
																<SelectItem value="19:00">19:00</SelectItem>
																<SelectItem value="19:30">19:30</SelectItem>
																<SelectItem value="20:00">20:00</SelectItem>
																<SelectItem value="20:30">20:30</SelectItem>
															</SelectContent>
														</Select>
													</div>
												</div>
											</div>
										</div>
									))}

									{/* Кнопка добавить дату - скрываем для ПИК */}
									{posterType !== 'pik' && safeDates.length < (posterType === 'rounds' ? 4 : 1) && (
										<Button
											onClick={addDate}
											variant="outline"
											className="w-full"
										>
											<Plus className="w-4 h-4 mr-2" />
											Добавить дату
										</Button>
									)}

									{/* Предупреждение о лимите - скрываем для ПИК */}
									{posterType !== 'pik' && safeDates.length >= (posterType === 'rounds' ? 4 : 1) && (
										<div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
											<strong>Внимание:</strong> {posterType === 'rounds' ? 'Максимум 4 даты. Больше не поместится на плакате.' : 'Для встреч используется только одна дата.'}
										</div>
									)}

									{/* Телефон - скрываем для ПИК */}
									{posterType !== 'pik' && (
										<div className="space-y-4">
											<h3 className="font-semibold">Контактная информация</h3>
											<div className="flex items-center space-x-2">
												<Checkbox
													id="showPhone"
													checked={showPhone}
													onCheckedChange={(checked) => setShowPhone(checked as boolean)}
												/>
												<Label htmlFor="showPhone">Показывать телефон</Label>
											</div>
											{showPhone && (
												<div>
													<Label htmlFor="phone">Телефон</Label>
													<Input
														id="phone"
														type="tel"
														value={phone || ''}
														onChange={(e) => setPhone(e.target.value)}
														placeholder="8 (499) 652-62-11"
													/>
												</div>
											)}
										</div>
									)}

									{/* Кнопки экспорта */}
									<div className="space-y-4">
										<h3 className="font-semibold">Экспорт</h3>
										<div className="grid grid-cols-2 gap-3">
											<Button onClick={handleExportPNG} className="gradient-bg border-0">
												<Download className="w-4 h-4 mr-2" />
												PNG
											</Button>
											<Button onClick={handleExportPDF} variant="outline">
												<Download className="w-4 h-4 mr-2" />
												PDF
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Предпросмотр */}
						<div className="w-2/3">
							<Card>
								<CardHeader>
									<CardTitle>Предпросмотр плаката</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="flex justify-center">
										{/* Принудительная светлая тема для плаката */}
										<div className="light">
											<div id="moscow-poster" className="moscow-poster-container">
												{posterType === 'rounds' ? (
													<MoscowPoster dates={safeDates} phone={phone} showPhone={showPhone} />
												) : posterType === 'meetings' ? (
													<MeetingPoster
														dates={safeDates}
														phone={phone}
														showPhone={showPhone}
														meetingType={meetingType}
														meetingLocation={meetingLocation}
														agenda={agenda}
													/>
												) : (
													<PikPoster
														ukName={ukName}
														address={pikAddress}
														workDays={workDays}
													/>
												)}
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}