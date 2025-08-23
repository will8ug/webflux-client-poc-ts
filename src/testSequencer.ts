// Test sequencer for integration tests
export default class TestSequencer {
  private static instance: TestSequencer;
  private testOrder: string[] = [];

  static getInstance(): TestSequencer {
    if (!TestSequencer.instance) {
      TestSequencer.instance = new TestSequencer();
    }
    return TestSequencer.instance;
  }

  addTest(testName: string): void {
    this.testOrder.push(testName);
  }

  getTestOrder(): string[] {
    return this.testOrder;
  }

  clear(): void {
    this.testOrder = [];
  }
}
