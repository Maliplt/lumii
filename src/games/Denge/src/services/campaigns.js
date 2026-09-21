"use strict";
const DengeCampaignData = (() => {
  const LEVEL_NUMBER = /^[1-9]\d{0,99}$/;

  function freshSeed() {
    return globalThis.crypto?.getRandomValues
      ? globalThis.crypto.getRandomValues(new Uint32Array(1))[0]
      : Date.now() >>> 0;
  }

  function normalizeRecords(records) {
    return Object.fromEntries(
      Object.entries(records || {})
        .filter(
          ([key, value]) =>
            LEVEL_NUMBER.test(key) && value && typeof value === "object",
        )
        .map(([key, value]) => [
          key,
          {
            board: value.board,
            stars:
              Number.isInteger(value.stars) &&
              value.stars >= 0 &&
              value.stars <= 3
                ? value.stars
                : 0,
            best:
              Number.isFinite(value.best) && value.best > 0
                ? value.best
                : null,
          },
        ]),
    );
  }

  function loadCampaign(storage, index) {
    try {
      const saved = JSON.parse(
        storage.get(`journey.v3.${index}`) ||
          (index === 0 ? storage.get("journey.v2.0") : null),
      );
      if (
        saved &&
        Number.isInteger(saved.seed) &&
        typeof saved.next === "string" &&
        LEVEL_NUMBER.test(saved.next) &&
        Array.isArray(saved.recent)
      ) {
        return new Campaign(
          saved.seed,
          saved.next,
          saved.recent.filter((value) => typeof value === "string").slice(-128),
          normalizeRecords(saved.records),
        );
      }
    } catch {
      // A corrupt record must not prevent the game from opening.
    }
    return new Campaign(freshSeed());
  }

  function loadCampaigns(storage) {
    return [0, 1].map((index) => loadCampaign(storage, index));
  }

  function loadHintWallet(storage) {
    try {
      return new HintWallet(JSON.parse(storage.get("hints.v1")) || {});
    } catch {
      return new HintWallet();
    }
  }

  function totalStars(campaigns) {
    return campaigns.reduce(
      (sum, campaign) =>
        sum +
        Object.values(campaign.records).reduce(
          (campaignStars, record) => campaignStars + (record.stars || 0),
          0,
        ),
      0,
    );
  }

  return Object.freeze({ loadCampaigns, loadHintWallet, totalStars });
})();

if (typeof module !== "undefined" && module.exports)
  module.exports = DengeCampaignData;
