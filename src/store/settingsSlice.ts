import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// ayarlar
export interface SettingsState {
  autoplay: boolean;
  continueRow: boolean;
  previews: boolean;
  emailNotifications: boolean;
  dataSaver: boolean;
}

const settingsInitial: SettingsState = {
  autoplay: true,
  continueRow: true,
  previews: true,
  emailNotifications: true,
  dataSaver: false,
};

export const settings = createSlice({
  name: "settings",
  initialState: settingsInitial,
  reducers: {
    setSetting(
      state,
      action: PayloadAction<{ key: keyof SettingsState; value: boolean }>,
    ) {
      state[action.payload.key] = action.payload.value;
    },
  },
});

export const { setSetting } = settings.actions;
