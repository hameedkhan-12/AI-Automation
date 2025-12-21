"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

interface ModalProviderProps {
  children: React.ReactNode;
}

export type ModalData = {};

type ModalContextType = {
  data: ModalData;
  isOpen: boolean;
  setOpen: (modal: React.ReactNode, fetchedData?: () => Promise<any>) => void;
  setClose: () => void;
};

export const ModalContext = createContext<ModalContextType | undefined>({
  data: {},
  isOpen: false,
  setOpen: (modal: React.ReactNode, fetchedData?: () => Promise<any>) => {},
  setClose: () => {},
});

const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<ModalData>({});
  const [showingModal, setShowingModal] = useState<React.ReactNode>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, [])

  const setOpen = async(modal: React.ReactNode, fetchedData?: () => Promise<any>) => {
    const result = await fetchedData?.()
    if(modal) {
        setData(prev => ({
            ...prev, ...result
        }))

        setShowingModal(modal)
        setIsOpen(true)
    }
  }

  const setClose = () => {
    setIsOpen(false)
    setData({})
  }

  if(!isMounted) return null;
  return (
    <ModalContext.Provider value={{ data, setOpen, setClose, isOpen }}>
      {children}
      {showingModal}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if(!context) throw new Error('useModal must be used within a ModalProvider');
    return context;
}

export default ModalProvider;
