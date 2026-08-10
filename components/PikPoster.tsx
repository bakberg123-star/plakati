import React from "react";
import Image from "next/image";

interface WorkDay {
	name: string;
	enabled: boolean;
	timeStart: string;
	timeEnd: string;
}

interface PikPosterProps {
	ukName: string;
	address: string;
	workDays: WorkDay[];
}

export default function PikPoster({ ukName, address, workDays }: PikPosterProps) {
	// Функция для правильного отображения адреса с переносами строк
	const formatAddress = (addr: string) => {
		return addr.split('\n').map((line, index) => (
			<React.Fragment key={index}>
				{line}
				{index < addr.split('\n').length - 1 && <br />}
			</React.Fragment>
		));
	};

	// Функция для форматирования графика работы
	const formatWorkSchedule = () => {
		if (!Array.isArray(workDays)) {
			return 'График работы не указан';
		}

		const enabledDays = workDays.filter(day => day.enabled && day.timeStart && day.timeEnd);

		if (enabledDays.length === 0) {
			return 'График работы не указан';
		}

		// Группируем дни по времени
		const timeGroups: { [key: string]: string[] } = {};

		enabledDays.forEach(day => {
			const timeKey = `${day.timeStart}-${day.timeEnd}`;
			if (!timeGroups[timeKey]) {
				timeGroups[timeKey] = [];
			}
			timeGroups[timeKey].push(day.name.toLowerCase());
		});

		// Формируем вывод
		const groups = Object.entries(timeGroups);

		return groups.map(([timeKey, days], groupIndex) => {
			const [startTime, endTime] = timeKey.split('-');
			const daysList = days.join(', ');

			return (
				<React.Fragment key={timeKey}>
					{daysList} - с {startTime} до {endTime}
					{groupIndex < groups.length - 1 && <br />}
				</React.Fragment>
			);
		});
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

				{/* Основной текст */}
				<div className="absolute top-[220px] left-[72.65px] w-[450px] text-center">
					<p className="text-[24px] text-black leading-[30px]">
						Выдача и прием<br />
						бумажных решений для<br />
						<span className="font-bold">общего собрания собственников</span><br />
						осуществляется<br />
						<span className="font-bold">сотрудниками платформы<br />
							«Электронный дом»</span> в офисе<br />
						<span className="font-bold">«{ukName || 'ПИК-Комфорт Сириус'}»</span><br />
						по адресу:
					</p>
				</div>

				{/* Адрес */}
				<div className="absolute top-[500px] left-[72.65px] w-[450px] text-center">
					<p className="text-[32px] font-bold text-black leading-[38px]">
						{formatAddress(address || 'улица Большая Очаковская,\nдом 2, подъезд 3')}
					</p>
				</div>

				{/* График работы */}
				<div className="absolute top-[630px] left-[72.65px] w-[450px] text-center">
					<p className="text-[22px] text-black leading-[28px]">
						<span className="font-bold">График</span> работы сотрудников:<br />
						{formatWorkSchedule()}
					</p>
				</div>

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
