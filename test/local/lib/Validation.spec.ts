import Validation from "../../../src/lib/Validation";

describe("Validation.ts", () => {
  describe("validateRequestBodyForSaving", () => {
    it("引数の文字列が正しい場合, trueを返す", () => {
      expect(
        Validation.validateRequestBodyForSaving(
          JSON.stringify({
            cardId: "XXXXXXXXXXXXXXXX",
            userId: "0000000000",
            name: "name",
          })
        )
      ).toBeTruthy();
    });

    it("引数の文字列が正しくない場合、falseを返す", () => {
      expect(
        Validation.validateRequestBodyForSaving(
          JSON.stringify({
            cardId: "XX",
            userId: "0000000000",
            name: "name",
          })
        )
      ).toBeFalsy();

      expect(
        Validation.validateRequestBodyForSaving(
          JSON.stringify({
            cardId: "XXXXXXXXXXXXXXXX",
            userId: "aaaaaaaaaa",
            name: "name",
          })
        )
      ).toBeFalsy();

      expect(
        Validation.validateRequestBodyForSaving(
          JSON.stringify({
            cardId: "XXXXXXXXXXXXXXXX",
            userId: "aaaaaaaaaa",
          })
        )
      ).toBeFalsy();
    });

    it("引数がnullの場合、falseを返す", () => {
      expect(Validation.validateRequestBodyForSaving(null)).toBeFalsy();
    });
  });

  describe("validateRequestBodyForEntering", () => {
    it("引数の文字列が正しい場合、trueを返す", () => {
      expect(
        Validation.validateRequestBodyForEntering(
          JSON.stringify({
            purpose: "STUDY",
          })
        )
      ).toBeTruthy();
    });

    it("引数の文字列が正しくない場合、falseを返す", () => {
      expect(
        Validation.validateRequestBodyForEntering(
          JSON.stringify({
            hoge: "CIRCLE",
          })
        )
      ).toBeFalsy();

      expect(
        Validation.validateRequestBodyForEntering(
          JSON.stringify({
            purpose: "xxxx",
          })
        )
      ).toBeFalsy();
    });

    it("引数がnullの場合、falseを返す", () => {
      expect(Validation.validateRequestBodyForEntering(null)).toBeFalsy();
    });
  });

  describe("validateCardId", () => {
    it("引数の文字列が正しい場合、trueを返す", () => {
      expect(
        Validation.validateCardId({ cardId: "XXXXXXXXXXXXXXXX" })
      ).toBeTruthy();
    });

    it("引数の文字列が正しくない場合、falseを返す", () => {
      expect(Validation.validateCardId({ cardId: "aaaaaaaaaa" })).toBeFalsy();
      expect(Validation.validateCardId({ cardId: "" })).toBeFalsy();
    });

    it("引数がnullの場合、falseを返す", () => {
      expect(Validation.validateCardId(null)).toBeFalsy();
    });
  });
});
