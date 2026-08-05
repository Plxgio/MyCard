(() => {
    const body = document.body;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const find = (selector, parent = document) => parent.querySelector(selector);
    const findAll = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));
    const requireElement = (selector, parent = document) => {
        const element = find(selector, parent);

        if (!element) {
            throw new Error(`No se encontró el elemento requerido: ${selector}`);
        }

        return element;
    };

    function failOpen(error) {
        console.error("No se pudo iniciar la interfaz completa.", error);

        find("#welcomeScreen")?.setAttribute("hidden", "");
        find("#entryGate")?.setAttribute("hidden", "");
        find("#pageShell")?.removeAttribute("inert");
        find("#skipLink")?.removeAttribute("tabindex");
        body.classList.remove("entry-active", "is-switching");
    }

    try {
        initializeSite();
    } catch (error) {
        failOpen(error);
    }

    function initializeSite() {
        const modeButtons = findAll("[data-mode-target]");
        const entryButtons = findAll("[data-entry-mode]");
        const profileModeContent = findAll("[data-profile-content]");
        const badgeTriggers = findAll(".badge-trigger");
        const feedTabs = findAll("[data-feed-filter]");
        const feedJumpButtons = findAll("[data-feed-jump]");
        const feedPosts = findAll("[data-feed-category]");
        const postExpandButtons = findAll(".post-expand-toggle");

        const mainCopy = requireElement(".social-copy--main");
        const hobbieCopy = requireElement(".social-copy--hobbie");
        const birthdayCountdown = requireElement("#birthdayCountdown");
        const profileLocalTime = requireElement("#profileLocalTime");
        const developerStatus = requireElement("#developerStatus");
        const developerStatusIcon = requireElement(".dev-status-icon", developerStatus);
        const discordReveal = requireElement("#discordReveal");
        const discordToggle = requireElement("#discordToggle");
        const discordHandle = requireElement("#discordHandle");
        const profileAvatarButton = requireElement("#profileAvatarButton");
        const profileDialog = requireElement("#profileDialog");
        const profileDialogClose = requireElement("#profileDialogClose");
        const profileDialogImage = requireElement("#profileDialogImage");
        const profileDialogTitle = requireElement("#profileDialogTitle");
        const profileDialogDescription = requireElement("#profileDialogDescription");
        const socialFeed = requireElement(".social-feed");
        const welcomeScreen = requireElement("#welcomeScreen");
        const welcomeEnter = requireElement("#welcomeEnter");
        const entryGate = requireElement("#entryGate");
        const mainContent = requireElement("#content");
        const pageShell = requireElement("#pageShell");
        const skipLink = requireElement("#skipLink");
        const mainCover = requireElement(".cover-layer--main");
        const hobbieCover = requireElement(".cover-layer--hobbie");
        const profileAvatarLayers = findAll(".profile-avatar .avatar-layer");

        pageShell.setAttribute("inert", "");

        let transitionTimer;
        let clockTimer;
        let lastDeveloperState = "";

        const argentinaClockFormatter = new Intl.DateTimeFormat("es-AR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hourCycle: "h23",
            timeZone: "America/Argentina/Buenos_Aires"
        });

        const argentinaHourFormatter = new Intl.DateTimeFormat("en-GB", {
            hour: "2-digit",
            hourCycle: "h23",
            timeZone: "America/Argentina/Buenos_Aires"
        });

        const birthdayDateFormatter = new Intl.DateTimeFormat("en-CA", {
            year: "numeric",
            month: "numeric",
            day: "numeric",
            timeZone: "America/Argentina/Buenos_Aires"
        });

        function storeMode(mode) {
            try {
                localStorage.setItem("plxgio-developer-mode", mode);
            } catch (_) {
                // El cambio visual no depende del almacenamiento del navegador.
            }
        }

        function updateBirthdayCountdown() {
            const dateParts = Object.fromEntries(
                birthdayDateFormatter.formatToParts(new Date())
                    .filter((part) => part.type !== "literal")
                    .map((part) => [part.type, Number(part.value)])
            );
            const today = Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day);
            let nextBirthday = Date.UTC(dateParts.year, 1, 28);

            if (today > nextBirthday) {
                nextBirthday = Date.UTC(dateParts.year + 1, 1, 28);
            }

            const remainingDays = Math.round((nextBirthday - today) / 86400000);

            if (remainingDays === 0) {
                birthdayCountdown.textContent = "hoy";
            } else if (remainingDays === 1) {
                birthdayCountdown.textContent = "falta 1 día";
            } else {
                birthdayCountdown.textContent = `faltan ${remainingDays} días`;
            }
        }

        function updateArgentinaTime() {
            const now = new Date();
            const localHour = Number(argentinaHourFormatter.format(now));
            const isActive = localHour >= 6 && localHour < 21;
            const nextState = isActive ? "active" : "away";

            profileLocalTime.textContent = `Hora local - ${argentinaClockFormatter.format(now)}`;

            if (nextState === lastDeveloperState) return;

            lastDeveloperState = nextState;
            developerStatus.classList.toggle("is-active", isActive);
            developerStatus.classList.toggle("is-away", !isActive);
            developerStatusIcon.textContent = "{ }";

            const statusCopy = isActive ? "Developer activo" : "Developer en descanso";
            developerStatus.dataset.tooltip = statusCopy;
            developerStatus.setAttribute("aria-label", statusCopy);
        }

        function scheduleClock() {
            window.clearTimeout(clockTimer);

            if (document.hidden) return;

            updateArgentinaTime();
            clockTimer = window.setTimeout(scheduleClock, 1010 - (Date.now() % 1000));
        }

        function closeBadgePopovers(returnFocus = false) {
            const openTrigger = find(".badge-trigger[aria-expanded='true']");

            badgeTriggers.forEach((trigger) => {
                const item = trigger.closest(".badge-popover-item");
                const popover = find(`#${trigger.getAttribute("aria-controls")}`);

                trigger.setAttribute("aria-expanded", "false");
                trigger.removeAttribute("aria-describedby");
                item?.classList.remove("is-open");
                popover?.setAttribute("aria-hidden", "true");
            });

            if (returnFocus) {
                openTrigger?.focus();
            }
        }

        function toggleBadgePopover(trigger) {
            const item = trigger.closest(".badge-popover-item");
            const popoverId = trigger.getAttribute("aria-controls");
            const popover = find(`#${popoverId}`);
            const wasOpen = trigger.getAttribute("aria-expanded") === "true";

            closeBadgePopovers();

            if (wasOpen || !item || !popover) return;

            trigger.setAttribute("aria-expanded", "true");
            trigger.setAttribute("aria-describedby", popoverId);
            item.classList.add("is-open");
            popover.setAttribute("aria-hidden", "false");
        }

        function setFeedFilter(filter, animate = true) {
            const selectedTab = feedTabs.find((tab) => tab.dataset.feedFilter === filter);

            if (!selectedTab) return;

            feedTabs.forEach((tab) => {
                tab.setAttribute("aria-pressed", String(tab === selectedTab));
            });

            feedPosts.forEach((post) => {
                const belongsToMode = !post.dataset.profileMode
                    || post.dataset.profileMode === body.dataset.mode;
                const isVisible = belongsToMode && post.dataset.feedCategory === filter;

                post.hidden = !isVisible;
                post.classList.remove("feed-post-enter");

                if (isVisible && animate && !reduceMotion.matches) {
                    window.requestAnimationFrame(() => post.classList.add("feed-post-enter"));
                }
            });

            socialFeed.setAttribute(
                "aria-label",
                `Contenido ${body.dataset.mode}: ${selectedTab.textContent.trim()}`
            );
        }

        function syncModeInterface(mode) {
            const isHobbie = mode === "hobbie";

            modeButtons.forEach((button) => {
                button.setAttribute("aria-pressed", String(button.dataset.modeTarget === mode));
            });

            mainCopy.setAttribute("aria-hidden", String(isHobbie));
            hobbieCopy.setAttribute("aria-hidden", String(!isHobbie));
            mainCover.setAttribute("aria-hidden", String(isHobbie));
            hobbieCover.setAttribute("aria-hidden", String(!isHobbie));

            profileAvatarLayers.forEach((image) => {
                const belongsToHobbie = image.classList.contains("avatar-layer--hobbie");
                image.setAttribute("aria-hidden", String(belongsToHobbie !== isHobbie));
            });

            profileModeContent.forEach((section) => {
                section.hidden = section.dataset.profileContent !== mode;
            });

            profileAvatarButton.setAttribute(
                "aria-label",
                isHobbie ? "Ampliar foto del perfil Hobbie" : "Ampliar logo personal"
            );

            closeBadgePopovers();

            const activeFilter = feedTabs.find((tab) => tab.getAttribute("aria-pressed") === "true")
                ?.dataset.feedFilter || "projects";
            setFeedFilter(activeFilter, false);
        }

        function setMode(nextMode) {
            if (nextMode !== "main" && nextMode !== "hobbie") return;

            storeMode(nextMode);

            if (nextMode === body.dataset.mode) {
                syncModeInterface(nextMode);
                return;
            }

            window.clearTimeout(transitionTimer);
            body.classList.remove("is-switching");

            if (!reduceMotion.matches) {
                body.classList.add("is-switching");
            }

            body.dataset.mode = nextMode;
            syncModeInterface(nextMode);

            transitionTimer = window.setTimeout(() => {
                body.classList.remove("is-switching");
            }, reduceMotion.matches ? 0 : 950);
        }

        function openProfileDialog() {
            const isHobbie = body.dataset.mode === "hobbie";

            profileDialogImage.src = isHobbie ? "img/icon.jpg" : "img/main-profile.png";
            profileDialogImage.alt = isHobbie
                ? "Foto de perfil de Plxgio en modo Hobbie"
                : "Logo personal ampliado de Plxgio";
            profileDialogTitle.textContent = isHobbie ? "Perfil Hobbie" : "Logo personal";
            profileDialogDescription.textContent = isHobbie
                ? "Imagen utilizada para representar mi perfil personal y el lado menos profesional de mis proyectos."
                : "Mi logo personal simula la estructura craneal de un perro, con una “x” en el medio por ser mi letra preferida y la que utilizo en mi nombre.";
            profileDialog.showModal();
        }

        function setDiscordReveal(open) {
            discordReveal.classList.toggle("is-open", open);
            discordToggle.setAttribute("aria-expanded", String(open));
            discordHandle.setAttribute("aria-hidden", String(!open));
            discordToggle.setAttribute(
                "aria-label",
                open ? "Ocultar usuario de Discord" : "Mostrar usuario de Discord"
            );
        }

        function openModeSelection() {
            if (welcomeScreen.classList.contains("is-leaving")) return;

            welcomeEnter.disabled = true;
            welcomeScreen.classList.add("is-leaving");

            window.setTimeout(() => {
                welcomeScreen.hidden = true;
                welcomeScreen.setAttribute("aria-hidden", "true");
                entryGate.removeAttribute("inert");
                entryGate.setAttribute("aria-hidden", "false");
                entryButtons[0]?.focus({ preventScroll: true });
            }, reduceMotion.matches ? 0 : 780);
        }

        function enterSelectedMode(mode) {
            if (entryGate.classList.contains("is-leaving")) return;

            entryButtons.forEach((button) => {
                button.disabled = true;
            });

            setMode(mode);
            entryGate.dataset.choice = mode;
            entryGate.classList.add("is-leaving");

            window.setTimeout(() => {
                entryGate.hidden = true;
                entryGate.setAttribute("aria-hidden", "true");
                body.classList.remove("entry-active");
                pageShell.removeAttribute("inert");
                skipLink.removeAttribute("tabindex");
                mainContent.focus({ preventScroll: true });
            }, reduceMotion.matches ? 0 : 980);
        }

        badgeTriggers.forEach((trigger) => {
            trigger.addEventListener("click", () => toggleBadgePopover(trigger));
        });

        feedTabs.forEach((tab) => {
            tab.addEventListener("click", () => setFeedFilter(tab.dataset.feedFilter));
        });

        feedJumpButtons.forEach((button) => {
            button.addEventListener("click", () => {
                const targetTab = feedTabs.find((tab) => tab.dataset.feedFilter === button.dataset.feedJump);

                if (!targetTab) return;

                setFeedFilter(button.dataset.feedJump);
                targetTab.focus({ preventScroll: true });
                targetTab.closest(".feed-tabs")?.scrollIntoView({
                    behavior: reduceMotion.matches ? "auto" : "smooth",
                    block: "start"
                });
            });
        });

        feedPosts.forEach((post) => {
            post.addEventListener("animationend", () => post.classList.remove("feed-post-enter"));
        });

        postExpandButtons.forEach((button) => {
            button.addEventListener("click", () => {
                const post = button.closest(".social-post");
                const moreContent = find(`#${button.getAttribute("aria-controls")}`);
                const willExpand = button.getAttribute("aria-expanded") !== "true";

                if (!post || !moreContent) return;

                button.setAttribute("aria-expanded", String(willExpand));
                requireElement("span", button).textContent = willExpand ? "Ver menos" : "Ver más";
                moreContent.setAttribute("aria-hidden", String(!willExpand));
                post.classList.toggle("is-expanded", willExpand);
            });
        });

        modeButtons.forEach((button) => {
            button.addEventListener("click", () => setMode(button.dataset.modeTarget));
        });

        entryButtons.forEach((button) => {
            button.addEventListener("click", () => enterSelectedMode(button.dataset.entryMode));
        });

        welcomeEnter.addEventListener("click", openModeSelection);
        profileAvatarButton.addEventListener("click", openProfileDialog);
        profileDialogClose.addEventListener("click", () => profileDialog.close());
        profileDialog.addEventListener("click", (event) => {
            if (event.target === profileDialog) profileDialog.close();
        });

        discordToggle.addEventListener("click", (event) => {
            event.stopPropagation();
            setDiscordReveal(!discordReveal.classList.contains("is-open"));
        });

        document.addEventListener("click", (event) => {
            if (!event.target.closest(".badge-popover-item")) closeBadgePopovers();
            if (!discordReveal.contains(event.target)) setDiscordReveal(false);
        });

        document.addEventListener("keydown", (event) => {
            if (event.key !== "Escape") return;

            if (find(".badge-popover-item.is-open")) closeBadgePopovers(true);

            if (discordReveal.classList.contains("is-open")) {
                setDiscordReveal(false);
                discordToggle.focus();
            }
        });

        document.addEventListener("visibilitychange", () => {
            if (!document.hidden) updateBirthdayCountdown();
            scheduleClock();
        });

        updateBirthdayCountdown();
        scheduleClock();
        setDiscordReveal(false);
        syncModeInterface(body.dataset.mode);
    }
})();
