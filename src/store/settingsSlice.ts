import { createSlice } from "@reduxjs/toolkit";

// ayarlar
export interface SettingsState {
  continueRow: boolean;
  previews: boolean;
  emailNotifications: boolean;
  dataSaver: boolean;
}

export const settingsInitial: SettingsState = {
  continueRow: true,
  previews: true,
  emailNotifications: true,
  dataSaver: false,
};

export const settings = createSlice({
  name: "settings",
  initialState: settingsInitial,
  reducers: {},
});
