# ha-shift-planner-card

![Shift Planner icon](brand/icon.png)

Home Assistant card to show the work shift of the current or next week.

Requires the [Shift Planner integration](https://github.com/mrunde/ha-shift-planner)
to be installed and configured in Home Assistant.

Switch between weeks using the tabs. Selected shifts have a red background and
white text; other shifts on the same day are greyed out and cannot be selected.
Days without a shift remain green and allow you to create a shift. The card
updates automatically when its Home Assistant sensor changes.

Shift buttons are populated from the shifts configured in the integration.
Their configured start and end times are shown in the button tooltip.

## Configure in Home Assistant

Edit your dashboard, select **Add card**, and search for **Shift Planner**.
Choose your **Shift Planner sensor** if one isn't already selected. Optionally
set a **Title** (defaults to `Dienstplan`) and choose the **Starting week**
(defaults to **This week**), then select **Save**.

The visual editor follows your Home Assistant profile language. It supports
German and English and falls back to English for other languages.

To change these settings later, edit the card from the dashboard. Existing YAML
configurations still work with `type: custom:shift-planner-card`, `entity`, and
the optional `title` and `week` (`current` or `next`) settings.

## Preview

![Shift Planner card with week tabs, red selected shifts, greyed-out alternatives, and green available days](docs/shift-planner-preview.png)
