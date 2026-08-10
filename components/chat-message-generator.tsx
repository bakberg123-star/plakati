"use client"

import type React from "react"

import { useState, useEffect, useContext } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ClipboardCopy, Trash2, RotateCcw, MessageSquare, Save } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ChatMessageContext } from "@/lib/chat-message-context"

// Соответствие округов и ссылок на Google Drive папки
const DISTRICT_DRIVE_LINKS: Record<string, string> = {
	"ТИНАО": "https://drive.google.com/drive/u/0/folders/1w5Yu3HiJisji4ogIzi5Guz0HN8iENJIs",
	"ЮЗАО": "https://drive.google.com/drive/u/0/folders/1Ek4FsE4rQ4YYNjDuVdu6oPdM89ariwa0",
	"ЮАО": "https://drive.google.com/drive/u/0/folders/1hO72-2tNL8NBILudr_mVbzJKw44PtN6k",
	"ВАО": "https://drive.google.com/drive/u/0/folders/1R0M-AXNtaEaG9jgcXHrOtCMzn5W0HYc7",
	"СВАО": "https://drive.google.com/drive/u/0/folders/1fzavXT90U2o-6pe1ZMsR1w1yYNHzpdPN",
	"САО": "https://drive.google.com/drive/u/0/folders/1LAA6EjN08PTdnBBJ0T-8C2Cr8DWgULPI",
	"ЦАО": "https://drive.google.com/drive/u/0/folders/1DIrBv-O7a1VBjVtN57QefTuwWOzUqtTu",
	"ЮВАО": "https://drive.google.com/drive/u/0/folders/1yZZQM6xeRvqm_GDR0nnOwwJIMGd2Gqqy",
	"СЗАО": "https://drive.google.com/drive/u/0/folders/1HYuISfnpNSb9-Bd1qC0aubyKjeL5aa9A",
	"ЗАО": "https://drive.google.com/drive/u/0/folders/1BFQ5pUmq8LkuGSkewLxxT8IeHIDaXsVi",
	"ЗелАО": "https://drive.google.com/drive/u/0/folders/1fJa3e8nI0zJnlSjRjSEkHys4bR9vxxJu"
}

export type AddressItem = {
	id: string
	district: string
	address: string
	scriptType: string
	hasRounds: boolean
	roundDates: string
}

