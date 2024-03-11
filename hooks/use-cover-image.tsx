import {create} from "zustand"

type CoverImageStore = {
    url?: string;
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    onReplace: (url: string) => void;
}

export const useCoverImage = create<CoverImageStore>((set) => ({
    url: undefined,
    isOpen: false,
    //whever we are onOpen we set url:undefined explicitly
    //in case we call onReplace somewhere and somehow we forget to reset that even though the onClose will set the url to undefined
    //it will be weird that it is left at that state and cause some unexpected error
    //avoid accidentally replace an image
    onOpen: () => set({isOpen: true, url: undefined}),
    onClose: () => set({isOpen: false, url: undefined}),
    onReplace: (url) => set({isOpen: true, url})
}))