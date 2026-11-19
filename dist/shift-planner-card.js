const editorTranslations = {
    en: {
        entity: "Shift Planner sensor",
        title: "Title",
        week: "Starting week",
        current: "This week",
        next: "Next week",
        weekHelp: "Defaults to this week",
        missingEntity: "Specify the Shift Planner sensor",
        invalidWeek: "Week must be current or next",
    },
    de: {
        entity: "Shift-Planner-Sensor",
        title: "Titel",
        week: "Startwoche",
        current: "Diese Woche",
        next: "Nächste Woche",
        weekHelp: "Standard: Diese Woche",
        missingEntity: "Wähle den Shift-Planner-Sensor aus",
        invalidWeek: "Die Startwoche muss „Diese Woche“ oder „Nächste Woche“ sein",
    },
};

function getEditorTranslations() {
    // Home Assistant sets the document language to the user's interface language.
    const language = document.documentElement.lang.toLowerCase().split("-")[0];
    return language === "de" ? editorTranslations.de : editorTranslations.en;
}

class ShiftPlannerCard extends HTMLElement {
    static getConfigForm() {
        const messages = getEditorTranslations();
        return {
            schema: [
                {
                    name: "entity",
                    required: true,
                    selector: {
                        entity: {
                            filter: { domain: "sensor", integration: "shift_planner" },
                        },
                    },
                },
                { name: "title", selector: { text: {} } },
                {
                    name: "week",
                    selector: {
                        select: {
                            mode: "dropdown",
                            options: [
                                { value: "current", label: messages.current },
                                { value: "next", label: messages.next },
                            ],
                        },
                    },
                },
            ],
            computeLabel: ({ name }) => ({
                entity: messages.entity,
                title: messages.title,
                week: messages.week,
            })[name],
            computeHelper: ({ name }) =>
                name === "week" ? messages.weekHelp : undefined,
        };
    }

