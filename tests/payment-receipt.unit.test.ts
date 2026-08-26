import { afterEach, describe, expect, test, vi } from "vitest";
import { getPlan } from "../src/lib/subscription";
import { processPayment } from "../src/services/payment";

describe("Ödeme makbuzu", () => {
  afterEach(() => vi.useRealTimers());

  test("Makbuzda kartın sadece son dört hanesi görünmeli", async () => {
    vi.useFakeTimers();
    const payment = processPayment(
      getPlan("standard"),
      "mali.polatkesen@tenet.test",
      {
        cardNumber: "4111 1111 1111 4242",
        address: "  Bağdat Caddesi 10  ",
        district: " Kadıköy ",
        city: " İstanbul ",
        postalCode: " 34710 ",
      },
      true,
    );
    await vi.runAllTimersAsync();
    const receipt = await payment;

    expect(receipt).toMatchObject({
      planId: "standard",
      planName: "Temel",
      amount: "₺139",
      email: "mali.polatkesen@tenet.test",
      paymentMethod: "•••• 4242",
      billingAddress: "Bağdat Caddesi 10, Kadıköy, İstanbul, 34710",
      marketingConsent: true,
      termsAccepted: true,
    });

    // kart numarası saklanmaz
    expect(JSON.stringify(receipt)).not.toContain("4111111111114242");
    expect(JSON.stringify(receipt)).not.toContain("4111 1111 1111 4242");
  });

  test("Boş adres alanları makbuza eklenmemeli", async () => {
    vi.useFakeTimers();
    const payment = processPayment(
      getPlan("premium"),
      "mali.polatkesen@tenet.test",
      {
        cardNumber: "5555-5555-5555-9090",
        address: "Moda Caddesi 5",
        district: "",
        city: "İstanbul",
        postalCode: " ",
      },
      false,
    );
    await vi.runAllTimersAsync();
    const receipt = await payment;

    expect(receipt.billingAddress).toBe("Moda Caddesi 5, İstanbul");
    expect(receipt.paymentMethod).toBe("•••• 9090");
    expect(receipt.marketingConsent).toBe(false);
  });
});
