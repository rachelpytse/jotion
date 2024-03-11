import { useEffect, useState } from "react";

export const useOrigin = () => {
    //because we use window object that could cause hydration error when rendering
    const [mounted, setMounted] = useState(false)
    //check the type of window that it is not undefined
    const origin = typeof window !== "undefined" && window.location.origin ? window.location.origin : ""

    useEffect(() => {
        setMounted(true)
    }, [])

    if(!mounted) {
        return ""
    }

    return origin
}