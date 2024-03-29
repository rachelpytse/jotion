"use client"

import { toast } from "sonner"
import { ElementRef, useEffect, useRef, useState } from "react"
import { useMutation } from "convex/react"
import { useMediaQuery } from "usehooks-ts"
import { ChevronLeft, MenuIcon, Plus, PlusCircle, Search, Settings, Trash } from "lucide-react"
import { useParams, usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { api } from "@/convex/_generated/api"
import {
    Popover,
    PopoverTrigger,
    PopoverContent
} from "@/components/ui/popover"
import { useSearch } from "@/hooks/use-search"
import { useSettings } from "@/hooks/use-settings"
// not using tailwind breakpoint because it's complex especially the sidebar is resizable on drag
// use this to consider manually in javascript what is mobile and what is desktop
import { UserItem } from "./user-item"
import { Item } from "./item"
import { DocumentList } from "./document-list"
import { TrashBox } from "./trash-box"
import { Navbar } from "./navbar"

export const Navigation = () => {
    const router = useRouter()
    const settings = useSettings()
    const search = useSearch()
    // in mobile mode when user click on a specific document it will collapse the sidebar because the sidebar takes much space
    const pathname = usePathname()
    const params = useParams()
    const isMobile = useMediaQuery("(max-width: 768px)")
    const create = useMutation(api.documents.create)

    const isResizingRef = useRef(false)
    const sidebarRef = useRef<ElementRef<"aside">>(null)
    const navbarRef = useRef<ElementRef<"div">>(null)
    const [isResetting, setIsResetting] = useState(false)
    const [isCollaped, setIsCollapsed] = useState(isMobile)

    useEffect(() => {
        if(isMobile) {
            collapse()
        } else {
            resetWidth()
        }
        // no need to worry about the worry as we know it is going to work with ref
        // which are not react node useEffect expected
        // so we don't have to add resetWidth inside
    }, [isMobile])

    useEffect(() => {
        if(isMobile) {
            collapse()
        }
    }, [pathname, isMobile])

    const handleMouseDown = (
        event: React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
        event.preventDefault()
        event.stopPropagation()

        isResizingRef.current = true
        // resize sidebar
        document.addEventListener("mousemove", handleMouseMove)
        // stop resizing
        document.addEventListener("mouseup", handleMouseUp)
    }

    const handleMouseMove = (event: MouseEvent) => {
        if(!isResizingRef.current) return;
        let newWidth = event.clientX

        if(newWidth < 240) newWidth = 240
        if(newWidth > 480) newWidth = 480

        if(sidebarRef.current && navbarRef.current) {
            sidebarRef.current.style.width = `${newWidth}px`
            navbarRef.current.style.setProperty("left", `${newWidth}px`);
            navbarRef.current.style.setProperty("width", `calc(100% - ${newWidth}px)`);
        }
    }

    const handleMouseUp = () => {
        isResizingRef.current = false
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
    }

    //reset to 240px
    const resetWidth = () => {
        if(sidebarRef.current && navbarRef) {
            setIsCollapsed(false)
            setIsResetting(true)

            sidebarRef.current.style.width = isMobile ? "100%" : "240px";
            navbarRef.current!.style.setProperty("width", isMobile ? "0" : "calc(100%-240px")
            navbarRef.current!.style.setProperty("left", isMobile ? "100%": "240px")
            setTimeout(() => setIsResetting(false), 300)
        }
    }

    const collapse = () => {
        if(sidebarRef.current && navbarRef.current) {
            setIsCollapsed(true)
            setIsResetting(true)

            sidebarRef.current.style.width = "0"
            navbarRef.current.style.setProperty("width", "100%")
            navbarRef.current.style.setProperty("left", "0")
            setTimeout(() => setIsResetting(false), 300)
        }
    }

    const handleCreate = () => {
        const promise = create({title: "Untitled"})
            .then((documentId) => router.push(`/documents/${documentId}`))

        toast.promise(promise, {
            loading: "Creating a new note...",
            success: "New note created",
            error: "Failed to create a new note"
        })
    }


    return(
        <>
        {/* write sidebar for group because it helps to differnciate different groups */}
            <aside
                ref={sidebarRef}
                className={cn(
                    "group/sidebar h-full bg-secondary overflow-y-auto relative flex w-60 flex-col z-[99999]",
                    isResetting && "transition-all ease-in-out duration-300",
                    isMobile && "w-0"
                )}
            >
                <div
                    onClick={collapse}
                    role="button"
                    className={cn(
                        "h-6 w-6 text-muted-foreground rounded-sm hover:bg-neutral-300 dark:hover:bg-neutral-600 absolute top-3 right-2 opacity-0 group-hover/sidebar:opacity-100 transition",
                        isMobile && "opacity-100"
                    )}
                >
                    <ChevronLeft className="h-6 w-6"/>
                </div>
                <div>
                        <UserItem/>
                        <Item
                            label="Search"
                            icon={Search}
                            isSearch
                            onClick={search.onOpen}
                        />
                        <Item
                            label="Settings"
                            icon={Settings}
                            onClick={settings.onOpen}
                        />
                        <Item
                            onClick={handleCreate}
                            label="New page"
                            icon={PlusCircle}
                            />
                </div>
                <div className="mt-4">
                    <DocumentList/>
                    <Item
                        onClick={handleCreate}
                        icon={Plus}
                        label="Add a page"
                    />
                    <Popover>
                        <PopoverTrigger className="w-full mt-4">
                            <Item label="Trash" icon={Trash}/>
                        </PopoverTrigger>
                        <PopoverContent
                            className="p-0 w-72"
                            side={isMobile ? "bottom" : "right"}
                        >
                            <TrashBox/>
                        </PopoverContent>
                    </Popover>
                </div>
                {/* when hover the group it shows */}
                <div
                    onMouseDown={handleMouseDown}
                    onClick={resetWidth}
                    className="opacity-0 group-hover/sidebar:opacity-100 transition cursor-ew-resize absolute h-full w-1 bg-primary/10 right-0 top-0"
                />
            </aside>
            <div
             ref={navbarRef}
             className={cn(
                "absolute top-0 z-[99999] left-60 w-[calc(100%-240px)]",
                isResetting && "transition-all ease-in-out duration-300",
                isMobile && "left-0 w-full"
             )}
            >
                {!!params.documentId ? (
                    <Navbar
                        isCollapsed={isCollaped}
                        onResetWidth={resetWidth}
                    />
                ) : (
                    <nav className="bg-transparent px-3 py-2 w-full">
                        {isCollaped && <MenuIcon onClick={resetWidth} role="button" className="h-6 w-6 text-muted-foreground"/>}
                    </nav>
                )}
            </div>
        </>
    )
}