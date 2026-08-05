(() => {
    try {
        const storedMode = localStorage.getItem("plxgio-developer-mode");

        if (storedMode === "main" || storedMode === "hobbie") {
            document.body.dataset.mode = storedMode;
        }
    } catch (_) {
        // La preferencia guardada es opcional.
    }
})();