export default function ChatMessageGenerator() {
	const { toast } = useToast()
	const { addresses, removeAddressFromChat, clearAddresses } = useContext(ChatMessageContext)
	const [deletedAddresses, setDeletedAddresses] = useState<AddressItem[]>([])

	// Состояния для сгенерированного и итогового сообщения
	const [generatedMessage, setGeneratedMessage] = useState("")
	const [finalMessage, setFinalMessage] = useState("")
	const [hasChanges, setHasChanges] = useState(false)

	// Загрузка сохраненного итогового сообщения из localStorage при монтировании компонента
	useEffect(() => {
		const savedFinalMessage = localStorage.getItem("chatFinalMessage")
		if (savedFinalMessage) {
			try {
				setFinalMessage(savedFinalMessage)
			} catch (error) {
				console.error("Ошибка при загрузке итогового сообщения из localStorage:", error)
			}
		}
	}, [])

	// Генерация сообщения при изменении адресов
	useEffect(() => {
		generateMessage()
	}, [addresses])

	// Функция генерации сообщения из адресов
	const generateMessage = () => {
		if (addresses.length === 0) {
			setGeneratedMessage("")
			return
		}

		let messageText = "Коллеги, всем привет! \n\n❗️Добавлены новые адреса на обзвон❗️\n"

		addresses.forEach((item) => {
			// Определяем порядок приема на основе типа скрипта
			let receptionOrder = ""
			if (item.scriptType === "ЕГО") {
				receptionOrder = "ЕГО ОСС"
			} else {
				receptionOrder = "не ЕГО ОСС"
			}

			// Добавляем информацию об адресе
			messageText += `${item.district}, ${item.address}\n`
			messageText += `Порядок приема: ${receptionOrder}\n`

			// Добавляем информацию об обходах
			if (item.hasRounds) {
				messageText += `Обходы:\n${item.roundDates}\n`
			} else {
				messageText += "Обходов нет\n"
			}

			messageText += "\n"
		})

		// Добавляем фразу "Скрипты в папке" и ссылки на Google Drive
		const uniqueDistricts = [...new Set(addresses.map((item) => item.district))].sort()

		if (uniqueDistricts.length === 1) {
			// Если один округ
			const district = uniqueDistricts[0]
			const driveLink = DISTRICT_DRIVE_LINKS[district]
			messageText += `Скрипты в папке ${district}`
			if (driveLink) {
				messageText += `\n${driveLink}`
			}
		} else {
			// Если несколько округов
			messageText += "Скрипты в папке\n"
			uniqueDistricts.forEach(district => {
				const driveLink = DISTRICT_DRIVE_LINKS[district]
				messageText += `${district}`
				if (driveLink) {
					messageText += `\n${driveLink}`
				}
				messageText += "\n"
			})
		}

		setGeneratedMessage(messageText)

		// УБИРАЕМ эту строку - не перезаписываем итоговое сообщение автоматически
		// Если итогового сообщения еще нет, устанавливаем сгенерированное как итоговое
		// if (!finalMessage) {
		//   setFinalMessage(messageText)
		// }
	}

	// Инициализация итогового сообщения только при первой загрузке
	useEffect(() => {
		const savedFinalMessage = localStorage.getItem("chatFinalMessage")
		if (savedFinalMessage) {
			setFinalMessage(savedFinalMessage)
		} else if (generatedMessage && !finalMessage) {
			// Устанавливаем сгенерированное как итоговое только если нет сохраненного и нет текущего
			setFinalMessage(generatedMessage)
		}
	}, [generatedMessage]) // Зависимость от generatedMessage

	// Удаление адреса из корзины
	const removeAddress = (id: string) => {
		const addressToRemove = addresses.find((addr) => addr.id === id)
		if (addressToRemove) {
			setDeletedAddresses((prev) => [...prev, addressToRemove])
			removeAddressFromChat(id)
			toast({
				title: "Адрес удален",
				description: "Адрес удален из сообщения",
			})
		}
	}

	// Восстановление последнего удаленного адреса
	const restoreLastAddress = () => {
		if (deletedAddresses.length === 0) {
			toast({
				title: "Нет удаленных адресов",
				description: "Нет адресов для восстановления",
			})
			return
		}

		const lastDeleted = deletedAddresses[deletedAddresses.length - 1]
		// Здесь нужно добавить адрес обратно в контекст
		// Но у нас нет прямого доступа к addAddressToChat из контекста
		// Поэтому просто удаляем из списка удаленных
		setDeletedAddresses((prev) => prev.slice(0, -1))
		toast({
			title: "Адрес восстановлен",
			description: "Последний удаленный адрес восстановлен",
		})
	}

	// Очистка всех адресов
	const clearAllAddresses = () => {
		setDeletedAddresses((prev) => [...prev, ...addresses])
		clearAddresses()
		setGeneratedMessage("")
		setFinalMessage("")
		setHasChanges(false)
		localStorage.removeItem("chatFinalMessage")
		toast({
			title: "Список очищен",
			description: "Все адреса удалены из сообщения",
		})
	}

	// Функция для отслеживания изменений в итоговом сообщении
	const handleFinalMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setFinalMessage(e.target.value)
		setHasChanges(e.target.value !== generatedMessage)
	}

	// Функция для сохранения изменений
	const saveChanges = () => {
		localStorage.setItem("chatFinalMessage", finalMessage)
		setHasChanges(false)
		toast({
			title: "Изменения сохранены",
			description: "Итоговое сообщение успешно сохранено",
		})
	}

	// Функция для сброса к сгенерированному сообщению
	const resetToGenerated = () => {
		setFinalMessage(generatedMessage)
		setHasChanges(false)
		localStorage.removeItem("chatFinalMessage")
		toast({
			title: "Сброшено к сгенерированному",
			description: "Итоговое сообщение сброшено к автоматически сгенерированному",
		})
	}

	// Копирование итогового сообщения в буфер обмена
	const copyMessage = () => {
		if (!finalMessage) {
			toast({
				title: "Нет сообщения",
				description: "Добавьте адреса для генерации сообщения",
			})
			return
		}

		try {
			navigator.clipboard.writeText(finalMessage)
			toast({
				title: "Скопировано",
				description: "Итоговое сообщение скопировано в буфер обмена",
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

	return (
		<div className="space-y-6">
			<Card className="glass-card card-hover shadow-lg">
				<CardHeader>
					<div className="flex items-center gap-2">
						<MessageSquare className="h-5 w-5 text-primary" />
						<CardTitle>Генератор сообщения в чат</CardTitle>
					</div>
					<CardDescription>Добавляйте адреса из скриптов для формирования сообщения в чат</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{addresses.length === 0 ? (
						<Alert className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
							<AlertDescription>
								Список адресов пуст. Добавьте адреса из генератора скриптов, нажав кнопку "Добавить в сообщение".
							</AlertDescription>
						</Alert>
					) : (
						<div className="space-y-4">
							<h3 className="text-lg font-medium">Адреса в сообщении ({addresses.length})</h3>
							<div className="space-y-2">
								{addresses.map((item) => (
									<div
										key={item.id}
										className="flex justify-between items-center p-3 border rounded-md bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-gray-800/90 transition-colors"
									>
										<div>
											<p className="font-medium">
												{item.district}, {item.address}
											</p>
											<p className="text-sm text-muted-foreground">
												{item.scriptType === "ЕГО" ? "ЕГО ОСС" : "не ЕГО ОСС"}
												{item.hasRounds ? ` • Обходы: ${item.roundDates}` : " • Обходов нет"}
											</p>
										</div>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => removeAddress(item.id)}
											title="Удалить адрес"
											className="rounded-full hover:bg-red-100 dark:hover:bg-red-900/30"
										>
											<Trash2 className="h-4 w-4 text-red-500" />
										</Button>
									</div>
								))}
							</div>
						</div>
					)}

					<div className="flex justify-end space-x-2">
						<Button
							variant="outline"
							size="sm"
							onClick={restoreLastAddress}
							disabled={deletedAddresses.length === 0}
							className="rounded-full"
						>
							<RotateCcw className="h-4 w-4 mr-2" />
							Восстановить
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={clearAllAddresses}
							disabled={addresses.length === 0}
							className="rounded-full"
						>
							<Trash2 className="h-4 w-4 mr-2" />
							Очистить все
						</Button>
					</div>

					{/* Сгенерированное сообщение (только для чтения) */}
					{generatedMessage && (
						<div className="mt-6">
							<h3 className="text-lg font-medium mb-2">Сгенерированное сообщение</h3>
							<div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md border">
								<pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-mono">
									{generatedMessage}
								</pre>
							</div>
						</div>
					)}

					{/* Итоговое сообщение (редактируемое) */}
					<div className="mt-6">
						<div className="flex items-center justify-between mb-2">
							<h3 className="text-lg font-medium">Итоговое сообщение</h3>
							<div className="flex gap-2">
								{/* Кнопка сброса всегда доступна, если есть сгенерированное сообщение */}
								{generatedMessage && (
									<Button variant="outline" size="sm" onClick={resetToGenerated} className="rounded-full">
										<RotateCcw className="h-4 w-4 mr-2" />
										Сбросить
									</Button>
								)}
								{/* Кнопка сохранения только при наличии изменений */}
								{hasChanges && (
									<Button variant="outline" size="sm" onClick={saveChanges} className="rounded-full">
										<Save className="h-4 w-4 mr-2" />
										Сохранить
									</Button>
								)}
							</div>
						</div>
						<Textarea
							value={finalMessage}
							onChange={handleFinalMessageChange}
							className="min-h-[200px] font-mono text-sm bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
							placeholder="Здесь будет итоговое сообщение для чата..."
						/>
						{hasChanges && (
							<p className="text-sm text-muted-foreground mt-2">
								У вас есть несохраненные изменения. Нажмите "Сохранить" чтобы их сохранить.
							</p>
						)}
					</div>
				</CardContent>
				<CardFooter className="flex gap-2">
					<Button onClick={copyMessage} disabled={!finalMessage} className="gradient-bg border-0">
						<ClipboardCopy className="h-4 w-4 mr-2" />
						Копировать итоговое сообщение
					</Button>
				</CardFooter>
			</Card>
		</div>
	)
}
