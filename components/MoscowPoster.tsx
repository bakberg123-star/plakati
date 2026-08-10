import React from "react";
import Image from "next/image";

interface DateInfo {
	id: number;
	date: string;
	isoDate: string;
	timeStart: string;
	timeEnd: string;
}

interface TextContentProps {
	dates: DateInfo[];
	phone: string;
	showPhone: boolean;
}

export default function MoscowPoster({ dates, phone, showPhone }: TextContentProps) {
	// Фильтруем только заполненные даты
	const validDates = dates.filter(date => date.date && date.timeStart && date.timeEnd);

	// Проверяем, идут ли даты подряд
	const areDatesConsecutive = (date1: string, date2: string) => {
		const [day1, month1] = date1.toLowerCase().split(' ');
		const [day2, month2] = date2.toLowerCase().split(' ');
		if (month1 !== month2) return false;
		return parseInt(day2) - parseInt(day1) === 1;
	};

	// Проверяем, одинаковое ли время у всех дат
	const isSameTime = () => {
		if (validDates.length <= 1) return false;
		const firstTime = validDates[0];
		return validDates.every(date =>
			date.timeStart === firstTime.timeStart &&
			date.timeEnd === firstTime.timeEnd
		);
	};

	// Получаем правильный текст в зависимости от количества дат
	const getEventText = () => {
		if (validDates.length > 1) {
			return "состоятся поквартирные обходы";
		} else {
			return "состоится поквартирный обход";
		}
	};

	// Проверяем, одинаковый ли месяц у двух дат
	const isSameMonth = (date1: string, date2: string) => {
		const [, month1] = date1.toLowerCase().split(' ');
		const [, month2] = date2.toLowerCase().split(' ');
		return month1 === month2;
	};

	// Форматируем даты для одного месяца
	const formatSameMonthDates = (date1: string, date2: string) => {
		const [day1, month1] = date1.toLowerCase().split(' ');
		const [day2] = date2.toLowerCase().split(' ');

		if (areDatesConsecutive(date1, date2)) {
			return `${day1}-${day2} ${month1}`;
		} else {
			return `${day1} и ${day2} ${month1}`;
		}
	};

	// Генерируем контент для дат
	const generateDateContent = () => {
		if (validDates.length === 0) return null;

		// Если больше 2 дат - показываем каждую дату с новой строки
		if (validDates.length > 2) {
			// Адаптивные настройки в зависимости от количества дат
			let spacing, fontSize, lineHeight, topPosition;

			if (validDates.length === 3) {
				spacing = 'mb-3';
				fontSize = '28px';
				lineHeight = '32px';
				topPosition = '220px';
			} else { // 4 даты
				spacing = 'mb-1';
				fontSize = '26px';
				lineHeight = '30px';
				topPosition = '190px';
			}

			return (
				<div
					className={`absolute flex flex-col items-center justify-start ${validDates.length === 4 ? 'four-dates-container' : ''}`}
					style={{
						width: '500px',
						left: '47px',
						top: topPosition
					}}
				>
					{validDates.map((dateItem, index) => (
						<div key={dateItem.id} className={`flex justify-center ${spacing}`}>
							<div
								className="whitespace-nowrap relative poster-date-underline"
								style={{
									fontSize: fontSize,
									lineHeight: lineHeight
								}}
							>
								<span className="font-bold">{dateItem.date.toLowerCase()}</span>
								<span className="font-normal"> с {dateItem.timeStart} до {dateItem.timeEnd}</span>
							</div>
						</div>
					))}
				</div>
			);
		}

		// Если только одна дата
		if (validDates.length === 1) {
			const dateItem = validDates[0];
			return (
				<div
					className="absolute flex flex-col items-center"
					style={{
						width: '400px',
						left: '97px',
						top: '240px'
					}}
				>
					<div className="flex justify-center">
						<div className="font-bold text-[36px] leading-[44px] whitespace-nowrap relative poster-date-underline">
							{dateItem.date.toLowerCase()}
						</div>
					</div>
					<div
						className="flex justify-center text-[34px] leading-[41px] whitespace-nowrap"
						style={{
							marginTop: '20px'
						}}
					>
						с {dateItem.timeStart} до {dateItem.timeEnd}
					</div>
				</div>
			);
		}

		// Если две даты и время одинаковое
		if (validDates.length === 2 && isSameTime()) {
			const [first, second] = validDates;
			const timeStr = `с ${first.timeStart} до ${first.timeEnd}`;

			// Проверяем, одинаковый ли месяц
			const sameMonth = isSameMonth(first.date, second.date);
			let displayText;

			if (sameMonth) {
				// Если месяц одинаковый, используем оптимизированный формат
				displayText = formatSameMonthDates(first.date, second.date);
			} else {
				// Если месяцы разные, отображаем как раньше
				if (areDatesConsecutive(first.date, second.date)) {
					displayText = `${first.date.toLowerCase()}-${second.date.toLowerCase()}`;
				} else {
					displayText = `${first.date.toLowerCase()} и ${second.date.toLowerCase()}`;
				}
			}

			return (
				<div
					className="absolute flex flex-col items-center"
					style={{
						width: '400px',
						left: '97px',
						top: '240px'
					}}
				>
					<div className="flex justify-center">
						<div className="font-bold text-[36px] leading-[44px] whitespace-nowrap relative poster-date-underline">
							{displayText}
						</div>
					</div>
					<div
						className="flex justify-center text-[34px] leading-[41px] whitespace-nowrap"
						style={{
							marginTop: '20px'
						}}
					>
						{timeStr}
					</div>
				</div>
			);
		}

		// Если две даты с разным временем
		if (validDates.length === 2) {
			const [first, second] = validDates;

			return (
				<>
					{/* Контейнер для центрирования */}
					<div
						className="absolute"
						style={{
							width: '350px',
							left: '122px',
							top: '220px'
						}}
					>
						{/* Первая дата */}
						<div className="flex justify-center">
							<div
								className="font-bold text-[36px] leading-[44px] relative"
								style={{
									height: '26px',
								}}
							>
								<div className="whitespace-nowrap relative poster-date-underline">
									{first.date}
								</div>
							</div>
						</div>

						{/* Первое время */}
						<div
							className="flex justify-center text-[34px] leading-[41px]"
							style={{
								height: '25px',
								marginTop: '25px'
							}}
						>
							с {first.timeStart} до {first.timeEnd}
						</div>

						{/* Вторая дата */}
						<div
							className="flex justify-center"
							style={{
								marginTop: '20px'
							}}
						>
							<div
								className="font-bold text-[36px] leading-[44px] relative"
								style={{
									height: '26px',
								}}
							>
								<div className="whitespace-nowrap relative poster-date-underline">
									{second.date}
								</div>
							</div>
						</div>

						{/* Второе время */}
						<div
							className="flex justify-center text-[34px] leading-[41px]"
							style={{
								height: '25px',
								marginTop: '25px'
							}}
						>
							с {second.timeStart} до {second.timeEnd}
						</div>
					</div>
				</>
			);
		}

		return null;
	};

	// Определяем позицию основного текста в зависимости от количества дат
	const getMainTextPosition = () => {
		if (validDates.length > 2) {
			// Адаптивное позиционирование в зависимости от количества дат
			if (validDates.length === 3) {
				return '420px';
			} else if (validDates.length === 4) {
				return '430px';
			} else if (validDates.length === 5) {
				return '440px';
			} else { // 6 дат
				return '450px';
			}
		} else if (validDates.length === 1 || (validDates.length === 2 && isSameTime())) {
			return '380px';
		} else {
			return '420px';
		}
	};

	return (
		<div className="moscow-poster-container relative w-[595.3px] h-[841.89px]">
			<div className="absolute inset-0">
				<Image
					src="/images/header-reference.png"
					alt="Шаблон объявления"
					fill
					priority
					style={{ objectFit: 'contain' }}
				/>

				{generateDateContent()}

				{/* Основной текст */}
				<div
					className="absolute w-full text-center"
					style={{
						top: getMainTextPosition()
					}}
				>
					<p
						className="text-[32px]"
						style={{
							lineHeight: validDates.length > 2 ? (validDates.length >= 5 ? '36px' : '38px') : '39px',
							marginBottom: validDates.length > 4 ? '10px' : '20px'
						}}
					>
						{getEventText().charAt(0).toUpperCase() + getEventText().slice(1)}
						<br />
						сотрудниками платформы
						<br />
						Правительства Москвы
						<br />
						<span className="font-bold">«Электронный дом»</span>
						<br />
						с целью <span className="font-bold">сбора бюллетеней</span> в
						<br />
						рамках голосования на
						<br />
						<span className="font-bold">общем собрании собственников</span>
					</p>
				</div>

				{/* Телефон - показываем только если включен чекбокс */}
				{showPhone && (
					<div className="absolute w-[450px] left-[72.65px] top-[710px] text-center">
						<p className="text-[22px] leading-[27px]">
							По всем вопросам обращайтесь по телефону:{" "}
							<span className="font-bold">{phone}</span>
						</p>
					</div>
				)}

				{/* Информация о ГКУ НТУ */}
				<div className="absolute w-[450px] left-[72.65px] top-[778px] text-center">
					<p className="text-[8px] leading-[10px] text-gray-600">
						ГКУ «Новые технологии управления», ИНН 7701765530, Тел.: 8-499-652-62-11, E-mail: help@ed.mos.ru
						<br />
						ГКУ НТУ является координатором проекта «Электронный дом» в соответствии с постановлением Правительства Москвы от 27.12.2022 №3036-ПП
					</p>
				</div>
			</div>
		</div>
	);
} 