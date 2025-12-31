// --- Modal Logic Utility ---
const initializeModal = (options) => {
    const { modal, panel, openBtns, closeBtn, backdrop, onClose } = options;
    if (!modal || !panel || !closeBtn || !backdrop) return;

    const open = (e) => {
        if (e) e.preventDefault();
        // Scroll Lock
        document.body.classList.add('overflow-hidden');

        modal.classList.remove('hidden');
        setTimeout(() => {
            if (panel.classList.contains('translate-x-full')) {
                panel.classList.remove('translate-x-full'); // Slide-in
            } else {
                panel.classList.remove('opacity-0', 'scale-95'); // Quick-view fade-in
            }
        }, 20);
    };

    const close = () => {
        // Unlock Scroll
        document.body.classList.remove('overflow-hidden');

        if (panel.classList.contains('transition-transform')) {
            panel.classList.add('translate-x-full'); // Slide-out
            setTimeout(() => {
                modal.classList.add('hidden');
                if (onClose) onClose();
            }, 500);
        } else {
            panel.classList.add('opacity-0', 'scale-95'); // Quick-view fade-out
            setTimeout(() => {
                modal.classList.add('hidden');
                if (onClose) onClose();
            }, 300);
        }
    };

    if (openBtns && openBtns.length > 0) {
        openBtns.forEach(btn => {
            if (btn) btn.addEventListener('click', open); // Guard for each button
        });
    }

    closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', close);

    return { open, close }; // Return controls for manual use
};
