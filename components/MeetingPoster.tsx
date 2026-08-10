import React from "react";
import Image from "next/image";

interface DateInfo {
	id: number;
	date: string;
	isoDate: string;
	timeStart: string;
	timeEnd: string;
}

interface MeetingPosterProps {
	dates: DateInfo[];
	phone: string;
	showPhone: boolean;
	meetingType: 'registration' | 'oss';
	meetingLocation: string;
	agenda?: string;
}

export default function MeetingPoster({
	dates,
	phone,
	showPhone,
	meetingType,
	meetingLocation,
	agenda
}: MeetingPosterProps) {
	// Фильтруем только заполненные даты
	const validDates = dates.filter(date => date.date && date.timeStart && date.timeEnd);

	// Получаем текст в зависимости от типа встречи
	const getMeetingPurpose = () => {
		if (meetingType === 'registration') {
			return "регистрации на платформе Правительства Москвы «Электронный дом»";
		} else {
			return "проведения общего собрания собственников (ОСС) на платформе Правительства Москвы «Электронный дом»";
		}
	};

	// Генерируем контент для дат (дата и время в одну строку)
	const generateDateContent = () => {
		if (validDates.length === 0) return null;

		// Для встреч обычно используется одна дата
		const dateItem = validDates[0];

		return (
			<div
				className="absolute flex flex-col items-center"
				style={{
					width: '450px',
					left: '72.65px',
					top: '240px'
				}}
			>
				<div className="flex justify-center">
					<div className={`font-bold whitespace-nowrap relative poster-date-underline ${meetingType === 'registration' ? 'text-[32px] leading-[38px]' : 'text-[29px] leading-[35px]'
						}`}>
						{dateItem.date.toLowerCase()} в {dateItem.timeStart}
					</div>
				</div>
			</div>
		);
	};

	// Определяем позицию основного текста
	const getMainTextPosition = () => {
		return '320px';
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
					className="absolute text-center"
					style={{
						top: getMainTextPosition(),
						left: '72.65px',
						width: '450px'
					}}
				>
					<p
						className={meetingType === 'registration' ? 'text-[28px]' : 'text-[25px]'}
						style={{
							lineHeight: meetingType === 'registration' ? '34px' : '31px',
							marginBottom: '20px'
						}}
					>
						Состоится <span className="font-bold">встреча</span> по вопросу
						<br />
						{getMeetingPurpose().includes('регистрации') ? (
							<>регистрации на платформе Правительства Москвы <span className="font-bold">«Электронный дом»</span></>
						) : (
							<>проведения общего собрания собственников (ОСС) на платформе Правительства Москвы <span className="font-bold">«Электронный дом»</span></>
						)}
					</p>
				</div>

				{/* Повестка собрания (только для ОСС) */}
				{meetingType === 'oss' && agenda && (
					<div
						className="absolute text-center"
						style={{
							top: '500px',
							left: '72.65px',
							width: '450px'
						}}
					>
						<p
							className="text-[21px]"
							style={{
								lineHeight: '27px',
								marginBottom: '20px'
							}}
						>
							<span className="font-bold">На повестке собрания:</span>
							<br />
							{agenda}
						</p>
					</div>
				)}

				{/* Место встречи */}
				<div
					className="absolute text-center"
					style={{
						top: meetingType === 'oss' && agenda ? '590px' : '520px',
						left: '72.65px',
						width: '450px'
					}}
				>
					<p
						className={meetingType === 'registration' ? 'text-[24px]' : 'text-[21px]'}
						style={{
							lineHeight: meetingType === 'registration' ? '30px' : '27px',
							marginBottom: '20px'
						}}
					>
						<span className="font-bold">Место встречи:</span>
						<br />
						{meetingLocation}
					</p>
				</div>

				{/* Дополнительная информация */}
				<div
					className="absolute text-center"
					style={{
						top: meetingType === 'oss' && agenda ? '670px' : '645px',
						left: '72.65px',
						width: '450px'
					}}
				>
					<p
						className={meetingType === 'registration' ? 'text-[22px]' : 'text-[19px]'}
						style={{
							lineHeight: meetingType === 'registration' ? '28px' : '25px',
							marginBottom: '20px'
						}}
					>
						На встрече вы сможете задать свои вопросы представителям платформы
					</p>
				</div>

				{/* Телефон - показываем только если включен чекбокс */}
				{showPhone && (
					<div className="absolute text-center" style={{
						top: meetingType === 'oss' && agenda ? '720px' : '710px',
						left: '72.65px',
						width: '450px'
					}}>
						<p className={meetingType === 'oss' && agenda ? "text-[18px] leading-[24px]" :
							meetingType === 'registration' ? "text-[21px] leading-[27px]" : "text-[21px] leading-[27px]"}>
							{meetingType === 'oss' && agenda ? (
								<>
									По всем вопросам обращайтесь по телефону:
									<br />
									<span className="font-bold">{phone}</span>
								</>
							) : (
								<>
									По всем вопросам обращайтесь по телефону:{" "}
									<span className="font-bold">{phone}</span>
								</>
							)}
						</p>
					</div>
				)}

				{/* Информация о ГКУ НТУ - размер шрифта остается без изменений */}
				<div className="absolute text-center" style={{
					top: '778px',
					left: '72.65px',
					width: '450px'
				}}>
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