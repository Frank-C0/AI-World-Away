import { create } from 'zustand';

export type ActiveModal = 'tables' | 'charts' | 'stats' | null;

interface UIState {
  activeModal: ActiveModal;
  setActiveModal: (modal: ActiveModal) => void;
  toggleModal: (modal: Exclude<ActiveModal, null>) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  activeModal: null,
  setActiveModal: (activeModal) => set({ activeModal }),
  toggleModal: (modal) => {
    const { activeModal } = get();
    set({ activeModal: activeModal === modal ? null : modal });
  },
  closeModal: () => set({ activeModal: null }),
}));
