"use client"

import type React from "react"

import { useState, useEffect } from "react"
import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, FileSpreadsheet, Upload, Table, ShoppingCart, Trash2, Plus, Download, X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const DISTRICTS = ["ЦАО", "САО", "СВАО", "ВАО", "ЮВАО", "ЮАО", "ЮЗАО", "ЗАО", "СЗАО", "Зеленоград", "Новая Москва"]

// Интерфейс для одного обхода
interface Round {
	id: string
	type: "date" | "status"
	status: "cancelled" | "none"
	date: string
	startTime: string
	endTime: string
}

// Интерфейс для элемента корзины
interface CartItem {
	id: string
	address: string
	district: string
	ossNumber: string
	ossDate: string
	file: File | null
	rounds: Round[]
}

export default function ExcelProcessor() {
	const { toast } = useToast()
	const [file, setFile] = useState<File | null>(null)
	const [processing, setProcessing] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Состояние корзины
	const [cart, setCart] = useState<CartItem[]>([])

	// Добавляем состояния для пользовательских данных
	const [address, setAddress] = useState("")
	const [district, setDistrict] = useState("")
	const [ossNumber, setOssNumber] = useState("")
	const [ossDate, setOssDate] = useState("")

	// Состояние для обходов
	const [rounds, setRounds] = useState<Round[]>([
		{
			id: "1",
			type: "date",
			status: "cancelled",
			date: "",
			startTime: "18:00",
			endTime: "20:30"
		}
	])

	const [isLoaded, setIsLoaded] = useState(false)
	const [editingItems, setEditingItems] = useState<Set<string>>(new Set())

	// Функция для получения порядкового номера обхода
	const getOrdinalNumber = (index: number): string => {
		const ordinals = ["Первый", "Второй", "Третий", "Четвертый", "Пятый", "Шестой", "Седьмой", "Восьмой", "Девятый", "Десятый"]
		return ordinals[index] || `${index + 1}-й`
	}

	// Функция для добавления обхода
	const addRound = () => {
		const newRound: Round = {
			id: Date.now().toString(),
			type: "date",
			status: "cancelled",
			date: "",
			startTime: "18:00",
			endTime: "20:30"
		}
		setRounds(prev => [...prev, newRound])
	}

	// Функция для удаления обхода
	const removeRound = (id: string) => {
		if (rounds.length > 1) {
			setRounds(prev => prev.filter(round => round.id !== id))
		}
	}

	// Функция для обновления обхода
	const updateRound = (id: string, field: keyof Round, value: string) => {
		setRounds(prevRounds =>
			prevRounds.map(round =>
				round.id === id ? { ...round, [field]: value } : round
			)
		)
	}

	// Загрузка данных из localStorage при монтировании компонента
	useEffect(() => {
		const savedData = localStorage.getItem("excelProcessorData")
		if (savedData) {
			try {
				const parsedData = JSON.parse(savedData)
				setAddress(parsedData.address || "")
				setDistrict(parsedData.district || "")
				setOssNumber(parsedData.ossNumber || "")
				setOssDate(parsedData.ossDate || "")
				// Загружаем обходы или используем значения по умолчанию
				if (parsedData.rounds && Array.isArray(parsedData.rounds)) {
					setRounds(parsedData.rounds)
				}
			} catch (error) {
				console.error("Ошибка при загрузке данных из localStorage:", error)
			}
		}

		// Загружаем корзину из localStorage
		const savedCart = localStorage.getItem("excelProcessorCart")
		if (savedCart) {
			try {
				const parsedCart = JSON.parse(savedCart)
				if (Array.isArray(parsedCart)) {
					// Загружаем корзину без файлов (файлы будут добавлены пользователем)
					setCart(parsedCart)
				}
			} catch (error) {
				console.error("Ошибка при загрузке корзины из localStorage:", error)
			}
		}

		setIsLoaded(true)

		// Слушаем событие для очистки файлов при переходе на другую вкладку
		const handleTabChange = () => {
			// Очищаем файлы из корзины при переходе на другую вкладку
			setCart(prev => prev.map(item => ({ ...item, file: null })))
		}

		// Слушаем событие для проверки наличия файлов
		const handleCheckCartFiles = () => {
			const hasFiles = cart.some(item => item.file !== null)
			window.dispatchEvent(new CustomEvent('cartFilesStatus', { detail: { hasFiles } }))
		}

		window.addEventListener("clearCartFiles", handleTabChange)
		window.addEventListener("checkCartFiles", handleCheckCartFiles)
		return () => {
			window.removeEventListener("clearCartFiles", handleTabChange)
			window.removeEventListener("checkCartFiles", handleCheckCartFiles)
		}
	}, [])

	// Сохранение данных в localStorage при изменении (только после загрузки)
	useEffect(() => {
		if (!isLoaded) return

		const dataToSave = {
			address,
			district,
			ossNumber,
			ossDate,
			rounds,
		}
		localStorage.setItem("excelProcessorData", JSON.stringify(dataToSave))
	}, [address, district, ossNumber, ossDate, rounds, isLoaded])

	// Сохранение корзины в localStorage при изменении
	useEffect(() => {
		if (!isLoaded) return

		// Сохраняем корзину без файлов (файлы не сериализуются в JSON)
		const cartToSave = cart.map(item => ({
			...item,
			file: null // Не сохраняем файлы в localStorage
		}))
		localStorage.setItem("excelProcessorCart", JSON.stringify(cartToSave))

		// Также сохраняем информацию о наличии файлов для проверки предупреждений
		const hasFiles = cart.some(item => item.file !== null)
		localStorage.setItem("excelProcessorHasFiles", JSON.stringify(hasFiles))
	}, [cart, isLoaded])

	// Функции для работы с корзиной
	const addToCart = () => {
		if (!address || !district || !ossNumber || !ossDate) {
			setError("Пожалуйста, заполните все обязательные поля")
			return
		}

		// Проверяем, что все обходы заполнены корректно
		for (const round of rounds) {
			if (round.type === "date" && !round.date) {
				setError("Пожалуйста, укажите дату для всех обходов или выберите статус")
				return
			}
		}

		const newItem: CartItem = {
			id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
			address,
			district,
			ossNumber,
			ossDate,
			file: file || null, // Файл может быть null
			rounds: [...rounds] // Копируем массив обходов
		}

		setCart(prev => [...prev, newItem])
		resetCurrentForm()
		setError(null)

		toast({
			title: "Добавлено в корзину",
			description: `Адрес "${address}" добавлен в корзину`,
		})
	}

	// Функция для обновления элемента корзины
	const updateCartItem = (id: string, field: keyof CartItem, value: any) => {
		setCart(prev => prev.map(item =>
			item.id === id ? { ...item, [field]: value } : item
		))
	}

	// Функции для работы с обходами в корзине
	const addRoundToCartItem = (cartItemId: string) => {
		const newRound: Round = {
			id: Date.now().toString(),
			type: "date",
			status: "cancelled",
			date: "",
			startTime: "18:00",
			endTime: "20:30"
		}

		setCart(prev => prev.map(item =>
			item.id === cartItemId
				? { ...item, rounds: [...item.rounds, newRound] }
				: item
		))
	}

	const removeRoundFromCartItem = (cartItemId: string, roundId: string) => {
		setCart(prev => prev.map(item =>
			item.id === cartItemId
				? { ...item, rounds: item.rounds.filter(round => round.id !== roundId) }
				: item
		))
	}

	const updateCartItemRound = (cartItemId: string, roundId: string, field: keyof Round, value: string) => {
		setCart(prev => prev.map(item =>
			item.id === cartItemId
				? {
					...item,
					rounds: item.rounds.map(round =>
						round.id === roundId ? { ...round, [field]: value } : round
					)
				}
				: item
		))
	}

	// Функции для режима редактирования
	const toggleEditMode = (itemId: string) => {
		setEditingItems(prev => {
			const newSet = new Set(prev)
			if (newSet.has(itemId)) {
				newSet.delete(itemId)
			} else {
				newSet.add(itemId)
			}
			return newSet
		})
	}

	const exitEditMode = (itemId: string) => {
		setEditingItems(prev => {
			const newSet = new Set(prev)
			newSet.delete(itemId)
			return newSet
		})
	}

	const removeFromCart = (id: string) => {
		setCart(prev => prev.filter(item => item.id !== id))
	}

	const clearCart = () => {
		setCart([])
		localStorage.removeItem("excelProcessorCart")
	}

	const resetCurrentForm = () => {
		setFile(null)
		setAddress("")
		setDistrict("")
		setOssNumber("")
		setOssDate("")
		setRounds([
			{
				id: "1",
				type: "date",
				status: "cancelled",
				date: "",
				startTime: "18:00",
				endTime: "20:30"
			}
		])
	}

	const resetForm = () => {
		resetCurrentForm()
		clearCart()
		setError(null)
		localStorage.removeItem("excelProcessorData")
	}

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			const selectedFile = e.target.files[0]
			// Проверяем, что это Excel-файл
			if (
				selectedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
				selectedFile.type === "application/vnd.ms-excel" ||
				selectedFile.name.endsWith(".xlsx") ||
				selectedFile.name.endsWith(".xls")
			) {
				setFile(selectedFile)
				setError(null)
			} else {
				setFile(null)
				setError("Пожалуйста, выберите файл Excel (.xlsx или .xls)")
			}
		}
	}

	// Форматирование дат обходов
	const formatRoundDates = () => {
		let result = ""

		for (const round of rounds) {
			if (round.type === "date") {
				if (round.date) {
					const date = new Date(round.date)
					const formattedDate = `${date.getDate().toString().padStart(2, "0")}.${(date.getMonth() + 1).toString().padStart(2, "0")}.${date.getFullYear()}`
					result += `${formattedDate} (${round.startTime}-${round.endTime})`
				}
			} else {
				result += round.status === "cancelled" ? "Обход отменен" : "Обхода нет"
			}
			result += "\n"
		}

		return result.trim()
	}

	// Обработчик для вставки в поле даты ОСС
	const handleOssDatePaste = (e: React.ClipboardEvent<HTMLInputElement>, cartItemId?: string) => {
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

			if (cartItemId) {
				// Обновляем дату в корзине
				updateCartItem(cartItemId, "ossDate", formattedDate)
			} else {
				// Обновляем дату в основной форме
				setOssDate(formattedDate)
			}
		} else {
			// Если не соответствует, просто устанавливаем как есть
			if (cartItemId) {
				updateCartItem(cartItemId, "ossDate", pastedText)
			} else {
				setOssDate(pastedText)
			}
		}
	}

	// Обработчик для вставки в поля дат обходов
	const handleDatePaste = (e: React.ClipboardEvent<HTMLInputElement>, setDateFunc: (value: string) => void) => {
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
			setDateFunc(formattedDate)
		} else {
			// Если не соответствует, просто устанавливаем как есть
			setDateFunc(pastedText)
		}
	}

	// Функция для форматирования дат обходов для конкретного элемента
	const formatRoundDatesForItem = (item: CartItem) => {
		let result = ""

		for (const round of item.rounds) {
			if (round.type === "date") {
				if (round.date) {
					const date = new Date(round.date)
					const formattedDate = `${date.getDate().toString().padStart(2, "0")}.${(date.getMonth() + 1).toString().padStart(2, "0")}.${date.getFullYear()}`
					result += `${formattedDate} (${round.startTime}-${round.endTime})`
				}
			} else {
				result += round.status === "cancelled" ? "Обход отменен" : "Обхода нет"
			}
			result += "\n"
		}

		return result.trim()
	}

	// Обработка всей корзины
	const processCart = async () => {
		if (cart.length === 0) {
			setError("Корзина пуста. Добавьте файлы для обработки")
			return
		}

		// Фильтруем только элементы с файлами
		const itemsWithFiles = cart.filter(item => item.file !== null)

		if (itemsWithFiles.length === 0) {
			setError("В корзине нет файлов для обработки. Добавьте файлы к адресам.")
			return
		}

		setProcessing(true)
		setError(null)

		try {
			let allProcessedData: any[] = []
			let isFirstFile = true

			for (const item of itemsWithFiles) {
				// Чтение файла (теперь item.file точно не null)
				const data = await readFileAsync(item.file!)
				const workbook = XLSX.read(data, { type: "array" })

				// Получаем первый лист
				const firstSheetName = workbook.SheetNames[0]
				const worksheet = workbook.Sheets[firstSheetName]

				// Преобразуем в JSON для обработки
				const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: "A", defval: "" })

				// Удаляем ДВЕ строки заголовков из исходного файла (основную + подзаголовки)
				jsonData.shift() // Удаляем первую строку
				jsonData.shift() // Удаляем вторую строку

				// Фильтруем данные
				const filteredData = jsonData.filter((row: any) => {
					// Проверяем условия фильтрации
					return !(
						row["G"] === "Нет" ||
						row["G"] === "-" ||
						row["G"] === "" ||
						row["H"] === "-" ||
						row["H"] === "" ||
						(row["A"] && row["A"].toString().includes("Участвовал"))
					)
				})

				// Преобразуем столбец C в числа
				filteredData.forEach((row: any) => {
					if (row["C"] && !isNaN(Number(row["C"]))) {
						row["C"] = Number(row["C"])
					}
				})

				// Очищаем и преобразуем телефонные номера в столбце H
				filteredData.forEach((row: any) => {
					if (row["H"]) {
						// Удаляем все нецифровые символы
						const phoneNumber = cleanPhoneNumber(row["H"].toString())

						// Если номер не пустой, сохраняем его обратно
						if (phoneNumber.length > 0) {
							row["H"] = !isNaN(Number(phoneNumber)) ? Number(phoneNumber) : phoneNumber
						}
					}
				})

				// Форматируем даты обходов для текущего элемента
				const roundDatesFormatted = formatRoundDatesForItem(item)

				// Создаем новый массив данных с нужными столбцами (БЕЗ заголовков)
				const processedData = filteredData.map((row: any) => {
					return {
						// Столбцы A, B, C, D заполняем значениями из элемента корзины
						A: item.address,
						B: item.district,
						C: item.ossNumber,
						D: item.ossDate,
						// Столбцы E, F, G берем из C, E, H исходной таблицы
						E: row["C"],
						F: row["E"],
						G: row["H"],
						// Столбец H заполняем датами обходов
						H: roundDatesFormatted,
					}
				})

				// Добавляем заголовки только для первого файла (одну строку)
				if (isFirstFile) {
					allProcessedData.push({
						A: "Адрес",
						B: "Округ",
						C: "Номер ОСС",
						D: "Дата ОСС",
						E: "Квартира",
						F: "ФИО",
						G: "Телефон",
						H: "Даты обходов",
					})
					isFirstFile = false
				}

				// Добавляем обработанные данные к общему массиву
				allProcessedData = allProcessedData.concat(processedData)
			}

			// Создаем новый лист
			const newWorksheet = XLSX.utils.json_to_sheet(allProcessedData, { skipHeader: true })

			// Создаем новую книгу
			const newWorkbook = XLSX.utils.book_new()
			XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "Обработанные данные")

			// Экспортируем файл через браузерный API
			const excelBuffer = XLSX.write(newWorkbook, { bookType: "xlsx", type: "array" })
			const blob = new Blob([excelBuffer], {
				type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			})
			const url = URL.createObjectURL(blob)

			// Создаем ссылку для скачивания
			const a = document.createElement("a")
			a.href = url
			a.download = `Обработанные_данные_${cart.length}_адресов.xlsx`
			document.body.appendChild(a)
			a.click()

			// Очищаем ресурсы
			setTimeout(() => {
				document.body.removeChild(a)
				URL.revokeObjectURL(url)
			}, 0)

			toast({
				title: "Обработка завершена",
				description: `Файл с данными ${cart.length} адресов успешно обработан и скачан`,
			})

			// Корзина НЕ очищается автоматически - только кнопкой сброса
		} catch (err) {
			console.error("Ошибка при обработке файлов:", err)
			setError("Произошла ошибка при обработке файлов. Проверьте формат и структуру файлов.")
		} finally {
			setProcessing(false)
		}
	}

	const processExcel = async () => {
		if (!file) {
			setError("Пожалуйста, выберите файл Excel для обработки")
			return
		}

		if (!address || !district || !ossNumber || !ossDate) {
			setError("Пожалуйста, заполните все обязательные поля")
			return
		}

		// Проверяем, что все обходы заполнены корректно
		for (const round of rounds) {
			if (round.type === "date" && !round.date) {
				setError("Пожалуйста, укажите дату для всех обходов или выберите статус")
				return
			}
		}

		setProcessing(true)
		setError(null)

		try {
			// Чтение файла
			const data = await readFileAsync(file)
			const workbook = XLSX.read(data, { type: "array" })

			// Получаем первый лист
			const firstSheetName = workbook.SheetNames[0]
			const worksheet = workbook.Sheets[firstSheetName]

			// Преобразуем в JSON для обработки
			const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: "A", defval: "" })

			// Удаляем ДВЕ строки заголовков (основную + подзаголовки)
			jsonData.shift() // Удаляем первую строку
			jsonData.shift() // Удаляем вторую строку

			// Фильтруем данные
			const filteredData = jsonData.filter((row: any) => {
				// Проверяем условия фильтрации
				return !(
					row["G"] === "Нет" ||
					row["G"] === "-" ||
					row["G"] === "" ||
					row["H"] === "-" ||
					row["H"] === "" ||
					(row["A"] && row["A"].toString().includes("Участвовал"))
				)
			})

			// Преобразуем столбец C в числа
			filteredData.forEach((row: any) => {
				if (row["C"] && !isNaN(Number(row["C"]))) {
					row["C"] = Number(row["C"])
				}
			})

			// Очищаем и преобразуем телефонные номера в столбце H
			filteredData.forEach((row: any) => {
				if (row["H"]) {
					// Удаляем все нецифровые символы
					const phoneNumber = cleanPhoneNumber(row["H"].toString())

					// Если номер не пустой, сохраняем его обратно
					if (phoneNumber.length > 0) {
						row["H"] = !isNaN(Number(phoneNumber)) ? Number(phoneNumber) : phoneNumber
					}
				}
			})

			// Форматируем даты обходов
			const roundDatesFormatted = formatRoundDates()

			// Создаем новый массив данных с нужными столбцами
			const processedData = filteredData.map((row: any) => {
				return {
					// Столбцы A, B, C, D заполняем значениями из формы
					A: address,
					B: district,
					C: ossNumber,
					D: ossDate,
					// Столбцы E, F, G берем из C, E, H исходной таблицы
					E: row["C"],
					F: row["E"],
					G: row["H"],
					// Столбец H заполняем датами обходов
					H: roundDatesFormatted,
				}
			})

			// Добавляем заголовки (одну строку)
			processedData.unshift({
				A: "Адрес",
				B: "Округ",
				C: "Номер ОСС",
				D: "Дата ОСС",
				E: "Квартира",
				F: "ФИО",
				G: "Телефон",
				H: "Даты обходов",
			})

			// Создаем новый лист
			const newWorksheet = XLSX.utils.json_to_sheet(processedData, { skipHeader: true })

			// Создаем новую книгу
			const newWorkbook = XLSX.utils.book_new()
			XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "Обработанные данные")

			// Экспортируем файл через браузерный API
			const excelBuffer = XLSX.write(newWorkbook, { bookType: "xlsx", type: "array" })
			const blob = new Blob([excelBuffer], {
				type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			})
			const url = URL.createObjectURL(blob)

			// Создаем ссылку для скачивания
			const a = document.createElement("a")
			a.href = url
			a.download = "Обработанные_данные.xlsx"
			document.body.appendChild(a)
			a.click()

			// Очищаем ресурсы
			setTimeout(() => {
				document.body.removeChild(a)
				URL.revokeObjectURL(url)
			}, 0)

			toast({
				title: "Обработка завершена",
				description: "Файл успешно обработан и скачан",
			})
		} catch (err) {
			console.error("Ошибка при обработке файла:", err)
			setError("Произошла ошибка при обработке файла. Проверьте формат и структуру файла.")
		} finally {
			setProcessing(false)
		}
	}

	// Функция для чтения файла как ArrayBuffer
	const readFileAsync = (file: File): Promise<ArrayBuffer> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader()
			reader.onload = (e) => {
				if (e.target?.result) {
					resolve(e.target.result as ArrayBuffer)
				} else {
					reject(new Error("Ошибка чтения файла"))
				}
			}
			reader.onerror = (e) => reject(e)
			reader.readAsArrayBuffer(file)
		})
	}

	// Функция для очистки телефонного номера от нецифровых символов
	const cleanPhoneNumber = (phoneStr: string): string => {
		// Удаляем все нецифровые символы
		let cleanPhone = phoneStr.replace(/\D/g, "")

		// Если номер начинается с 7, убираем её
		if (cleanPhone.startsWith("7")) {
			cleanPhone = cleanPhone.substring(1)
		}

		return cleanPhone
	}

	return (
		<Card className="glass-card card-hover shadow-lg">
			<CardHeader>
				<div className="flex items-center gap-2">
					<Table className="h-5 w-5 text-primary" />
					<CardTitle>Обработка Excel-таблиц</CardTitle>
				</div>
				<CardDescription>Загрузите Excel-файл и заполните данные для обработки</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<Tabs defaultValue="data" className="w-full">
					{/* Обновим стиль TabsList в компоненте ExcelProcessor */}
					<TabsList className="mb-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-1.5 rounded-lg shadow-sm">
						<TabsTrigger value="data" className="rounded-md px-4 py-2 relative">
							Данные для обработки
							<div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full scale-x-0 transition-transform duration-300 data-[state=active]:scale-x-100"></div>
						</TabsTrigger>
						<TabsTrigger value="file" className="rounded-md px-4 py-2 relative">
							Загрузка файла
							<div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full scale-x-0 transition-transform duration-300 data-[state=active]:scale-x-100"></div>
						</TabsTrigger>
						<TabsTrigger value="cart" className="rounded-md px-4 py-2 relative">
							<div className="flex items-center gap-2">
								<ShoppingCart className="h-4 w-4" />
								Корзина
								{cart.length > 0 && (
									<Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
										{cart.length}
									</Badge>
								)}
							</div>
							<div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full scale-x-0 transition-transform duration-300 data-[state=active]:scale-x-100"></div>
						</TabsTrigger>
					</TabsList>

					<TabsContent value="data" className="space-y-4 animate-fade-in">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="address">Адрес дома *</Label>
								<Input
									id="address"
									value={address}
									onChange={(e) => setAddress(e.target.value)}
									placeholder="Например: ул. Ленина, д. 10"
									className="bg-white dark:bg-gray-800"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="district">Округ *</Label>
								<Select value={district} onValueChange={setDistrict}>
									<SelectTrigger id="district" className="bg-white dark:bg-gray-800">
										<SelectValue placeholder="Выберите округ" />
									</SelectTrigger>
									<SelectContent>
										{DISTRICTS.map((districtOption) => (
											<SelectItem key={districtOption} value={districtOption}>
												{districtOption}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="ossNumber">Номер ОСС *</Label>
								<Input
									id="ossNumber"
									value={ossNumber}
									onChange={(e) => setOssNumber(e.target.value)}
									placeholder="Например: 12345"
									className="bg-white dark:bg-gray-800"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="ossDate">Дата завершения ОСС *</Label>
								<Input
									id="ossDate"
									type="date"
									value={ossDate}
									onChange={(e) => setOssDate(e.target.value)}
									onPaste={handleOssDatePaste}
									className="bg-white dark:bg-gray-800"
									placeholder="Выберите дату"
								/>
							</div>
						</div>

						<Separator className="my-4" />

						<div className="space-y-4">
							<h3 className="font-medium">Даты обходов</h3>

							{rounds.map((round, index) => (
								<div key={round.id} className="border p-4 rounded-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
									<div className="flex items-center justify-between mb-3">
										<h4 className="text-sm font-medium">{getOrdinalNumber(index)} обход {index === 0 ? "*" : ""}</h4>
										{rounds.length > 1 && (
											<Button
												onClick={() => removeRound(round.id)}
												variant="outline"
												size="sm"
												className="text-red-600 hover:text-red-700"
											>
												<Trash2 className="h-4 w-4" />
												Удалить
											</Button>
										)}
									</div>

									<RadioGroup value={round.type} onValueChange={(value) => updateRound(round.id, "type", value)} className="mb-4">
										<div className="flex items-center space-x-2">
											<RadioGroupItem value="date" id={`round-${round.id}-date`} />
											<Label htmlFor={`round-${round.id}-date`}>Указать дату и время</Label>
										</div>
										<div className="flex items-center space-x-2">
											<RadioGroupItem value="status" id={`round-${round.id}-status`} />
											<Label htmlFor={`round-${round.id}-status`}>Указать статус</Label>
										</div>
									</RadioGroup>

									{round.type === "date" ? (
										<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
											<div className="space-y-2">
												<Label htmlFor={`round-${round.id}-date-input`}>Дата</Label>
												<Input
													id={`round-${round.id}-date-input`}
													type="date"
													value={round.date}
													onChange={(e) => updateRound(round.id, "date", e.target.value)}
													onPaste={(e) => handleDatePaste(e, (value) => updateRound(round.id, "date", value))}
													className="bg-white dark:bg-gray-800"
												/>
											</div>

											<div className="space-y-2">
												<Label htmlFor={`round-${round.id}-start-time`}>Время начала</Label>
												<Input
													id={`round-${round.id}-start-time`}
													type="time"
													value={round.startTime}
													onChange={(e) => updateRound(round.id, "startTime", e.target.value)}
													className="bg-white dark:bg-gray-800"
												/>
											</div>

											<div className="space-y-2">
												<Label htmlFor={`round-${round.id}-end-time`}>Время окончания</Label>
												<Input
													id={`round-${round.id}-end-time`}
													type="time"
													value={round.endTime}
													onChange={(e) => updateRound(round.id, "endTime", e.target.value)}
													className="bg-white dark:bg-gray-800"
												/>
											</div>
										</div>
									) : (
										<div className="space-y-2">
											<Label htmlFor={`round-${round.id}-status-select`}>Статус</Label>
											<Select value={round.status} onValueChange={(value) => updateRound(round.id, "status", value)}>
												<SelectTrigger id={`round-${round.id}-status-select`} className="bg-white dark:bg-gray-800">
													<SelectValue placeholder="Выберите статус" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="cancelled">Обход отменен</SelectItem>
													<SelectItem value="none">Обхода нет</SelectItem>
												</SelectContent>
											</Select>
										</div>
									)}
								</div>
							))}

							<Button
								onClick={addRound}
								variant="outline"
								size="sm"
								className="w-full"
							>
								<Plus className="h-4 w-4 mr-2" />
								Добавить обход
							</Button>

							<div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-3 rounded-md text-sm text-muted-foreground">
								<p>
									Примеры форматирования: <br />
									<span className="font-mono">
										10.02.2025 (18:00-20:30)
										<br />
										Обход отменен
										<br />
										Обхода нет
									</span>
								</p>
							</div>
						</div>
					</TabsContent>

					<TabsContent value="file" className="space-y-4 animate-fade-in">
						<div className="space-y-2">
							<Label htmlFor="excel-file">Выберите Excel-файл</Label>
							<div className="flex items-center gap-2">
								<Input
									id="excel-file"
									type="file"
									accept=".xlsx,.xls"
									onChange={handleFileChange}
									disabled={processing}
									className="flex-1 bg-white dark:bg-gray-800"
								/>
								<Button
									variant="outline"
									size="icon"
									onClick={() => document.getElementById("excel-file")?.click()}
									disabled={processing}
									className="rounded-full"
								>
									<Upload className="h-4 w-4" />
								</Button>
							</div>
							{file && (
								<p className="text-sm text-muted-foreground flex items-center gap-2 p-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-md">
									<FileSpreadsheet className="h-4 w-4 text-green-500" />
									{file.name} ({(file.size / 1024).toFixed(1)} KB)
								</p>
							)}
						</div>

						<div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-4 rounded-md">
							<h3 className="font-medium mb-2">Что делает обработчик:</h3>
							<ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
								<li>Фильтрует строки по заданным условиям</li>
								<li>Очищает и форматирует телефонные номера</li>
								<li>Преобразует числовые значения</li>
								<li>Реорганизует структуру таблицы</li>
								<li>Создает новый Excel-файл с обработанными данными</li>
							</ul>
						</div>
					</TabsContent>

					<TabsContent value="cart" className="space-y-4 animate-fade-in">
						<div className="flex items-center justify-between">
							<h3 className="font-medium">
								Адреса в корзине ({cart.length})
								{cart.filter(item => item.file !== null).length > 0 && (
									<span className="text-sm text-muted-foreground ml-2">
										• {cart.filter(item => item.file !== null).length} с файлами
									</span>
								)}
							</h3>
							{cart.length > 0 && (
								<Button onClick={clearCart} variant="outline" size="sm">
									<Trash2 className="h-4 w-4 mr-2" />
									Очистить корзину
								</Button>
							)}
						</div>

						{cart.length === 0 ? (
							<div className="text-center py-8 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-md">
								<ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
								<p className="text-muted-foreground">Корзина пуста</p>
								<p className="text-sm text-muted-foreground">Добавьте файлы через вкладки "Данные для обработки" и "Загрузка файла"</p>
							</div>
						) : (
							<div className="space-y-3">
								{cart.map((item, index) => (
									<div key={item.id} className="border p-4 rounded-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
										<div className="flex items-start justify-between">
											<div className="flex-1">
												{editingItems.has(item.id) ? (
													// Режим редактирования
													<div>
														<div className="flex items-center gap-2 mb-3">
															<Badge variant="outline">#{index + 1}</Badge>
															<span className="font-medium">Редактирование адреса</span>
														</div>
														<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
															<div className="space-y-3">
																<div className="space-y-1">
																	<Label htmlFor={`address-${item.id}`} className="text-sm font-medium">Адрес</Label>
																	<Input
																		id={`address-${item.id}`}
																		value={item.address}
																		onChange={(e) => updateCartItem(item.id, "address", e.target.value)}
																		placeholder="Введите адрес"
																		className="text-sm"
																	/>
																</div>
																<div className="space-y-1">
																	<Label htmlFor={`district-${item.id}`} className="text-sm font-medium">Район</Label>
																	<Select value={item.district} onValueChange={(value) => updateCartItem(item.id, "district", value)}>
																		<SelectTrigger id={`district-${item.id}`} className="text-sm">
																			<SelectValue placeholder="Выберите район" />
																		</SelectTrigger>
																		<SelectContent>
																			{DISTRICTS.map(district => (
																				<SelectItem key={district} value={district}>{district}</SelectItem>
																			))}
																		</SelectContent>
																	</Select>
																</div>
																<div className="space-y-1">
																	<Label htmlFor={`ossNumber-${item.id}`} className="text-sm font-medium">Номер ОСС</Label>
																	<Input
																		id={`ossNumber-${item.id}`}
																		value={item.ossNumber}
																		onChange={(e) => updateCartItem(item.id, "ossNumber", e.target.value)}
																		placeholder="Введите номер ОСС"
																		className="text-sm"
																	/>
																</div>
																<div className="space-y-1">
																	<Label htmlFor={`ossDate-${item.id}`} className="text-sm font-medium">Дата завершения ОСС</Label>
																	<Input
																		id={`ossDate-${item.id}`}
																		type="date"
																		value={item.ossDate}
																		onChange={(e) => updateCartItem(item.id, "ossDate", e.target.value)}
																		className="text-sm"
																	/>
																</div>
																<div className="flex items-center gap-2">
																	<span className="font-medium text-sm">Файл:</span>
																	{item.file ? (
																		<div className="flex items-center gap-2">
																			<div className="flex items-center gap-1">
																				<div className="w-2 h-2 rounded-full bg-green-500"></div>
																				<span className="text-sm text-green-700 dark:text-green-400">{item.file.name}</span>
																			</div>
																		</div>
																	) : (
																		<span className="text-muted-foreground italic text-sm">Не выбран</span>
																	)}
																</div>
															</div>
															<div>
																<div className="flex items-center justify-between mb-2">
																	<div className="font-medium text-sm">Обходы ({item.rounds.length})</div>
																	<Button
																		onClick={() => addRoundToCartItem(item.id)}
																		variant="outline"
																		size="sm"
																		className="text-xs"
																	>
																		<Plus className="h-3 w-3 mr-1" />
																		Добавить
																	</Button>
																</div>
																<div className="space-y-2">
																	{item.rounds.map((round, roundIndex) => (
																		<div key={round.id} className="border rounded-lg p-2 bg-gray-50 dark:bg-gray-800">
																			<div className="flex items-center justify-between mb-2">
																				<span className="font-medium text-xs">{getOrdinalNumber(roundIndex)} обход</span>
																				{item.rounds.length > 1 && (
																					<Button
																						onClick={() => removeRoundFromCartItem(item.id, round.id)}
																						variant="outline"
																						size="sm"
																						className="text-xs text-red-600 hover:text-red-700 h-6 w-6 p-0"
																					>
																						<X className="h-3 w-3" />
																					</Button>
																				)}
																			</div>
																			<div className="space-y-2">
																				<RadioGroup
																					value={round.type}
																					onValueChange={(value) => updateCartItemRound(item.id, round.id, "type", value)}
																					className="flex gap-3"
																				>
																					<div className="flex items-center space-x-1">
																						<RadioGroupItem value="date" id={`date-${item.id}-${round.id}`} />
																						<Label htmlFor={`date-${item.id}-${round.id}`} className="text-xs">Дата</Label>
																					</div>
																					<div className="flex items-center space-x-1">
																						<RadioGroupItem value="status" id={`status-${item.id}-${round.id}`} />
																						<Label htmlFor={`status-${item.id}-${round.id}`} className="text-xs">Статус</Label>
																					</div>
																				</RadioGroup>

																				{round.type === "date" ? (
																					<div className="grid grid-cols-3 gap-1">
																						<div>
																							<Label htmlFor={`round-date-${item.id}-${round.id}`} className="text-xs">Дата</Label>
																							<Input
																								id={`round-date-${item.id}-${round.id}`}
																								type="date"
																								value={round.date}
																								onChange={(e) => updateCartItemRound(item.id, round.id, "date", e.target.value)}
																								className="text-xs h-8"
																							/>
																						</div>
																						<div>
																							<Label htmlFor={`round-start-${item.id}-${round.id}`} className="text-xs">Начало</Label>
																							<Input
																								id={`round-start-${item.id}-${round.id}`}
																								type="time"
																								value={round.startTime}
																								onChange={(e) => updateCartItemRound(item.id, round.id, "startTime", e.target.value)}
																								className="text-xs h-8"
																							/>
																						</div>
																						<div>
																							<Label htmlFor={`round-end-${item.id}-${round.id}`} className="text-xs">Окончание</Label>
																							<Input
																								id={`round-end-${item.id}-${round.id}`}
																								type="time"
																								value={round.endTime}
																								onChange={(e) => updateCartItemRound(item.id, round.id, "endTime", e.target.value)}
																								className="text-xs h-8"
																							/>
																						</div>
																					</div>
																				) : (
																					<div>
																						<Label htmlFor={`round-status-${item.id}-${round.id}`} className="text-xs">Статус</Label>
																						<Select value={round.status} onValueChange={(value) => updateCartItemRound(item.id, round.id, "status", value)}>
																							<SelectTrigger id={`round-status-${item.id}-${round.id}`} className="text-xs h-8">
																								<SelectValue />
																							</SelectTrigger>
																							<SelectContent>
																								<SelectItem value="cancelled">Отменен</SelectItem>
																								<SelectItem value="none">Не проводится</SelectItem>
																							</SelectContent>
																						</Select>
																					</div>
																				)}
																			</div>
																		</div>
																	))}
																</div>
															</div>
														</div>
													</div>
												) : (
													// Режим просмотра
													<div>
														<div className="flex items-center gap-2 mb-2">
															<Badge variant="outline">#{index + 1}</Badge>
															<h4 className="font-medium text-lg">{item.address}</h4>
															{item.file && (
																<div className="flex items-center gap-1 ml-2">
																	<div className="w-2 h-2 rounded-full bg-green-500"></div>
																	<span className="text-xs text-green-700 dark:text-green-400 font-medium">Файл загружен</span>
																</div>
															)}
														</div>
														<div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
															<div>
																<span className="font-medium">Округ:</span> {item.district}
															</div>
															<div>
																<span className="font-medium">ОСС:</span> {item.ossNumber}
															</div>
															<div>
																<span className="font-medium">Дата завершения:</span> {item.ossDate}
															</div>
															<div className="flex items-center gap-2">
																<span className="font-medium">Файл:</span>
																{item.file ? (
																	<div className="flex items-center gap-2">
																		<div className="flex items-center gap-1">
																			<div className="w-2 h-2 rounded-full bg-green-500"></div>
																			<span className="text-green-700 dark:text-green-400 font-medium">{item.file.name}</span>
																		</div>
																	</div>
																) : (
																	<span className="text-muted-foreground italic">Не выбран</span>
																)}
															</div>
														</div>
														<div className="mt-2 text-sm">
															<span className="font-medium">Обходы:</span>
															<div className="whitespace-pre-line text-muted-foreground">
																{formatRoundDatesForItem(item)}
															</div>
														</div>
													</div>
												)}
											</div>
											<div className="flex gap-2 ml-4">
												{editingItems.has(item.id) ? (
													// Кнопки в режиме редактирования
													<>
														<Button
															variant="outline"
															size="sm"
															onClick={() => exitEditMode(item.id)}
															className="text-green-600 hover:text-green-700"
															title="Сохранить изменения"
														>
															✓
														</Button>
														<Button
															variant="outline"
															size="sm"
															onClick={() => exitEditMode(item.id)}
															className="text-gray-600 hover:text-gray-700"
															title="Отменить изменения"
														>
															✕
														</Button>
													</>
												) : (
													// Кнопки в режиме просмотра
													<>
														{!item.file ? (
															<div>
																<input
																	type="file"
																	accept=".xlsx,.xls"
																	id={`file-upload-${item.id}`}
																	className="hidden"
																	onChange={(e) => {
																		if (e.target.files && e.target.files[0]) {
																			const newFile = e.target.files[0]
																			setCart(prev => prev.map(cartItem =>
																				cartItem.id === item.id
																					? { ...cartItem, file: newFile }
																					: cartItem
																			))
																			toast({
																				title: "Файл добавлен",
																				description: `Файл для адреса "${item.address}" добавлен`,
																			})
																		}
																	}}
																/>
																<Button
																	variant="outline"
																	size="sm"
																	onClick={() => document.getElementById(`file-upload-${item.id}`)?.click()}
																	className="text-blue-600 hover:text-blue-700"
																	title="Выбрать файл"
																>
																	<Upload className="h-4 w-4" />
																</Button>
															</div>
														) : (
															<Button
																variant="outline"
																size="sm"
																onClick={() => {
																	setCart(prev => prev.map(cartItem =>
																		cartItem.id === item.id
																			? { ...cartItem, file: null }
																			: cartItem
																	))
																	toast({
																		title: "Файл удален",
																		description: `Файл для адреса "${item.address}" удален`,
																	})
																}}
																className="text-red-600 hover:text-red-700"
																title="Удалить файл"
															>
																<X className="h-4 w-4" />
															</Button>
														)}
														<Button
															variant="outline"
															size="sm"
															onClick={() => toggleEditMode(item.id)}
															className="text-blue-600 hover:text-blue-700"
															title="Редактировать"
														>
															✏️
														</Button>
														<Button
															onClick={() => removeFromCart(item.id)}
															variant="outline"
															size="sm"
															className="text-red-600 hover:text-red-700"
															title="Удалить из корзины"
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													</>
												)}
											</div>
										</div>
									</div>
								))}

								<div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-4 rounded-md">
									<h4 className="font-medium mb-2">Как работает корзина:</h4>
									<ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
										<li>Адреса сохраняются между вкладками</li>
										<li>Файлы добавляются прямо в корзине перед обработкой</li>
										<li>При обработке данные объединятся в один Excel файл</li>
										<li>Корзина очищается только кнопкой "Очистить корзину"</li>
									</ul>
									{cart.some(item => item.file !== null) && (
										<div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-yellow-800 dark:text-yellow-200 text-xs">
											⚠️ При переходе на другие вкладки загруженные файлы будут сброшены
										</div>
									)}
								</div>
							</div>
						)}
					</TabsContent>
				</Tabs>

				{error && (
					<Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 backdrop-blur-sm">
						<AlertCircle className="h-4 w-4" />
						<AlertTitle>Ошибка</AlertTitle>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}
			</CardContent>
			<CardFooter className="flex gap-2 justify-between">
				<Button onClick={resetForm} variant="outline" disabled={processing}>
					Сбросить всё
				</Button>
				<div className="flex gap-2">
					<Button
						onClick={addToCart}
						variant="outline"
						disabled={processing}
						className="flex items-center gap-2"
					>
						<Plus className="h-4 w-4" />
						Добавить в корзину
					</Button>
					<Button
						onClick={processExcel}
						disabled={!file || processing}
						className={file ? "gradient-bg border-0 text-white" : ""}
						variant={file ? "default" : "secondary"}
					>
						{processing ? "Обработка..." : "Обработать один файл"}
					</Button>
					<Button
						onClick={processCart}
						disabled={cart.filter(item => item.file !== null).length === 0 || processing}
						className="gradient-bg border-0 flex items-center gap-2"
					>
						<Download className="h-4 w-4" />
						{processing ? "Обработка..." : `Обработать корзину (${cart.filter(item => item.file !== null).length})`}
					</Button>
				</div>
			</CardFooter>
		</Card>
	)
}
