"use client"

import { createContext, useState, useEffect, type ReactNode } from "react"
import type { AddressItem } from "@/components/chat-message-generator"

type ChatMessageContextType = {
  addresses: AddressItem[]
  addAddressToChat: (address: AddressItem) => void
  removeAddressFromChat: (id: string) => void
  clearAddresses: () => void
}

export const ChatMessageContext = createContext<ChatMessageContextType>({
  addresses: [],
  addAddressToChat: () => {},
  removeAddressFromChat: () => {},
  clearAddresses: () => {},
})

export const ChatMessageProvider = ({ children }: { children: ReactNode }) => {
  const [addresses, setAddresses] = useState<AddressItem[]>([])

  // Загрузка адресов из localStorage при монтировании компонента
  useEffect(() => {
    const savedAddresses = localStorage.getItem("chatAddresses")
    if (savedAddresses) {
      try {
        setAddresses(JSON.parse(savedAddresses))
      } catch (e) {
        console.error("Ошибка при загрузке адресов из localStorage:", e)
      }
    }
  }, [])

  // Сохранение адресов в localStorage при изменении
  useEffect(() => {
    localStorage.setItem("chatAddresses", JSON.stringify(addresses))
  }, [addresses])

  const addAddressToChat = (address: AddressItem) => {
    // Проверяем, не добавлен ли уже этот адрес
    const exists = addresses.some((addr) => addr.id === address.id)
    if (!exists) {
      setAddresses((prev) => [...prev, address])
    }
  }

  const removeAddressFromChat = (id: string) => {
    setAddresses((prev) => prev.filter((addr) => addr.id !== id))
  }

  const clearAddresses = () => {
    setAddresses([])
  }

  return (
    <ChatMessageContext.Provider
      value={{
        addresses,
        addAddressToChat,
        removeAddressFromChat,
        clearAddresses,
      }}
    >
      {children}
    </ChatMessageContext.Provider>
  )
}
