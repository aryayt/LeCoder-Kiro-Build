/**
 * Basic setup test to ensure Jest and testing environment are working
 */
describe("Project Setup", () => {
	it("should have Jest configured correctly", () => {
		expect(true).toBe(true);
	});

	it("should have TypeScript types working", () => {
		const testString: string = "LeCodeR MVP";
		const testNumber: number = 42;

		expect(typeof testString).toBe("string");
		expect(typeof testNumber).toBe("number");
	});
});
