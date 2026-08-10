"use client"

import type React from "react"
import type { AddressItem } from "@/components/chat-message-generator"

import { useState, useContext, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClipboardCopy, FileDown, FileText, Printer, Calendar, Clock, MessageSquarePlus, Sparkles, Plus, Minus, Table, Image } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { scriptTemplates, smartIntercomInfo } from "@/lib/script-templates"
import { formatDate, parseCustomDate, parseCustomTime } from "@/lib/utils"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { ChatMessageContext } from "@/lib/chat-message-context"
import { Document, Packer, Paragraph, TextRun } from "docx"
import { getOfficesList } from "@/lib/script-templates"

// Список округов Москвы
const DISTRICTS = ["САО", "СВАО", "ВАО", "ЮВАО", "ЮАО", "ЮЗАО", "ЗАО", "СЗАО", "ЦАО", "ТиНАО", "ЗелАО"]

export default function ScriptGenerator() {
	const { toast } = useToast()
	const { addAddressToChat } = useContext(ChatMessageContext)
	const [scriptType, setScriptType] = useState("ego-rounds")
	const [formData, setFormData] = useState({
		district: "",
		address: "",
		topic: "",
		completionDate: "", // Новое поле - дата завершения ОСС
		completionDateText: "",
		ossNumber: "", // Новое поле - номер ОСС
		electronicDate: "",
		electronicDateText: "",
		electronicTime: "09:00",
		electronicTimeText: "09:00",
		paperDate: "",
		paperDateText: "",
		paperTime: "09:00",
		paperTimeText: "09:00",
		administrator: "",
		adminAddress: "",
	})

	// Separate state for rounds as an array
	const [rounds, setRounds] = useState([
		{
			id: 1,
			startDate: "",
			startDateText: "",
			startTime: "18:30",
			startTimeText: "18:30",
			endTime: "20:30",
			endTimeText: "20:30",
		},
		{
			id: 2,
			startDate: "",
			startDateText: "",
			startTime: "18:30",
			startTimeText: "18:30",
			endTime: "20:30",
			endTimeText: "20:30",
		},
	])
	const [generatedScript, setGeneratedScript] = useState("")
	const [editableScript, setEditableScript] = useState("")
	const [showGoogleDocDialog, setShowGoogleDocDialog] = useState(false)
	const [useManualInput, setUseManualInput] = useState(false)
	const [includeSmartIntercomInfo, setIncludeSmartIntercomInfo] = useState(false)
	const [isIndividual, setIsIndividual] = useState(false)
	const [fileName, setFileName] = useState("")
	const [isLoaded, setIsLoaded] = useState(false)

	// Загрузка данных из localStorage при монтировании компонента
	useEffect(() => {
		const savedData = localStorage.getItem("scriptGeneratorData")
		if (savedData) {
			try {
				const parsedData = JSON.parse(savedData)
				setFormData(parsedData.formData || formData)
				setRounds(parsedData.rounds || rounds)
				setScriptType(parsedData.scriptType || "ego-rounds")
				setUseManualInput(parsedData.useManualInput || false)
				setIncludeSmartIntercomInfo(parsedData.includeSmartIntercomInfo || false)
				setIsIndividual(parsedData.isIndividual || false)
				setGeneratedScript(parsedData.generatedScript || "")
				setEditableScript(parsedData.editableScript || "")
				setFileName(parsedData.fileName || "")
			} catch (error) {
				console.error("Ошибка при загрузке данных из localStorage:", error)
			}
		}
		setIsLoaded(true)
	}, [])

	// Сохранение данных в localStorage при изменении (только после загрузки)
	useEffect(() => {
		if (!isLoaded) return

		const dataToSave = {
			formData,
			rounds,
			scriptType,
			useManualInput,
			includeSmartIntercomInfo,
			isIndividual,
			generatedScript,
			editableScript,
			fileName,
		}
		localStorage.setItem("scriptGeneratorData", JSON.stringify(dataToSave))
	}, [formData, rounds, scriptType, useManualInput, includeSmartIntercomInfo, isIndividual, generatedScript, editableScript, fileName, isLoaded])

	// Эффект для автоматического обновления дат от даты завершения ОСС (только в режиме календаря)
	useEffect(() => {
		if (formData.completionDate && !useManualInput) {
			// Дата электронного голосования = дата завершения ОСС
			const electronicDate = formData.completionDate

			// Дата бумажного голосования = дата завершения ОСС - 2 дня
			const completionDateObj = new Date(formData.completionDate)
			completionDateObj.setDate(completionDateObj.getDate() - 2)
			const paperDate = completionDateObj.toISOString().split("T")[0]

			// Обновляем обе даты
			setFormData((prev) => ({
				...prev,
				electronicDate: electronicDate,
				electronicDateText: formatDate(electronicDate),
				paperDate: paperDate,
				paperDateText: formatDate(paperDate),
			}))
		}
	}, [formData.completionDate, useManualInput])

	// Добавить функцию для генерации имени файла после функции handleScriptEdit
	const generateFileName = () => {
		if (!formData.address) return "Скрипт для обзвона"

		let scriptTypeName = ""
		switch (scriptType) {
			case "ego-rounds":
				scriptTypeName = "ЕГО с обходами"
				break
			case "ego-no-rounds":
				scriptTypeName = "ЕГО без обходов"
				break
			case "not-ego-no-rounds":
				scriptTypeName = "не ЕГО без обходов"
				break
			case "not-ego-with-rounds":
				scriptTypeName = "не ЕГО с обходами"
				break
			default:
				scriptTypeName = scriptType
		}

		return `Скрипт для обзвона_${formData.address}_${scriptTypeName}`
	}

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target
		setFormData((prev) => ({ ...prev, [name]: value }))

		// Sync date/time picker values with text inputs when in picker mode
		if (!useManualInput) {
			if (name.endsWith("Date")) {
				const textFieldName = `${name}Text`
				if (value) {
					const formattedDate = formatDate(value)
					setFormData((prev) => ({ ...prev, [textFieldName]: formattedDate }))
				}
			} else if (name.endsWith("Time")) {
				const textFieldName = `${name}Text`
				setFormData((prev) => ({ ...prev, [textFieldName]: value }))
			}
		}
	}

	const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target
		setFormData((prev) => ({ ...prev, [name]: value }))

		// Try to sync text inputs with date/time pickers
		if (useManualInput) {
			if (name.endsWith("DateText")) {
				const pickerName = name.replace("Text", "")
				try {
					const dateValue = parseCustomDate(value)
					if (dateValue) {
						const isoDate = dateValue.toISOString().split("T")[0]
						setFormData((prev) => ({ ...prev, [pickerName]: isoDate }))
					}
				} catch (error) {
					// Invalid date format, don't update the picker
				}
			} else if (name.endsWith("TimeText")) {
				const pickerName = name.replace("Text", "")
				try {
					const timeValue = parseCustomTime(value)
					if (timeValue) {
						setFormData((prev) => ({ ...prev, [pickerName]: timeValue }))
					}
				} catch (error) {
					// Invalid time format, don't update the picker
				}
			}
		}
	}

	const handleSelectChange = (value: string) => {
		setScriptType(value)
		// Сбрасываем чекбокс "Физ.лицо" если выбран тип "ЕГО"
		if (value === "ego-rounds" || value === "ego-no-rounds") {
			setIsIndividual(false)
		}
	}

	const handleDistrictChange = (value: string) => {
		setFormData((prev) => ({ ...prev, district: value }))
	}

	const handleScriptEdit = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setEditableScript(e.target.value)
	}

	const applyScriptChanges = () => {
		setGeneratedScript(editableScript)
		toast({
			title: "Изменения применены",
			description: "Внесенные изменения успешно применены к скрипту",
		})
	}

	const toggleInputMode = () => {
		setUseManualInput(!useManualInput)
	}

	const toggleSmartIntercomInfo = () => {
		setIncludeSmartIntercomInfo(!includeSmartIntercomInfo)
	}

	const toggleIndividual = () => {
		setIsIndividual(!isIndividual)
	}

	const resetForm = () => {
		const defaultFormData = {
			district: "",
			address: "",
			topic: "",
			completionDate: "",
			completionDateText: "",
			ossNumber: "",
			electronicDate: "",
			electronicDateText: "",
			electronicTime: "09:00",
			electronicTimeText: "09:00",
			paperDate: "",
			paperDateText: "",
			paperTime: "09:00",
			paperTimeText: "09:00",
			administrator: "",
			adminAddress: "",
		}

		setFormData(defaultFormData)
		setRounds([
			{
				id: 1,
				startDate: "",
				startDateText: "",
				startTime: "18:30",
				startTimeText: "18:30",
				endTime: "20:30",
				endTimeText: "20:30",
			},
			{
				id: 2,
				startDate: "",
				startDateText: "",
				startTime: "18:30",
				startTimeText: "18:30",
				endTime: "20:30",
				endTimeText: "20:30",
			},
		])
		setScriptType("ego-rounds")
		setGeneratedScript("")
		setEditableScript("")
		setFileName("")
		setUseManualInput(false)
		setIncludeSmartIntercomInfo(false)
		setIsIndividual(false)

		// Очищаем localStorage
		localStorage.removeItem("scriptGeneratorData")

		toast({
			title: "Форма сброшена",
			description: "Все поля формы сброшены до значений по умолчанию",
		})
	}

	const addRound = () => {
		const newRound = {
			id: Math.max(...rounds.map(r => r.id)) + 1,
			startDate: "",
			startDateText: "",
			startTime: "18:30",
			startTimeText: "18:30",
			endTime: "20:30",
			endTimeText: "20:30",
		}
		setRounds([...rounds, newRound])
	}

	const removeRound = (id: number) => {
		if (rounds.length > 1) {
			setRounds(rounds.filter(round => round.id !== id))
		}
	}

	const getOrdinalNumber = (index: number) => {
		const ordinals = [
			"Первый", "Второй", "Третий", "Четвертый", "Пятый",
			"Шестой", "Седьмой", "Восьмой", "Девятый", "Десятый"
		]
		return ordinals[index] || `${index + 1}-й`
	}

	const updateRound = (id: number, field: string, value: string) => {
		setRounds(prevRounds => {
			const updatedRounds = prevRounds.map(round =>
				round.id === id ? { ...round, [field]: value } : round
			)

			// Sync date/time picker values with text inputs when in picker mode
			if (!useManualInput) {
				if (field.endsWith("Date") && value) {
					const textFieldName = field.replace("Date", "DateText")
					const formattedDate = formatDate(value)
					return updatedRounds.map(round =>
						round.id === id ? { ...round, [textFieldName]: formattedDate } : round
					)
				} else if (field.endsWith("Time")) {
					const textFieldName = field.replace("Time", "TimeText")
					return updatedRounds.map(round =>
						round.id === id ? { ...round, [textFieldName]: value } : round
					)
				}
			} else {
				// Sync text inputs with date/time pickers when in manual mode
				if (field.endsWith("DateText")) {
					const pickerName = field.replace("Text", "")
					try {
						const parsedDate = parseCustomDate(value)
						if (parsedDate) {
							const isoDate = parsedDate.toISOString().split("T")[0]
							return updatedRounds.map(round =>
								round.id === id ? { ...round, [pickerName]: isoDate } : round
							)
						}
					} catch (error) {
						// Invalid date format, don't update the picker
					}
				} else if (field.endsWith("TimeText")) {
					const pickerName = field.replace("Text", "")
					try {
						const timeValue = parseCustomTime(value)
						if (timeValue) {
							return updatedRounds.map(round =>
								round.id === id ? { ...round, [pickerName]: timeValue } : round
							)
						}
					} catch (error) {
						// Invalid time format, don't update the picker
					}
				}
			}

			return updatedRounds
		})
	}

	const generateScript = () => {
		const template = scriptTemplates[scriptType]

		if (!template) {
			toast({
				title: "Ошибка",
				description: "Шаблон скрипта не найден",
				variant: "destructive",
			})
			return
		}

		// Use text inputs if in manual mode, otherwise use formatted dates from pickers
		const electronicDateFormatted = useManualInput
			? formData.electronicDateText
			: formData.electronicDate
				? formatDate(formData.electronicDate)
				: ""

		const paperDateFormatted = useManualInput
			? formData.paperDateText
			: formData.paperDate
				? formatDate(formData.paperDate)
				: ""

		// Format rounds dates
		let roundDatesText = ""

		const validRounds = rounds.filter(round =>
			useManualInput ? round.startDateText : round.startDate
		)

		if (validRounds.length > 0) {
			const roundTexts = validRounds.map(round => {
				const dateText = useManualInput ? round.startDateText : formatDate(round.startDate)
				const startTime = useManualInput ? round.startTimeText : round.startTime
				const endTime = useManualInput ? round.endTimeText : round.endTime
				return `**${dateText} с ${startTime} до ${endTime}**`
			})

			if (roundTexts.length === 1) {
				// Один обход
				roundDatesText = roundTexts[0]
			} else if (roundTexts.length === 2) {
				// Два обхода - через запятую и "и"
				roundDatesText = `${roundTexts[0]} и ${roundTexts[1]}`
			} else {
				// Больше двух обходов - каждый с новой строки, ВСЕ со звездочками
				roundDatesText = `\n${roundTexts.join("\n")}\n`
			}
		}

		// Get the time values based on input mode
		const electronicTimeValue = useManualInput ? formData.electronicTimeText : formData.electronicTime
		const paperTimeValue = useManualInput ? formData.paperTimeText : formData.paperTime

		// Get the appropriate offices list based on district and script type
		const officesList = getOfficesList(formData.district, scriptType, roundDatesText, validRounds.length)

		// Get the correct grammatical form for rounds phrase
		const roundsPhrase = validRounds.length === 1 ? "состоится поквартирный обход" : "состоятся поквартирные обходы"

		let script = template
			.replace("{{address}}", `**${formData.address}**`)
			.replace("{{topic}}", `**${formData.topic}**`)
			.replace("{{electronicDate}}", `**${electronicDateFormatted} ${electronicTimeValue}**`)
			.replace("{{paperDate}}", `**${paperDateFormatted} ${paperTimeValue}**`)
			.replace("{{officesList}}", officesList)

		// Add script-specific replacements
		if (scriptType === "not-ego-with-rounds") {
			script = script
				.replace("{{roundDates}}", roundDatesText)
				.replace("{{roundsPhrase}}", roundsPhrase)
		}

		if (scriptType === "not-ego-no-rounds" || scriptType === "not-ego-with-rounds") {
			// Заменяем плейсхолдер для физ.лиц
			if (isIndividual) {
				// Для физ.лиц убираем фразу про новый порядок приема
				script = script.replace("{{individualSection}}", "")
			} else {
				// Для юр.лиц вставляем полную фразу
				script = script.replace("{{individualSection}}", "Обращаем ваше внимание, что в повестке присутствует вопрос об определении нового порядка приема письменных решений собственников.\nНовый порядок приема обеспечивает прозрачность проведения голосований в информационной системе проекта «Электронный дом», благодаря консультационной и организационной поддержке государственного учреждения города Москвы, являющегося координатором проекта «Электронный дом» - ГКУ «Новые технологии управления». «Единый городской оператор ОСС» будет принимать решения собственников и вносить их в систему, вместо администратора собрания.\n")
			}

			script = script
				.replace("{{administrator}}", `**${formData.administrator}**`)
				.replace("{{adminAddress}}", `**${formData.adminAddress}**`)
		}

		// Add Smart Intercom information if enabled
		if (includeSmartIntercomInfo) {
			script += "\n\n" + smartIntercomInfo
		}

		setGeneratedScript(script)
		setEditableScript(script)
		setFileName(generateFileName())

		toast({
			title: "Скрипт сгенерирован",
			description: "Скрипт успешно сгенерирован и готов к использованию",
		})
	}



	const copyToClipboard = async () => {
		try {
			// Проверяем поддержку современного Clipboard API
			if (navigator.clipboard && window.ClipboardItem) {
				// Создаем HTML версию с форматированием
				const htmlContent = editableScript.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>")

				// Создаем plain text версию без markdown
				const plainText = editableScript.replace(/\*\*(.*?)\*\*/g, "$1")

				// Создаем ClipboardItem с обоими форматами
				const clipboardItem = new ClipboardItem({
					"text/html": new Blob([htmlContent], { type: "text/html" }),
					"text/plain": new Blob([plainText], { type: "text/plain" }),
				})

				await navigator.clipboard.write([clipboardItem])

				toast({
					title: "Скопировано с форматированием",
					description: "Скрипт скопирован в буфер обмена с сохранением жирного текста",
				})
			} else {
				// Fallback для старых браузеров - копируем только plain text
				const cleanText = editableScript.replace(/\*\*(.*?)\*\*/g, "$1")

				const textArea = document.createElement("textarea")
				textArea.value = cleanText
				textArea.style.position = "fixed"
				textArea.style.left = "-999999px"
				textArea.style.top = "-999999px"
				document.body.appendChild(textArea)

				textArea.focus()
				textArea.select()
				document.execCommand("copy")
				document.body.removeChild(textArea)

				toast({
					title: "Скопировано",
					description: "Скрипт скопирован в буфер обмена (без форматирования - браузер не поддерживает)",
				})
			}
		} catch (error) {
			console.error("Clipboard error:", error)

			// Еще один fallback
			try {
				const cleanText = editableScript.replace(/\*\*(.*?)\*\*/g, "$1")
				await navigator.clipboard.writeText(cleanText)

				toast({
					title: "Скопировано",
					description: "Скрипт скопирован в буфер обмена (только текст)",
				})
			} catch (fallbackError) {
				toast({
					title: "Ошибка копирования",
					description: "Не удалось скопировать в буфер обмена. Выделите текст вручную и нажмите Ctrl+C.",
					variant: "destructive",
				})
			}
		}
	}

	const exportToWord = async () => {
		try {
			// Парсим markdown текст и создаем параграфы
			const lines = editableScript.split("\n")
			const paragraphs: Paragraph[] = []

			for (const line of lines) {
				if (line.trim() === "") {
					// Пустая строка
					paragraphs.push(new Paragraph({ children: [new TextRun("")] }))
					continue
				}

				const children: TextRun[] = []
				const currentText = line

				// Обрабатываем жирный текст **text**
				const boldRegex = /\*\*(.*?)\*\*/g
				let lastIndex = 0
				let match

				while ((match = boldRegex.exec(line)) !== null) {
					// Добавляем обычный текст перед жирным
					if (match.index > lastIndex) {
						const normalText = line.substring(lastIndex, match.index)
						if (normalText) {
							children.push(new TextRun({ text: normalText }))
						}
					}

					// Добавляем жирный текст
					children.push(
						new TextRun({
							text: match[1],
							bold: true,
						}),
					)

					lastIndex = match.index + match[0].length
				}

				// Добавляем оставшийся обычный текст
				if (lastIndex < line.length) {
					const remainingText = line.substring(lastIndex)
					if (remainingText) {
						children.push(new TextRun({ text: remainingText }))
					}
				}

				// Если нет жирного текста, добавляем всю строку как обычный текст
				if (children.length === 0) {
					children.push(new TextRun({ text: line }))
				}

				paragraphs.push(new Paragraph({ children }))
			}

			// Создаем документ
			const doc = new Document({
				sections: [
					{
						properties: {},
						children: paragraphs,
					},
				],
				styles: {
					default: {
						document: {
							run: {
								font: "Times New Roman",
								size: 24, // 12pt = 24 half-points
							},
						},
					},
				},
			})

			// Генерируем файл
			const buffer = await Packer.toBuffer(doc)
			const blob = new Blob([buffer], {
				type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			})

			const link = document.createElement("a")
			link.href = URL.createObjectURL(blob)
			link.download = `${fileName}.docx`
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)

			toast({
				title: "Экспорт выполнен",
				description: "Скрипт успешно экспортирован в Word (.docx)",
			})
		} catch (error) {
			console.error("Ошибка экспорта:", error)
			toast({
				title: "Ошибка экспорта",
				description: "Не удалось создать Word документ. Попробуйте еще раз.",
				variant: "destructive",
			})
		}
	}

	const createGoogleDoc = () => {
		// Show dialog with instructions instead of trying to use clipboard
		setShowGoogleDocDialog(true)
	}

	const openGoogleDoc = () => {
		// Create a new Google Doc by opening a new tab with the Google Docs URL
		const docTitle = encodeURIComponent(fileName)
		const url = `https://docs.new?title=${docTitle}`

		// Open a new tab with Google Docs
		window.open(url, "_blank")
		setShowGoogleDocDialog(false)
	}

	const printScript = () => {
		// Create a printable version of the script
		const printWindow = window.open("", "_blank")
		if (printWindow) {
			const htmlContent = editableScript.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>")

			printWindow.document.write(`
        <html>
          <head>
            <title>Печать скрипта</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
              strong { font-weight: bold; }
            </style>
          </head>
          <body>
            <div>${htmlContent}</div>
            <script>
              window.onload = function() {
                window.print();
                window.setTimeout(function() { window.close(); }, 500);
              }
            </script>
          </body>
        </html>
      `)
			printWindow.document.close()
		} else {
			toast({
				title: "Ошибка печати",
				description: "Не удалось открыть окно печати. Проверьте настройки блокировки всплывающих окон.",
				variant: "destructive",
			})
		}
	}

	// Add function for copying the file name
	const copyFileName = () => {
		try {
			navigator.clipboard.writeText(fileName)
			toast({
				title: "Скопировано",
				description: "Имя файла скопировано в буфер обмена",
			})
		} catch (error) {
			console.error("Clipboard error:", error)
			toast({
				title: "Ошибка копирования",
				description: "Не удалось скопировать в буфер обмена",
				variant: "destructive",
			})
		}
	}

	// Функция для добавления адреса в генератор сообщения в чат
	const addToChat = () => {
		if (!formData.address || !formData.district) {
			toast({
				title: "Недостаточно данных",
				description: "Укажите адрес и округ для добавления в сообщение",
				variant: "destructive",
			})
			return
		}

		// Определяем, есть ли обходы в скрипте
		const hasRounds = scriptType === "ego-rounds" || scriptType === "not-ego-with-rounds"

		// Форматируем даты обходов для сообщения
		let roundDatesFormatted = ""
		if (hasRounds) {
			const validRounds = rounds.filter(round => round.startDate)
			if (validRounds.length > 0) {
				roundDatesFormatted = validRounds.map(round => {
					const date = new Date(round.startDate)
					const formattedDate = `${date.getDate().toString().padStart(2, "0")}.${(date.getMonth() + 1)
						.toString()
						.padStart(2, "0")}.${date.getFullYear()}`
					return `${formattedDate} ${round.startTime}-${round.endTime}`
				}).join("\n")
			}
		}

		// Создаем объект с данными адреса
		const addressItem: AddressItem = {
			id: Date.now().toString(),
			district: formData.district,
			address: formData.address,
			scriptType: scriptType === "ego-rounds" || scriptType === "ego-no-rounds" ? "ЕГО" : "не ЕГО",
			hasRounds,
			roundDates: roundDatesFormatted,
		}

		// Добавляем адрес в контекст
		addAddressToChat(addressItem)

		toast({
			title: "Адрес добавлен",
			description: "Адрес успешно добавлен в сообщение для чата",
		})
	}

	// Функция для переноса данных в Excel-процессор
	const transferToExcel = () => {
		if (!formData.address) {
			toast({
				title: "Ошибка",
				description: "Заполните адрес дома",
				variant: "destructive",
			})
			return
		}

		if (!formData.district) {
			toast({
				title: "Ошибка",
				description: "Выберите округ",
				variant: "destructive",
			})
			return
		}

		if (!formData.completionDate) {
			toast({
				title: "Ошибка",
				description: "Заполните дату завершения ОСС",
				variant: "destructive",
			})
			return
		}

		// Преобразуем обходы в формат для Excel-процессора
		const excelRounds = rounds
			.filter(round => useManualInput ? round.startDateText : round.startDate)
			.map((round, index) => ({
				id: (index + 1).toString(),
				type: "date" as const,
				status: "cancelled" as const,
				date: useManualInput ? (parseCustomDate(round.startDateText)?.toISOString().split("T")[0] || "") : round.startDate,
				startTime: useManualInput ? round.startTimeText : round.startTime,
				endTime: useManualInput ? round.endTimeText : round.endTime,
			}))

		// Если нет обходов, создаем один пустой
		if (excelRounds.length === 0) {
			excelRounds.push({
				id: "1",
				type: "date" as const,
				status: "cancelled" as const,
				date: "",
				startTime: "18:00",
				endTime: "20:30",
			})
		}

		// Создаем объект данных для Excel-процессора
		const excelData = {
			address: formData.address,
			district: formData.district,
			ossNumber: formData.ossNumber || "",
			ossDate: formData.completionDate,
			rounds: excelRounds,
		}

		// Сохраняем данные в localStorage для Excel-процессора
		localStorage.setItem("excelProcessorData", JSON.stringify(excelData))

		toast({
			title: "Данные переданы",
			description: "Данные переданы в Excel-процессор. Перейдите на вкладку обработки таблиц.",
		})
	}

	// Функция для переноса данных в генератор плакатов
	const transferToPoster = () => {
		// Определяем, есть ли обходы в скрипте
		const hasRounds = scriptType === "ego-rounds" || scriptType === "not-ego-with-rounds"

		if (!hasRounds) {
			toast({
				title: "Ошибка",
				description: "Плакаты создаются только для скриптов с обходами",
				variant: "destructive",
			})
			return
		}

		// Получаем обходы с заполненными датами
		const validRounds = rounds.filter(round => {
			const hasDate = useManualInput ? round.startDateText : round.startDate
			const hasTime = useManualInput ? round.startTimeText : round.startTime
			return hasDate && hasTime
		})

		if (validRounds.length === 0) {
			toast({
				title: "Ошибка",
				description: "Заполните даты и время для обходов",
				variant: "destructive",
			})
			return
		}

		if (validRounds.length > 4) {
			toast({
				title: "Ошибка",
				description: "Максимальное количество дат для плаката: 4",
				variant: "destructive",
			})
			return
		}

		// Функция для форматирования даты для плаката (без "г.")
		const formatDateForPoster = (dateString: string): string => {
			const date = new Date(dateString)
			const months = [
				'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
				'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
			];

			const day = date.getDate();
			const month = months[date.getMonth()];

			return `${day} ${month}`;
		}

		// Преобразуем обходы в формат для генератора плакатов
		const posterDates = validRounds.map((round, index) => {
			let isoDate = ""
			let displayDate = ""

			if (useManualInput) {
				// Если ручной ввод, парсим текстовую дату
				const parsedDate = parseCustomDate(round.startDateText)
				if (parsedDate) {
					isoDate = parsedDate.toISOString().split("T")[0]
					displayDate = formatDateForPoster(isoDate)
				}
			} else {
				// Если календарь, используем дату напрямую
				isoDate = round.startDate
				displayDate = formatDateForPoster(isoDate)
			}

			return {
				id: index + 1,
				date: displayDate,
				isoDate: isoDate,
				timeStart: useManualInput ? round.startTimeText : round.startTime,
				timeEnd: useManualInput ? round.endTimeText : round.endTime,
			}
		})

		// Создаем объект данных для генератора плакатов
		const posterData = {
			posterType: 'rounds', // Указываем тип плаката для обходов
			dates: posterDates,
			phone: '8 (499) 652-62-11',
			showPhone: true,
			autoGenerate: true // Флаг для автоматической генерации плаката
		}

		// Сохраняем данные в localStorage для генератора плакатов
		localStorage.setItem("posterGeneratorData", JSON.stringify(posterData))

		toast({
			title: "Данные переданы",
			description: "Данные переданы в генератор плакатов и плакат будет автоматически сгенерирован.",
		})
	}

	// Обработчик для вставки в поле даты завершения ОСС
	const handleCompletionDatePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
		e.preventDefault()
		const pastedText = e.clipboardData.getData("text")

		// Проверяем, соответствует ли текст формату DD.MM.YYYY
		const datePattern = /^(\d{2})\.(\d{2})\.(\d{4})$/
		const match = pastedText.match(datePattern)

		if (match) {
			// Если соответствует, преобразуем в формат YYYY-MM-DD для input type="date"
			const day = match[1]
			const month = match[2]
			const year = match[3]
			const formattedDate = `${year}-${month}-${day}`

			setFormData((prev) => ({
				...prev,
				completionDate: formattedDate,
			}))
		} else {
			// Если не соответствует, пробуем распарсить с помощью parseCustomDate
			const parsedDate = parseCustomDate(pastedText)
			if (parsedDate) {
				const formattedDate = parsedDate.toISOString().split("T")[0]
				setFormData((prev) => ({
					...prev,
					completionDate: formattedDate,
				}))
			}
		}
	}

	// Обработчик для вставки в поле даты электронного голосования
	const handleElectronicDatePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
		e.preventDefault()
		const pastedText = e.clipboardData.getData("text")

		// Проверяем, соответствует ли текст формату DD.MM.YYYY
		const datePattern = /^(\d{2})\.(\d{2})\.(\d{4})$/
		const match = pastedText.match(datePattern)

		if (match) {
			// Если соответствует, преобразуем в формат YYYY-MM-DD для input type="date"
			const day = match[1]
			const month = match[2]
			const year = match[3]
			const formattedDate = `${year}-${month}-${day}`

			setFormData((prev) => ({
				...prev,
				electronicDate: formattedDate,
				electronicDateText: formatDate(formattedDate),
			}))
		} else {
			// Если не соответствует, пробуем распарсить с помощью parseCustomDate
			const parsedDate = parseCustomDate(pastedText)
			if (parsedDate) {
				const formattedDate = parsedDate.toISOString().split("T")[0]
				setFormData((prev) => ({
					...prev,
					electronicDate: formattedDate,
					electronicDateText: formatDate(formattedDate),
				}))
			}
		}
	}

	// Обработчик для вставки в поля дат обходов
	const handleRoundDatePaste = (e: React.ClipboardEvent<HTMLInputElement>, fieldName: string) => {
		e.preventDefault()
		const pastedText = e.clipboardData.getData("text")

		// Проверяем, соответствует ли текст формату DD.MM.YYYY
		const datePattern = /^(\d{2})\.(\d{2})\.(\d{4})$/
		const match = pastedText.match(datePattern)

		if (match) {
			// Если соответствует, преобразуем в формат YYYY-MM-DD для input type="date"
			const day = match[1]
			const month = match[2]
			const year = match[3]
			const formattedDate = `${year}-${month}-${day}`

			setFormData((prev) => ({
				...prev,
				[fieldName]: formattedDate,
				[`${fieldName}Text`]: formatDate(formattedDate),
			}))
		} else {
			// Если не соответствует, пробуем распарсить с помощью parseCustomDate
			const parsedDate = parseCustomDate(pastedText)
			if (parsedDate) {
				const formattedDate = parsedDate.toISOString().split("T")[0]
				setFormData((prev) => ({
					...prev,
					[fieldName]: formattedDate,
					[`${fieldName}Text`]: formatDate(formattedDate),
				}))
			}
		}
	}

	// Обработчик для вставки в поле даты бумажного голосования
	const handlePaperDatePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
		e.preventDefault()
		const pastedText = e.clipboardData.getData("text")

		// Проверяем, соответствует ли текст формату DD.MM.YYYY
		const datePattern = /^(\d{2})\.(\d{2})\.(\d{4})$/
		const match = pastedText.match(datePattern)

		if (match) {
			// Если соответствует, преобразуем в формат YYYY-MM-DD для input type="date"
			const day = match[1]
			const month = match[2]
			const year = match[3]
			const formattedDate = `${year}-${month}-${day}`

			setFormData((prev) => ({
				...prev,
				paperDate: formattedDate,
				paperDateText: formatDate(formattedDate),
			}))
		} else {
			// Если не соответствует, пробуем распарсить с помощью parseCustomDate
			const parsedDate = parseCustomDate(pastedText)
			if (parsedDate) {
				const formattedDate = parsedDate.toISOString().split("T")[0]
				setFormData((prev) => ({
					...prev,
					paperDate: formattedDate,
					paperDateText: formatDate(formattedDate),
				}))
			}
		}
	}

	// Render different form fields based on script type
	const renderScriptSpecificFields = () => {
		const needsRounds = scriptType === "ego-rounds" || scriptType === "not-ego-with-rounds"
		const needsAdmin = scriptType === "not-ego-no-rounds" || scriptType === "not-ego-with-rounds"

		return (
			<div className="space-y-4">
				{needsAdmin && (
					<>
						<div className="space-y-2">
							<Label htmlFor="administrator">Администратор</Label>
							<Input
								id="administrator"
								name="administrator"
								placeholder="Например: ГБУ 'Жилищник ГОЛОВИНСКОГО РАЙОНА'"
								value={formData.administrator}
								onChange={handleInputChange}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="adminAddress">Адрес и время приема</Label>
							<Textarea
								id="adminAddress"
								name="adminAddress"
								placeholder="Например: г. Москва, ул. Онежская, д.2, к.3, каб. 8, пн. - чт. 08-00 - 17-00, пт. 08-00 - 15-45, обед 12-00 - 12-45, В рабочие дни, решения передаются лично в руки."
								value={formData.adminAddress}
								onChange={handleInputChange}
								rows={3}
							/>
						</div>
					</>
				)}

				{needsRounds && (
					<div>
						<Label>Даты поквартирных обходов</Label>

						{rounds.map((round, index) => (
							<div key={round.id} className="border p-4 rounded-md mt-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
								<div className="flex items-center justify-between mb-2">
									<Label className="text-base font-medium">
										{getOrdinalNumber(index)} обход
									</Label>
									{rounds.length > 1 && (
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => removeRound(round.id)}
											className="text-red-600 hover:text-red-700"
										>
											Удалить
										</Button>
									)}
								</div>

								{useManualInput ? (
									<div className="mt-2 space-y-2">
										<Label className="text-sm text-muted-foreground">
											Дата и время обхода
										</Label>
										<div className="flex items-center">
											<Input
												placeholder="Например: 19 мая 2025"
												value={round.startDateText}
												onChange={(e) => updateRound(round.id, "startDateText", e.target.value)}
												className="w-1/2"
											/>
											<span className="mx-2 text-sm">с</span>
											<Input
												placeholder="18:30"
												value={round.startTimeText}
												onChange={(e) => updateRound(round.id, "startTimeText", e.target.value)}
												className="w-1/5"
											/>
											<span className="mx-2 text-sm">до</span>
											<Input
												placeholder="20:30"
												value={round.endTimeText}
												onChange={(e) => updateRound(round.id, "endTimeText", e.target.value)}
												className="w-1/5"
											/>
										</div>
									</div>
								) : (
									<div className="mt-2 space-y-2">
										<Label className="text-sm text-muted-foreground">
											Дата обхода
										</Label>
										<Input
											type="date"
											value={round.startDate}
											onChange={(e) => updateRound(round.id, "startDate", e.target.value)}
											onPaste={(e) => {
												e.preventDefault()
												const pastedText = e.clipboardData.getData("text")
												const datePattern = /^(\d{2})\.(\d{2})\.(\d{4})$/
												const match = pastedText.match(datePattern)
												if (match) {
													const day = match[1]
													const month = match[2]
													const year = match[3]
													const formattedDate = `${year}-${month}-${day}`
													updateRound(round.id, "startDate", formattedDate)
												}
											}}
										/>

										<div className="grid grid-cols-2 gap-4">
											<div>
												<Label className="text-sm text-muted-foreground">
													Время начала
												</Label>
												<div className="relative">
													<Input
														type="time"
														value={round.startTime}
														onChange={(e) => updateRound(round.id, "startTime", e.target.value)}
														className="pr-10"
													/>
													<Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
												</div>
											</div>
											<div>
												<Label className="text-sm text-muted-foreground">
													Время окончания
												</Label>
												<div className="relative">
													<Input
														type="time"
														value={round.endTime}
														onChange={(e) => updateRound(round.id, "endTime", e.target.value)}
														className="pr-10"
													/>
													<Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
												</div>
											</div>
										</div>
									</div>
								)}
							</div>
						))}

						<div className="mt-4 flex justify-center">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={addRound}
								className="text-sm"
							>
								+ Добавить обход
							</Button>
						</div>
					</div>
				)}
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<Card className="glass-card card-hover shadow-lg">
				<CardHeader>
					<div className="flex items-center gap-2">
						<Sparkles className="h-5 w-5 text-primary" />
						<CardTitle>Генератор скриптов</CardTitle>
					</div>
					<CardDescription>Выберите тип скрипта и заполните необходимые поля</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between mb-4 p-3 bg-secondary/50 dark:bg-secondary/30 rounded-lg">
						<div className="flex items-center space-x-2">
							<Switch id="input-mode" checked={useManualInput} onCheckedChange={toggleInputMode} />
							<Label htmlFor="input-mode">Ручной ввод дат и времени</Label>
						</div>
						<div className="text-sm text-muted-foreground">
							{useManualInput ? "Ввод текстом" : "Выбор из календаря"}
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="scriptType">Тип скрипта</Label>
						<Select value={scriptType} onValueChange={handleSelectChange}>
							<SelectTrigger id="scriptType" className="bg-white dark:bg-gray-800">
								<SelectValue placeholder="Выберите тип скрипта" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="ego-rounds">ЕГО с обходами</SelectItem>
								<SelectItem value="ego-no-rounds">ЕГО без обходов</SelectItem>
								<SelectItem value="not-ego-no-rounds">не ЕГО без обходов</SelectItem>
								<SelectItem value="not-ego-with-rounds">не ЕГО с обходами</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Чекбокс "Физ.лицо" для скриптов "не ЕГО" */}
					{(scriptType === "not-ego-no-rounds" || scriptType === "not-ego-with-rounds") && (
						<div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
							<Switch id="individual" checked={isIndividual} onCheckedChange={toggleIndividual} />
							<Label htmlFor="individual" className="text-sm font-medium">
								Физ.лицо
							</Label>
						</div>
					)}

					<div className="space-y-2">
						<Label htmlFor="district">Округ</Label>
						<Select value={formData.district} onValueChange={handleDistrictChange}>
							<SelectTrigger id="district" className="bg-white dark:bg-gray-800">
								<SelectValue placeholder="Выберите округ" />
							</SelectTrigger>
							<SelectContent>
								{DISTRICTS.map((district) => (
									<SelectItem key={district} value={district}>
										{district}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label htmlFor="address">Адрес дома</Label>
						<Input
							id="address"
							name="address"
							placeholder="Например: Переулок 3-й Лихачёвский Дом 3 Корпус 1"
							value={formData.address}
							onChange={handleInputChange}
							className="bg-white dark:bg-gray-800"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="topic">Тематика собрания (по вопросу ....)</Label>
						<Input
							id="topic"
							name="topic"
							placeholder="Например: установки Умного домофона"
							value={formData.topic}
							onChange={handleInputChange}
							className="bg-white dark:bg-gray-800"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="ossNumber">Номер ОСС</Label>
						<Input
							id="ossNumber"
							name="ossNumber"
							placeholder="Например: 12345"
							value={formData.ossNumber}
							onChange={handleInputChange}
							className="bg-white dark:bg-gray-800"
						/>
						<p className="text-sm text-muted-foreground">
							Если заполнено, будет передано в Excel-процессор
						</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="completionDate">Дата завершения ОСС *</Label>
						{useManualInput ? (
							<Input
								id="completionDateText"
								name="completionDateText"
								placeholder="Например: 26 мая 2025"
								value={
									formData.completionDateText || (formData.completionDate ? formatDate(formData.completionDate) : "")
								}
								onChange={handleTextInputChange}
								className="bg-white dark:bg-gray-800"
							/>
						) : (
							<Input
								id="completionDate"
								name="completionDate"
								type="date"
								value={formData.completionDate}
								onChange={handleInputChange}
								onPaste={handleCompletionDatePaste}
								className="bg-white dark:bg-gray-800"
							/>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="paperDate">
							Дата окончания бумажного голосования {!useManualInput && "(автоматически)"}
						</Label>
						{useManualInput ? (
							<div className="flex items-center">
								<Input
									id="paperDateText"
									name="paperDateText"
									placeholder="Например: 24 мая 2025"
									value={formData.paperDateText}
									onChange={handleTextInputChange}
									className="w-2/3 bg-white dark:bg-gray-800"
								/>
								<Input
									id="paperTimeText"
									name="paperTimeText"
									placeholder="09:00"
									value={formData.paperTimeText}
									onChange={handleTextInputChange}
									className="w-1/3 ml-2 bg-white dark:bg-gray-800"
								/>
							</div>
						) : (
							<div className="flex gap-2">
								<Input
									id="paperDate"
									name="paperDate"
									type="date"
									value={formData.paperDate}
									onChange={handleInputChange}
									onPaste={handlePaperDatePaste}
									className="w-2/3 bg-gray-100 dark:bg-gray-700"
									disabled
								/>
								<div className="relative w-1/3">
									<Input
										id="paperTime"
										name="paperTime"
										type="time"
										value={formData.paperTime}
										onChange={handleInputChange}
										className="pr-10 bg-gray-100 dark:bg-gray-700"
										disabled
									/>
									<Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
								</div>
							</div>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="electronicDate">
							Дата окончания электронного голосования {!useManualInput && "(автоматически)"}
						</Label>
						{useManualInput ? (
							<div className="flex items-center">
								<Input
									id="electronicDateText"
									name="electronicDateText"
									placeholder="Например: 26 мая 2025"
									value={formData.electronicDateText}
									onChange={handleTextInputChange}
									className="w-2/3 bg-white dark:bg-gray-800"
								/>
								<Input
									id="electronicTimeText"
									name="electronicTimeText"
									placeholder="09:00"
									value={formData.electronicTimeText}
									onChange={handleTextInputChange}
									className="w-1/3 ml-2 bg-white dark:bg-gray-800"
								/>
							</div>
						) : (
							<div className="flex gap-2">
								<Input
									id="electronicDate"
									name="electronicDate"
									type="date"
									value={formData.electronicDate}
									onChange={handleInputChange}
									onPaste={handleElectronicDatePaste}
									className="w-2/3 bg-gray-100 dark:bg-gray-700"
									disabled
								/>
								<div className="relative w-1/3">
									<Input
										id="electronicTime"
										name="electronicTime"
										type="time"
										value={formData.electronicTime}
										onChange={handleInputChange}
										className="pr-10 bg-gray-100 dark:bg-gray-700"
										disabled
									/>
									<Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
								</div>
							</div>
						)}
					</div>

					{/* Render script-specific fields */}
					{renderScriptSpecificFields()}

					{/* Smart Intercom toggle */}
					<div className="border p-4 rounded-md mt-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
						<div className="flex items-center justify-between">
							<div className="flex items-center space-x-2">
								<Switch
									id="smart-intercom"
									checked={includeSmartIntercomInfo}
									onCheckedChange={toggleSmartIntercomInfo}
								/>
								<Label htmlFor="smart-intercom" className="font-medium">
									Добавить информацию об Умном домофоне?
								</Label>
							</div>
						</div>
						{includeSmartIntercomInfo && (
							<div className="mt-4 text-sm text-muted-foreground bg-muted p-3 rounded-md">
								<p>
									В конец скрипта будет добавлена информация об Умном домофоне с ответами на часто задаваемые вопросы.
								</p>
							</div>
						)}
					</div>
				</CardContent>
				<CardFooter className="flex justify-between">
					<Button variant="outline" onClick={resetForm}>
						Сбросить
					</Button>
					<Button onClick={generateScript} className="gradient-bg border-0">
						Сгенерировать скрипт
					</Button>
				</CardFooter>
			</Card>

			{generatedScript && (
				<Card className="glass-card card-hover shadow-lg animate-fade-in">
					<CardHeader className="flex flex-row items-center justify-between">
						<div>
							<CardTitle>Сгенерированный скрипт</CardTitle>
							<CardDescription>Готовый скрипт с заполненными данными</CardDescription>
							<div className="mt-2 flex items-center">
								<div className="text-sm bg-muted p-2 rounded-l-md overflow-hidden text-ellipsis whitespace-nowrap max-w-[300px]">
									{fileName}
								</div>
								<Button
									variant="outline"
									size="sm"
									className="h-8 rounded-l-none"
									onClick={copyFileName}
									title="Копировать имя файла"
								>
									<ClipboardCopy className="h-3.5 w-3.5" />
								</Button>
							</div>
						</div>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="icon"
								onClick={addToChat}
								title="Добавить в сообщение для чата"
								className="rounded-full"
							>
								<MessageSquarePlus className="h-4 w-4" />
							</Button>
							<Button
								variant="outline"
								size="icon"
								onClick={transferToExcel}
								title="Перенести данные в Excel-процессор"
								className="rounded-full"
							>
								<Table className="h-4 w-4" />
							</Button>
							{(scriptType === "ego-rounds" || scriptType === "not-ego-with-rounds") && (
								<Button
									variant="outline"
									size="icon"
									onClick={transferToPoster}
									title="Перенести данные в генератор плакатов"
									className="rounded-full"
								>
									<Image className="h-4 w-4" />
								</Button>
							)}
							<Button
								variant="outline"
								size="icon"
								onClick={copyToClipboard}
								title="Копировать в буфер обмена"
								className="rounded-full"
							>
								<ClipboardCopy className="h-4 w-4" />
							</Button>
							<Button
								variant="outline"
								size="icon"
								onClick={exportToWord}
								title="Экспорт в Word"
								className="rounded-full"
							>
								<FileDown className="h-4 w-4" />
							</Button>
							<Button
								variant="outline"
								size="icon"
								onClick={createGoogleDoc}
								title="Создать Google Документ"
								className="rounded-full"
							>
								<FileText className="h-4 w-4" />
							</Button>
							<Button
								variant="outline"
								size="icon"
								onClick={printScript}
								title="Печать скрипта"
								className="rounded-full"
							>
								<Printer className="h-4 w-4" />
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						<Tabs defaultValue="preview">
							<TabsList className="mb-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-1.5 rounded-lg shadow-sm">
								<TabsTrigger value="preview" className="rounded-md px-4 py-2 relative">
									Предпросмотр
									<div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full scale-x-0 transition-transform duration-300 data-[state=active]:scale-x-100"></div>
								</TabsTrigger>
								<TabsTrigger value="text" className="rounded-md px-4 py-2 relative">
									Текст
									<div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full scale-x-0 transition-transform duration-300 data-[state=active]:scale-x-100"></div>
								</TabsTrigger>
							</TabsList>
							<TabsContent value="preview">
								<div
									className="whitespace-pre-line bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-4 rounded-md max-h-[500px] overflow-y-auto"
									dangerouslySetInnerHTML={{
										__html: generatedScript.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
									}}
								/>
							</TabsContent>
							<TabsContent value="text">
								<div className="space-y-4">
									<Textarea
										className="min-h-[500px] font-mono text-sm bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
										value={editableScript}
										onChange={handleScriptEdit}
									/>
									<div className="flex justify-end">
										<Button onClick={applyScriptChanges} className="gradient-bg border-0">
											Применить изменения
										</Button>
									</div>
								</div>
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>
			)}

			{/* Диалог с инструкциями для Google Docs */}
			<Dialog open={showGoogleDocDialog} onOpenChange={setShowGoogleDocDialog}>
				<DialogContent className="glass-card">
					<DialogHeader>
						<DialogTitle>Создание Google Документа</DialogTitle>
						<DialogDescription>Для создания Google Документа со скриптом, выполните следующие шаги:</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<ol className="list-decimal list-inside space-y-2">
							<li>Нажмите кнопку "Открыть Google Документ" ниже</li>
							<li>В новой вкладке откроется пустой Google Документ</li>
							<li>Вернитесь на эту страницу и нажмите кнопку "Копировать" над скриптом</li>
							<li>Перейдите обратно в Google Документ и вставьте скопированный текст (Ctrl+V)</li>
						</ol>
					</div>
					<DialogFooter>
						<Button onClick={openGoogleDoc} className="gradient-bg border-0">
							Открыть Google Документ
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
