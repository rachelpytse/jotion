"use client"

import { useEffect, useState } from "react"

import { SettingsModal } from "../modals/settings-modal"

export const ModalProvider = () => {
    const [isMounted, setIsMounted] = useState(false)

    //none of the modals are going to be rendered unless we are fully on the client side
    //on the server side we are not goint to render any modals
    useEffect(() => {
        setIsMounted(true)
    }, [])

    if(!isMounted) {
        return null
    }

    return(
        <>
            <SettingsModal/>
        </>
    )
}