    static getStubConfig(hass, entities = [], entitiesFallback = []) {
        const states = hass?.states ?? {};
        const registry = hass?.entities ?? {};
        const entity = [
            ...entities,
            ...entitiesFallback,
            ...Object.keys(states),
        ].find((id) => {
            if (!id.startsWith("sensor.")) return false;
            const platform = registry[id]?.platform;
            if (platform) return platform === "shift_planner";
            const attributes = states[id]?.attributes;
            return (
                Array.isArray(attributes?.days) &&
                Array.isArray(attributes?.shifts)
            );
        });

        return entity ? { entity, week: "current" } : { week: "current" };
    }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._busy = false;
        this._error = "";
    }

    setConfig(config) {
        if (!config.entity) {
            throw new Error(getEditorTranslations().missingEntity);
        }

        if (config.week && !["current", "next"].includes(config.week)) {
            throw new Error(getEditorTranslations().invalidWeek);
        }

        this._config = config;
        this._week = config.week === "next" ? 1 : 0;
        this._render();
    }

    set hass(hass) {
        const previous = this._entity;
        this._hass = hass;
        this._entity = hass.states[this._config?.entity];

        if (previous !== this._entity) {
            this._render();
        }
    }

    set preview(preview) {
        if (this._preview === preview) return;
        this._preview = preview;
        this._render();
    }

    getCardSize() {
        return 12;
    }

    getGridOptions() {
        return {
            columns: 12,
            rows: "auto",
            min_columns: 6,
        };
    }

    _element(tag, text, className) {
        const element = document.createElement(tag);

        if (text !== undefined) element.textContent = text;
        if (className) element.className = className;

        return element;
    }

    async _run(action) {
        this._busy = true;
        this._error = "";
        this._render();

        try {
            await action();
        } catch (error) {
            this._error = error.message || String(error);
        } finally {
            this._busy = false;
            this._render();
        }
    }

    _render() {
        if (!this._config || !this._hass) return;

        const entity = this._hass.states[this._config.entity];
        const available =
            entity && !["unknown", "unavailable"].includes(entity.state);
        const attributes = available ? entity.attributes : null;

        this.shadowRoot.innerHTML = `
      <style>
        ha-card {
          padding: 16px;
        }
        h2 {
          margin: 0 0 12px;
          font-size: 20px;
        }
        nav {
          display: flex;
          border-bottom: 1px solid var(--divider-color);
          margin-bottom: 12px;
        }
        button {
          font: inherit;
          color: var(--primary-text-color);
          background: var(--card-background-color);
          border: 1px solid var(--divider-color);
          border-radius: 8px;
          padding: 10px 6px;
          cursor: pointer;
          min-height: 44px;
        }
        nav button {
          flex: 1;
          padding: 8px 12px;
          border: 0;
          border-bottom: 3px solid transparent;
          border-radius: 0;
          background: transparent;
          color: var(--secondary-text-color);
        }
        nav button[aria-pressed="true"] {
          border-bottom-color: var(--primary-color);
          color: var(--primary-color);
          font-weight: bold;
        }
        button:focus-visible {
          outline: 3px solid var(--primary-color);
        }
        button:disabled {
          cursor: default;
          opacity: 0.55;
        }
        .day {
          margin-top: 12px;
        }
        .label {
          font-weight: 500;
          margin-bottom: 5px;
        }
        .row {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 5px;
          padding: 5px;
          border-radius: 10px;
        }
        .free button {
          background: var(--success-color, #43a047);
          color: #ffffff;
          border-color: var(--success-color, #43a047);
        }
        .occupied button {
          background: var(--secondary-background-color, #eeeeee);
          color: var(--secondary-text-color, #757575);
          opacity: 1;
        }
        .occupied button:not(:disabled):not(.match):hover {
          border-color: var(--primary-color);
        }
        .row .match {
          background: #d32f2f;
          color: #ffffff;
          border-color: #d32f2f;
          opacity: 1;
          font-weight: bold;
        }
        .error {
          color: var(--error-color);
          white-space: pre-wrap;
        }
      </style>
      <ha-card></ha-card>
    `;

        const card = this.shadowRoot.querySelector("ha-card");
        card.append(
            this._element("h2", this._config.title || "Dienstplan")
        );

        const navigation = this._element("nav");

        ["Diese Woche", "Nächste Woche"].forEach((label, index) => {
            const button = this._element("button", label);
            button.setAttribute(
                "aria-pressed",
                String(this._week === index)
            );
            button.disabled = this._busy;
            button.onclick = () => {
                this._week = index;
                this._render();
            };
            navigation.append(button);
        });

        card.append(navigation);

        if (this._error) {
            const error = this._element("p", this._error, "error");
            error.setAttribute("role", "alert");
            card.append(error);
        }

        if (!available) {
            card.append(this._element(
                "p",
                `Sensor ${this._config.entity} ist nicht verfügbar.`
            ));
            return;
        }

        if (
            !Array.isArray(attributes.days) ||
            !Array.isArray(attributes.shifts)
        ) {
            card.append(this._element(
                "p",
                "Kein gültiger Shift-Planner-Sensor.",
                "error"
            ));
            return;
        }

        const days = attributes.days.slice(
            this._week * 7,
            this._week * 7 + 7
        );

        for (const day of days) {
            const occupied = day.summaries.length > 0;
            const updatable = day.summaries.length === 1;
            const section = this._element("section", undefined, "day");

            const date = new Date(`${day.date}T12:00:00Z`);
            const label = new Intl.DateTimeFormat("de-DE", {
                weekday: "long",
                day: "2-digit",
                month: "2-digit",
                timeZone: "UTC",
            }).format(date);

            section.append(this._element("div", label, "label"));

            const row = this._element(
                "div",
                undefined,
                `row ${occupied ? "occupied" : "free"}`
            );
            row.setAttribute("role", "group");
            row.setAttribute("aria-label", label);

            for (const shift of attributes.shifts) {
                const selected = day.summaries.includes(shift.id);
                const button = this._element(
                    "button",
                    shift.label,
                    selected ? "match" : ""
                );

                button.disabled =
                    (occupied && (!updatable || selected)) ||
                    this._busy ||
                    this._preview === true;
                button.setAttribute("aria-pressed", String(selected));
                const timeRange = shift.end
                    ? `${shift.start}-${shift.end}`
                    : shift.start;
                button.title = `${shift.id}, ${timeRange}`;

                button.onclick = () => this._run(() =>
                    this._hass.callService(
                        "shift_planner",
                        occupied ? "update_shift" : "create_shift",
                        {
                            config_entry_id: attributes.config_entry_id,
                            date: day.date,
                            shift: shift.id,
                        }
                    )
                );

                row.append(button);
            }

            section.append(row);

            card.append(section);
        }
    }
}

if (!customElements.get("shift-planner-card")) {
    customElements.define("shift-planner-card", ShiftPlannerCard);

    window.customCards = window.customCards || [];
    window.customCards.push({
        type: "shift-planner-card",
        name: "Shift Planner",
        description: "Plan shifts for this week or next week",
    });
}