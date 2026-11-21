# ha-shift-planner-card

![Shift Planner icon](brand/icon.png)

Home Assistant card to show the work shift of the current or next week.

Requires the [Shift Planner integration](https://github.com/mrunde/ha-shift-planner)
to be installed and configured in Home Assistant.

Switch between weeks using the tabs. Selected shifts have a red background and
white text. Days without an event remain green and allow you to create a shift.
Past options that would otherwise be colored (the selected shift or **Free** on
an empty day) use dark grey; other options stay light grey. Today's date is bold.
On a day with exactly one event, choose another shift to update that event in
place; days with multiple events cannot be updated.
The card updates automatically when its Home Assistant sensor changes.
The **Free** option uses the integration's `delete_events` service to
remove events that start on the selected day.

Shift buttons are populated from the shifts configured in the integration.
Their configured start and end times are shown in the button tooltip.

## Configure in Home Assistant

Edit your dashboard, select **Add card**, and search for **Shift Planner**.
Choose your **Shift Planner sensor** if one isn't already selected. Optionally
set a **Title** (defaults to `Dienstplan`) and choose the **Starting week**
(defaults to **This week**), then select **Save**.

The visual editor and the **Free**/**Today** labels follow your Home Assistant
profile language. German and English are supported; other languages fall back
to English.

To change these settings later, edit the card from the dashboard. Existing YAML
configurations still work with `type: custom:shift-planner-card`, `entity`, and
the optional `title` and `week` (`current` or `next`) settings.

## Preview

![Shift Planner card with a green Frei option on empty days and the current day highlighted](docs/shift-planner-preview.png)
