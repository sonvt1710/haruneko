<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { PasswordInput } from 'carbon-components-svelte';
    import type { Secret } from '../../../../engine/SettingsManager';
    import { Locale } from '../../stores/Settings';
    import SettingItem from './SettingItem.svelte';

    export let setting: Secret;
    let value: string = setting.Value;

    $: setting.Value = value;

    onMount(() => {
        setting.Subscribe(OnValueChanged);
    });
    onDestroy(() => {
        setting.Unsubscribe(OnValueChanged);
    });

    function OnValueChanged(newValue: string) {
        value = newValue;
    }
</script>

<SettingItem
    labelText={$Locale[setting.Label]()}
    helperText={$Locale[setting.Description]()}
>
    <PasswordInput hideLabel bind:value />
</SettingItem>
